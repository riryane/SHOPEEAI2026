// ==========================================================================
// SPX Delivery Risk Monitor — Ops Dashboard JS
// Live connection to Supabase REST API
// ==========================================================================

// ==============================
// CONFIGURATION — Set your Supabase anon key here
// Find it in: Supabase Dashboard → Settings → API → anon/public key
// ==============================
const SUPABASE_URL = 'https://egfeipuqspptnderrfga.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVnZmVpcHVxc3BwdG5kZXJyZmdhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ3MDU2NzAsImV4cCI6MjEwMDI4MTY3MH0.Y9V9W0xKPHk4Vv9TOZwzNePWMX9epasVuR_-CzgRwCk';

const HUB_IDS = ['HUB_A_NORTH', 'HUB_B_CENTRAL', 'HUB_C_SOUTH', 'HUB_D_EAST', 'HUB_E_WEST', 'HUB_F_RIVER'];

// State
let state = {
  hubOps: [],
  parcelHistory: [],
  selectedHub: 'ALL',
  dateRange: 'today',
  lastSynced: null,
  isError: false,
  sortColumn: 'failedRate',
  sortDirection: 'desc',
  latestDataDate: null // auto-detected from API
};

let pollInterval = null;

// DOM Elements
const els = {};

document.addEventListener('DOMContentLoaded', () => {
  cacheElements();
  bindEvents();
  fetchAll();
  startPolling();
});

function cacheElements() {
  els.errorBanner = document.getElementById('errorBanner');
  els.retryBtn = document.getElementById('retryBtn');
  els.refreshBtn = document.getElementById('refreshBtn');
  els.lastSynced = document.getElementById('lastSynced');
  els.syncStatus = document.getElementById('syncStatus');
  els.hubFilter = document.getElementById('hubFilter');
  els.hubTableBody = document.getElementById('hubTableBody');
  els.flaggedList = document.getElementById('flaggedList');
  els.flaggedCount = document.getElementById('flaggedCount');
  els.chartSkeleton = document.getElementById('chartSkeleton');
  els.chartHubLabel = document.getElementById('chartHubLabel');
  els.sortToggle = document.getElementById('sortToggle');
}

function bindEvents() {
  els.retryBtn?.addEventListener('click', () => fetchAll());
  els.refreshBtn?.addEventListener('click', () => {
    els.refreshBtn.classList.add('spinning');
    fetchAll().finally(() => {
      setTimeout(() => els.refreshBtn.classList.remove('spinning'), 600);
    });
  });

  els.hubFilter?.addEventListener('change', (e) => {
    state.selectedHub = e.target.value;
    renderAll();
  });

  // Date filter buttons
  document.querySelectorAll('.date-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.date-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      state.dateRange = btn.dataset.range;
      fetchAll();
    });
  });

  // Table header sort
  document.querySelectorAll('.hub-table thead th[data-sort]').forEach(th => {
    th.addEventListener('click', () => {
      const col = th.dataset.sort;
      if (state.sortColumn === col) {
        state.sortDirection = state.sortDirection === 'asc' ? 'desc' : 'asc';
      } else {
        state.sortColumn = col;
        state.sortDirection = 'desc';
      }
      renderHubTable();
    });
  });

  els.sortToggle?.addEventListener('click', () => {
    state.sortDirection = state.sortDirection === 'asc' ? 'desc' : 'asc';
    renderHubTable();
  });
}

// ==========================================================================
// API Layer
// ==========================================================================

function getDateFilter() {
  // Use latest data date as reference (dataset may not be "today")
  const refDate = state.latestDataDate ? new Date(state.latestDataDate) : new Date();
  let startDate;
  
  switch (state.dateRange) {
    case 'today':
      startDate = new Date(refDate);
      startDate.setHours(0, 0, 0, 0);
      break;
    case '7d':
      startDate = new Date(refDate);
      startDate.setDate(refDate.getDate() - 7);
      break;
    case '30d':
      startDate = new Date(refDate);
      startDate.setDate(refDate.getDate() - 30);
      break;
    default:
      startDate = new Date(refDate);
      startDate.setHours(0, 0, 0, 0);
  }
  return startDate.toISOString().split('T')[0];
}

function getPriorPeriodFilter() {
  const refDate = state.latestDataDate ? new Date(state.latestDataDate) : new Date();
  let days;
  switch (state.dateRange) {
    case 'today': days = 1; break;
    case '7d': days = 7; break;
    case '30d': days = 30; break;
    default: days = 1;
  }
  const priorEnd = new Date(refDate);
  priorEnd.setDate(refDate.getDate() - days);
  const priorStart = new Date(priorEnd);
  priorStart.setDate(priorEnd.getDate() - days);
  return {
    start: priorStart.toISOString().split('T')[0],
    end: priorEnd.toISOString().split('T')[0]
  };
}

async function supabaseQuery(table, params = '') {
  const url = `${SUPABASE_URL}/rest/v1/${table}?${params}`;
  const resp = await fetch(url, {
    headers: {
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'count=exact'
    }
  });
  if (!resp.ok) throw new Error(`API ${resp.status}: ${resp.statusText}`);
  const count = resp.headers.get('content-range');
  const data = await resp.json();
  return { data, count };
}

async function fetchAll() {
  try {
    showLoading(true);

    // First, detect latest data date if not known
    if (!state.latestDataDate) {
      const latestResp = await supabaseQuery(
        'hub_daily_operations',
        'select=date&order=date.desc&limit=1'
      );
      if (latestResp.data && latestResp.data.length > 0) {
        state.latestDataDate = latestResp.data[0].date;
      }
    }

    const dateFilter = getDateFilter();

    // Fetch hub_daily_operations for current period
    const hubOpsPromise = supabaseQuery(
      'hub_daily_operations',
      `date=gte.${dateFilter}&order=date.desc&limit=1000`
    );

    // Fetch parcel_history for current period
    const parcelPromise = supabaseQuery(
      'parcel_history',
      `date=gte.${dateFilter}&order=date.desc&limit=5000`
    );

    // Fetch prior period for trend comparison
    const prior = getPriorPeriodFilter();
    const priorOpsPromise = supabaseQuery(
      'hub_daily_operations',
      `date=gte.${prior.start}&date=lt.${prior.end}&limit=1000`
    );

    const [hubOpsResp, parcelResp, priorOpsResp] = await Promise.all([
      hubOpsPromise, parcelPromise, priorOpsPromise
    ]);

    state.hubOps = hubOpsResp.data || [];
    state.parcelHistory = parcelResp.data || [];
    state.priorOps = priorOpsResp.data || [];
    state.isError = false;
    state.lastSynced = new Date();

    hideError();
    updateSyncStatus(true);
    renderAll();
  } catch (err) {
    console.error('Fetch error:', err);
    state.isError = true;
    showError();
    updateSyncStatus(false);
  } finally {
    showLoading(false);
  }
}

function startPolling() {
  if (pollInterval) clearInterval(pollInterval);
  pollInterval = setInterval(() => fetchAll(), 60000);
}

// ==========================================================================
// Render Functions
// ==========================================================================

function renderAll() {
  renderStats();
  renderHubTable();
  renderFailureChart();
  renderFlaggedQueue();
}

function renderStats() {
  const ops = filterByHub(state.hubOps);
  const priorOps = filterByHub(state.priorOps || []);

  // Current totals
  const totalParcels = ops.reduce((sum, r) => sum + (r.daily_parcel_volume || 0), 0);
  const totalFailed = ops.reduce((sum, r) => sum + (r.daily_failed_deliveries || 0), 0);
  const totalLate = ops.reduce((sum, r) => sum + (r.daily_late_deliveries || 0), 0);
  const failedRate = totalParcels > 0 ? ((totalFailed + totalLate) / totalParcels * 100) : 0;

  // Flagged count from parcel history
  const parcels = filterParcelsByHub(state.parcelHistory);
  const flaggedParcels = parcels.filter(p => p.failure_reason && p.failure_reason !== null);
  const flaggedCount = flaggedParcels.length;

  // Avg resolution time (approximate from attempt_count)
  const avgResolution = parcels.length > 0
    ? Math.round(parcels.reduce((s, p) => s + (p.attempt_count || 1), 0) / parcels.length * 15)
    : 0;

  // Prior period for trends
  const priorTotal = priorOps.reduce((sum, r) => sum + (r.daily_parcel_volume || 0), 0);
  const priorFailed = priorOps.reduce((sum, r) => sum + (r.daily_failed_deliveries || 0), 0);
  const priorLate = priorOps.reduce((sum, r) => sum + (r.daily_late_deliveries || 0), 0);
  const priorRate = priorTotal > 0 ? ((priorFailed + priorLate) / priorTotal * 100) : 0;

  // Render values
  setStatValue('statTotalParcels', formatNumber(totalParcels));
  setStatValue('statFailedRate', failedRate.toFixed(1) + '%');
  setStatValue('statFlagged', formatNumber(flaggedCount));
  setStatValue('statResolution', avgResolution + ' min');

  // Trends
  renderTrend('trendTotalParcels', totalParcels, priorTotal, true);
  renderTrend('trendFailedRate', failedRate, priorRate, false);
  renderTrend('trendFlagged', flaggedCount, 0, false); // no prior flagged data
  renderTrend('trendResolution', avgResolution, 0, false);
}

function renderTrend(elId, current, prior, higherIsGood) {
  const el = document.getElementById(elId);
  if (!el) return;
  if (!prior || prior === 0) {
    el.textContent = '';
    el.className = 'stat-trend neutral';
    return;
  }
  const diff = ((current - prior) / prior * 100).toFixed(1);
  const isUp = current > prior;
  const isGood = higherIsGood ? isUp : !isUp;
  
  el.innerHTML = `${isUp ? '↗' : '↘'} ${Math.abs(diff)}%`;
  el.className = `stat-trend ${isGood ? 'up' : 'down'}`;
}

function setStatValue(cardId, value) {
  const card = document.getElementById(cardId);
  if (!card) return;
  const valEl = card.querySelector('.stat-value');
  if (valEl) {
    valEl.textContent = value;
    valEl.classList.remove('skeleton-text');
  }
}

function renderHubTable() {
  const tbody = els.hubTableBody;
  if (!tbody) return;

  // Aggregate per hub
  const hubData = HUB_IDS.map(hubId => {
    const rows = state.hubOps.filter(r => r.hub_id === hubId);
    const parcels = state.parcelHistory.filter(p => p.hub_id === hubId);
    
    const volume = rows.reduce((s, r) => s + (r.daily_parcel_volume || 0), 0);
    const failed = rows.reduce((s, r) => s + (r.daily_failed_deliveries || 0), 0);
    const riders = rows.length > 0 ? Math.round(rows.reduce((s, r) => s + (r.active_riders || 0), 0) / rows.length) : 0;
    const staff = rows.length > 0 ? Math.round(rows.reduce((s, r) => s + (r.available_sort_staff || 0), 0) / rows.length) : 0;
    const failedRate = volume > 0 ? (failed / volume * 100) : 0;
    const flaggedCount = parcels.filter(p => p.failure_reason != null).length;
    const flaggedPct = parcels.length > 0 ? (flaggedCount / parcels.length * 100) : 0;

    // Trend from prior
    const priorRows = (state.priorOps || []).filter(r => r.hub_id === hubId);
    const priorVol = priorRows.reduce((s, r) => s + (r.daily_parcel_volume || 0), 0);
    const priorFailed = priorRows.reduce((s, r) => s + (r.daily_failed_deliveries || 0), 0);
    const priorRate = priorVol > 0 ? (priorFailed / priorVol * 100) : 0;
    const trendDiff = failedRate - priorRate;

    return {
      hub: hubId,
      volume,
      riders,
      staff,
      failedRate,
      flagged: flaggedPct,
      trendDiff,
      staffing: `${riders}/${staff}`
    };
  });

  // Find highest failure rate hub (priority hub)
  const maxFailRate = Math.max(...hubData.map(h => h.failedRate));
  const priorityHub = hubData.find(h => h.failedRate === maxFailRate && maxFailRate > 0);

  // Sort
  hubData.sort((a, b) => {
    let aVal = a[state.sortColumn];
    let bVal = b[state.sortColumn];
    if (state.sortColumn === 'hub' || state.sortColumn === 'staffing') {
      aVal = String(aVal);
      bVal = String(bVal);
      return state.sortDirection === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
    }
    return state.sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
  });

  // Render
  tbody.innerHTML = hubData.map(h => {
    const isPriority = priorityHub && h.hub === priorityHub.hub;
    const rateClass = h.failedRate > 4 ? 'rate-danger' : h.failedRate > 2.5 ? 'rate-warning' : 'rate-ok';
    const flagClass = h.flagged > 1.2 ? 'rate-danger' : h.flagged > 0.8 ? 'rate-warning' : 'rate-ok';
    const trendDir = h.trendDiff > 0.1 ? 'up' : h.trendDiff < -0.1 ? 'down' : 'flat';
    const trendIcon = trendDir === 'up' ? '↗' : trendDir === 'down' ? '↘' : '→';

    return `<tr class="${isPriority ? 'priority-hub' : ''}" data-hub="${h.hub}">
      <td>
        <span class="hub-name-cell">
          ${h.hub}${isPriority ? '<span class="pilot-badge">Priority Hub</span>' : ''}
        </span>
      </td>
      <td>${formatNumber(h.volume)}</td>
      <td>${h.staffing}</td>
      <td><span class="${rateClass}">${h.failedRate.toFixed(1)}%</span></td>
      <td><span class="${flagClass}">${h.flagged.toFixed(1)}%</span></td>
      <td><span class="trend-arrow ${trendDir}">${trendIcon}</span></td>
    </tr>`;
  }).join('');

  // Click to select hub for chart
  tbody.querySelectorAll('tr').forEach(tr => {
    tr.addEventListener('click', () => {
      const hub = tr.dataset.hub;
      if (hub) {
        els.hubFilter.value = hub;
        state.selectedHub = hub;
        renderFailureChart();
        renderFlaggedQueue();
        updateChartLabel();
      }
    });
    tr.style.cursor = 'pointer';
  });
}

function renderFailureChart() {
  const canvas = document.getElementById('failureChart');
  if (!canvas) return;

  const parcels = filterParcelsByHub(state.parcelHistory);
  const failedParcels = parcels.filter(p => p.failure_reason != null);

  // Group by reason
  const reasonCounts = {};
  failedParcels.forEach(p => {
    const reason = p.failure_reason || 'unknown';
    reasonCounts[reason] = (reasonCounts[reason] || 0) + 1;
  });

  const labels = Object.keys(reasonCounts);
  const data = Object.values(reasonCounts);
  const total = data.reduce((s, v) => s + v, 0);

  // Colors for each reason
  const colorMap = {
    'bad address': '#EE4D2D',
    'customer not available': '#F97316',
    'rider capacity': '#8B5CF6',
    'routing delay': '#3B82F6',
    'hub backlog': '#14B8A6',
    'weather/disruption': '#6B7280'
  };

  const bgColors = labels.map(l => colorMap[l] || '#9CA3AF');

  // Destroy previous chart
  if (window._failureChart) {
    window._failureChart.destroy();
  }

  // Hide skeleton
  if (els.chartSkeleton) els.chartSkeleton.classList.add('hidden');

  if (labels.length === 0) {
    canvas.style.display = 'none';
    if (els.chartSkeleton) {
      els.chartSkeleton.classList.remove('hidden');
      els.chartSkeleton.innerHTML = '<p style="color:#9CA3AF;font-size:13px;text-align:center;padding:40px 0;">No failure data for selected period</p>';
    }
    return;
  }

  canvas.style.display = 'block';

  window._failureChart = new Chart(canvas, {
    type: 'bar',
    data: {
      labels: labels.map(l => formatReasonLabel(l)),
      datasets: [{
        data: data.map(v => total > 0 ? (v / total * 100).toFixed(1) : 0),
        backgroundColor: bgColors,
        borderRadius: 4,
        barThickness: 28
      }]
    },
    options: {
      indexAxis: 'y',
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (ctx) => {
              const idx = ctx.dataIndex;
              return `${data[idx]} parcels (${ctx.raw}%)`;
            }
          }
        }
      },
      scales: {
        x: {
          grid: { color: '#F3F4F6' },
          ticks: {
            callback: v => v + '%',
            font: { size: 11, weight: '600' },
            color: '#9CA3AF'
          },
          max: 100
        },
        y: {
          grid: { display: false },
          ticks: {
            font: { size: 11, weight: '600' },
            color: '#374151'
          }
        }
      }
    }
  });

  updateChartLabel();
}

function renderFlaggedQueue() {
  const list = els.flaggedList;
  if (!list) return;

  const parcels = filterParcelsByHub(state.parcelHistory);
  const flagged = parcels
    .filter(p => p.failure_reason != null)
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 30);

  els.flaggedCount.textContent = `(${flagged.length})`;

  if (flagged.length === 0) {
    list.innerHTML = '<div style="padding:30px 0;text-align:center;color:#9CA3AF;font-size:13px;">No flagged parcels</div>';
    return;
  }

  list.innerHTML = flagged.map(p => {
    const statusRand = getParcelStatus(p);
    const timeAgo = getTimeAgo(p.date);
    return `<div class="flagged-card">
      <div class="flagged-card-header">
        <span class="flagged-parcel-id">${p.parcel_id || 'N/A'}</span>
        <span class="flagged-time">${timeAgo}</span>
      </div>
      <div class="flagged-hub">${p.hub_id || 'Unknown Hub'}</div>
      <div class="flagged-tags">
        <span class="flag-tag reason">${formatReasonLabel(p.failure_reason)}</span>
        <span class="flag-tag status-${statusRand}">${statusRand.toUpperCase()}</span>
      </div>
    </div>`;
  }).join('');
}

// ==========================================================================
// Utility Functions
// ==========================================================================

function filterByHub(data) {
  if (state.selectedHub === 'ALL') return data;
  return data.filter(r => r.hub_id === state.selectedHub);
}

function filterParcelsByHub(data) {
  if (state.selectedHub === 'ALL') return data;
  return data.filter(p => p.hub_id === state.selectedHub);
}

function formatNumber(n) {
  if (n == null) return '0';
  return n.toLocaleString();
}

function formatReasonLabel(reason) {
  if (!reason) return 'Unknown';
  return reason.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

function getParcelStatus(p) {
  // Derive status from delivery outcome and attempt count
  if (p.delivery_outcome === 'failed' && (p.attempt_count || 1) >= 3) return 'escalated';
  if (p.delivery_outcome === 'failed') return 'pending';
  if (p.delivery_outcome === 'delivered_late') return 'confirmed';
  return 'pending';
}

function getTimeAgo(dateStr) {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function updateChartLabel() {
  if (els.chartHubLabel) {
    els.chartHubLabel.textContent = state.selectedHub === 'ALL' ? 'All Hubs' : state.selectedHub;
  }
}

function showLoading(isLoading) {
  // The skeleton states are shown initially; once data loads they get replaced
}

function showError() {
  els.errorBanner?.classList.add('visible');
  const dot = els.syncStatus?.querySelector('.sync-dot');
  if (dot) dot.classList.add('error');
  const text = els.syncStatus?.querySelector('.sync-text');
  if (text) text.textContent = 'Connection failed';
}

function hideError() {
  els.errorBanner?.classList.remove('visible');
}

function updateSyncStatus(success) {
  const dot = els.syncStatus?.querySelector('.sync-dot');
  const text = els.syncStatus?.querySelector('.sync-text');
  if (success) {
    if (dot) dot.classList.remove('error');
    if (text) text.textContent = 'Live';
    if (els.lastSynced && state.lastSynced) {
      els.lastSynced.textContent = `Last synced ${formatTime(state.lastSynced)}`;
    }
  }
}

function formatTime(date) {
  if (!date) return '—';
  const now = new Date();
  const diff = Math.floor((now - date) / 1000);
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)} min ago`;
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}
