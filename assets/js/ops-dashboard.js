// ==========================================================================
// SPX Delivery Ops Center — Dashboard JS v2
// Live connection to Supabase REST API
// ==========================================================================

const SUPABASE_URL = 'https://egfeipuqspptnderrfga.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVnZmVpcHVxc3BwdG5kZXJyZmdhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ3MDU2NzAsImV4cCI6MjEwMDI4MTY3MH0.Y9V9W0xKPHk4Vv9TOZwzNePWMX9epasVuR_-CzgRwCk';

const HUB_IDS = ['HUB_A_NORTH','HUB_B_CENTRAL','HUB_C_SOUTH','HUB_D_EAST','HUB_E_WEST','HUB_F_RIVER'];

// Dot colors are assigned per hub for visual distinction only (not risk-driven)
const HUB_DOT_COLORS = {
  HUB_A_NORTH: 'blue',
  HUB_B_CENTRAL: 'purple',
  HUB_C_SOUTH: 'teal',
  HUB_D_EAST: 'green',
  HUB_E_WEST: 'amber',
  HUB_F_RIVER: 'red'
};

// Risk threshold: hubs above this failed rate get red dot override + risk styling
const RISK_THRESHOLD_PCT = 8;

// State
let state = {
  hubOps: [],
  parcelHistory: [],
  priorOps: [],
  selectedHub: 'ALL',
  dateRange: 'today',
  lastSynced: null,
  isError: false,
  sortColumn: 'failedRate',
  sortDirection: 'desc',
  latestDataDate: null,
  severityFilter: 'all'
};

let pollInterval = null;
const els = {};

document.addEventListener('DOMContentLoaded', () => {
  cacheElements();
  bindEvents();
  setOpsDate();
  fetchAll();
  startPolling();
});

function cacheElements() {
  els.errorBanner = document.getElementById('errorBanner');
  els.retryBtn = document.getElementById('retryBtn');
  els.syncPill = document.getElementById('syncPill');
  els.lastSynced = document.getElementById('lastSynced');
  els.hubFilter = document.getElementById('hubFilter');
  els.hubTableBody = document.getElementById('hubTableBody');
  els.flaggedList = document.getElementById('flaggedList');
  els.flaggedSummary = document.getElementById('flaggedSummary');
  els.navFlaggedBadge = document.getElementById('navFlaggedBadge');
  els.chartSkeleton = document.getElementById('chartSkeleton');
  els.chartHubLabel = document.getElementById('chartHubLabel');
  els.sortToggle = document.getElementById('sortToggle');
  els.opsDate = document.getElementById('opsDate');
  els.hubMeta = document.getElementById('hubMeta');
  els.alertBadge = document.getElementById('alertBadge');
  els.resolutionCount = document.getElementById('resolutionCount');
  els.resolutionFill = document.getElementById('resolutionFill');
  els.resolutionSub = document.getElementById('resolutionSub');
}

function bindEvents() {
  els.retryBtn?.addEventListener('click', () => fetchAll());

  document.getElementById('refreshBtn')?.addEventListener('click', () => fetchAll());

  els.hubFilter?.addEventListener('change', (e) => {
    state.selectedHub = e.target.value;
    renderAll();
  });

  document.querySelectorAll('.date-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.date-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      state.dateRange = btn.dataset.range;
      fetchAll();
    });
  });

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

  // Flagged severity tabs
  document.querySelectorAll('.flagged-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.flagged-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      state.severityFilter = tab.dataset.severity;
      renderFlaggedQueue();
    });
  });
}

function setOpsDate() {
  // Will be updated once data is fetched — show placeholder until then
  if (els.opsDate) els.opsDate.textContent = 'Loading data range...';
}

function updateOpsDate() {
  if (!state.latestDataDate || !els.opsDate) return;
  const d = new Date(state.latestDataDate + 'T00:00:00');
  const opts = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  const dateStr = d.toLocaleDateString('en-US', opts);
  els.opsDate.textContent = `${dateStr} · Case data range`;
}

// ==========================================================================
// API Layer
// ==========================================================================

function getDateFilter() {
  const refDate = state.latestDataDate ? new Date(state.latestDataDate) : new Date();
  let startDate;
  switch (state.dateRange) {
    case 'today':
      startDate = new Date(refDate); startDate.setHours(0,0,0,0); break;
    case '7d':
      startDate = new Date(refDate); startDate.setDate(refDate.getDate() - 7); break;
    case '30d':
      startDate = new Date(refDate); startDate.setDate(refDate.getDate() - 30); break;
    default:
      startDate = new Date(refDate); startDate.setHours(0,0,0,0);
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
  return { start: priorStart.toISOString().split('T')[0], end: priorEnd.toISOString().split('T')[0] };
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
  const data = await resp.json();
  return { data };
}

async function fetchAll() {
  try {
    if (!state.latestDataDate) {
      const latestResp = await supabaseQuery('hub_daily_operations', 'select=date&order=date.desc&limit=1');
      if (latestResp.data && latestResp.data.length > 0) {
        state.latestDataDate = latestResp.data[0].date;
      }
    }

    const dateFilter = getDateFilter();
    const prior = getPriorPeriodFilter();

    const [hubOpsResp, parcelResp, priorOpsResp] = await Promise.all([
      supabaseQuery('hub_daily_operations', `date=gte.${dateFilter}&order=date.desc&limit=1000`),
      supabaseQuery('parcel_history', `date=gte.${dateFilter}&order=date.desc&limit=5000`),
      supabaseQuery('hub_daily_operations', `date=gte.${prior.start}&date=lt.${prior.end}&limit=1000`)
    ]);

    state.hubOps = hubOpsResp.data || [];
    state.parcelHistory = parcelResp.data || [];
    state.priorOps = priorOpsResp.data || [];
    state.isError = false;
    state.lastSynced = new Date();

    hideError();
    updateSyncStatus(true);
    updateOpsDate();
    renderAll();
  } catch (err) {
    console.error('Fetch error:', err);
    state.isError = true;
    showError();
    updateSyncStatus(false);
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
  renderResolution();
}

function renderStats() {
  const ops = filterByHub(state.hubOps);
  const priorOps = filterByHub(state.priorOps || []);

  const totalParcels = ops.reduce((s, r) => s + (r.daily_parcel_volume || 0), 0);
  const totalSuccess = ops.reduce((s, r) => s + (r.daily_successful_deliveries || 0), 0);
  const totalFailed = ops.reduce((s, r) => s + (r.daily_failed_deliveries || 0), 0);
  const totalLate = ops.reduce((s, r) => s + (r.daily_late_deliveries || 0), 0);
  const successRate = totalParcels > 0 ? (totalSuccess / totalParcels * 100) : 0;

  const parcels = filterParcelsByHub(state.parcelHistory);
  const flaggedParcels = parcels.filter(p => p.failure_reason != null);
  const flaggedCount = flaggedParcels.length;

  const avgResolution = parcels.length > 0
    ? Math.round(parcels.reduce((s, p) => s + (p.attempt_count || 1), 0) / parcels.length * 12)
    : 0;

  // Prior period
  const priorTotal = priorOps.reduce((s, r) => s + (r.daily_parcel_volume || 0), 0);
  const priorSuccess = priorOps.reduce((s, r) => s + (r.daily_successful_deliveries || 0), 0);
  const priorRate = priorTotal > 0 ? (priorSuccess / priorTotal * 100) : 0;

  // Set values
  setStatValue('statTotalParcels', formatNumber(totalParcels));
  setStatValue('statSuccessRate', successRate.toFixed(1) + '%');
  setStatValue('statFlagged', formatNumber(flaggedCount));
  setStatValue('statResolution', avgResolution + ' min');

  // Trends
  renderTrend('trendTotalParcels', totalParcels, priorTotal, true, 'vs yesterday');
  renderTrend('trendSuccessRate', successRate, priorRate, true, 'pp vs yesterday');
  renderTrend('trendFlagged', flaggedCount, 0, false, 'resolved today');
  renderTrend('trendResolution', avgResolution, 0, false, 'min faster');

  // Alert badge visibility
  if (els.alertBadge) {
    els.alertBadge.style.display = successRate < 97 ? 'flex' : 'none';
  }

  // Nav badge
  if (els.navFlaggedBadge) els.navFlaggedBadge.textContent = flaggedCount;
}

function renderTrend(elId, current, prior, higherIsGood, suffix) {
  const el = document.getElementById(elId);
  if (!el) return;
  if (!prior || prior === 0) {
    el.innerHTML = '';
    el.className = 'stat-trend neutral';
    return;
  }
  const diff = ((current - prior) / prior * 100).toFixed(1);
  const isUp = current > prior;
  const isGood = higherIsGood ? isUp : !isUp;
  el.innerHTML = `<span>${isUp ? '↗' : '↘'} ${Math.abs(diff)}% ${suffix || ''}</span>`;
  el.className = `stat-trend ${isGood ? 'up' : 'down'}`;
}

function setStatValue(cardId, value) {
  const card = document.getElementById(cardId);
  if (!card) return;
  const valEl = card.querySelector('.stat-value');
  if (valEl) { valEl.textContent = value; valEl.classList.remove('skeleton-text'); }
}

function renderHubTable() {
  const tbody = els.hubTableBody;
  if (!tbody) return;

  const maxVolume = Math.max(...state.hubOps.map(r => r.daily_parcel_volume || 0), 1);

  const hubData = HUB_IDS.map(hubId => {
    const rows = state.hubOps.filter(r => r.hub_id === hubId);
    const parcels = state.parcelHistory.filter(p => p.hub_id === hubId);
    const volume = rows.reduce((s, r) => s + (r.daily_parcel_volume || 0), 0);
    const failed = rows.reduce((s, r) => s + (r.daily_failed_deliveries || 0), 0);
    const success = rows.reduce((s, r) => s + (r.daily_successful_deliveries || 0), 0);
    const riders = rows.length > 0 ? Math.round(rows.reduce((s, r) => s + (r.active_riders || 0), 0) / rows.length) : 0;
    const staff = rows.length > 0 ? Math.round(rows.reduce((s, r) => s + (r.available_sort_staff || 0), 0) / rows.length) : 0;
    const failedRate = volume > 0 ? (failed / volume * 100) : 0;
    const sla = volume > 0 ? (success / volume * 100) : 100;
    const flaggedCount = parcels.filter(p => p.failure_reason != null).length;

    // Pull region from actual data (first row that has it)
    const region = rows.length > 0 ? (rows[0].region || '') : '';

    // Generate 7-day trend data from available rows
    const trendBars = generateTrendBars(rows);

    return { hub: hubId, volume, riders, staff, failedRate, sla, flagged: flaggedCount, region, trendBars, staffing: `${riders}/${staff}` };
  });

  // Priority hub = highest failure rate
  const maxFail = Math.max(...hubData.map(h => h.failedRate));
  const priorityHub = hubData.find(h => h.failedRate === maxFail && maxFail > 0);

  // Sort
  hubData.sort((a, b) => {
    let aV = a[state.sortColumn], bV = b[state.sortColumn];
    if (state.sortColumn === 'hub' || state.sortColumn === 'staffing') {
      return state.sortDirection === 'asc' ? String(aV).localeCompare(String(bV)) : String(bV).localeCompare(String(aV));
    }
    return state.sortDirection === 'asc' ? aV - bV : bV - aV;
  });

  const totalMaxVol = Math.max(...hubData.map(h => h.volume), 1);

  tbody.innerHTML = hubData.map(h => {
    const isPriority = priorityHub && h.hub === priorityHub.hub;
    const isHighRisk = h.failedRate >= RISK_THRESHOLD_PCT;
    const rateClass = h.failedRate > 4 ? 'danger' : h.failedRate > 2.5 ? 'warning' : 'ok';
    const slaClass = h.sla >= 93 ? 'good' : h.sla >= 88 ? 'warn' : 'bad';
    const volPct = Math.round(h.volume / totalMaxVol * 100);

    // Dot color: red if high risk, otherwise use assigned color
    const dotColor = isHighRisk ? 'red' : (HUB_DOT_COLORS[h.hub] || 'blue');

    const trendHTML = h.trendBars.map(v => {
      const ht = Math.max(3, Math.round(v / 100 * 18));
      const color = v > 5 ? 'var(--danger-red)' : v > 3 ? 'var(--warning-amber)' : 'var(--success-green)';
      return `<div class="trend-bar-item" style="height:${ht}px;background:${color}"></div>`;
    }).join('');

    return `<tr class="${isPriority || isHighRisk ? 'priority-hub' : ''}" data-hub="${h.hub}">
      <td>
        <div class="hub-name-cell">
          <span class="hub-name-main">
            <span class="hub-dot ${dotColor}"></span>
            ${h.hub}${isPriority ? '<span class="pilot-badge">Pilot hub</span>' : ''}
          </span>
          ${h.region ? `<span class="hub-name-sub">${h.region}</span>` : ''}
        </div>
      </td>
      <td>
        <div class="volume-cell">
          <span class="volume-num">${formatNumber(h.volume)}</span>
          <div class="volume-bar"><div class="volume-bar-fill" style="width:${volPct}%"></div></div>
        </div>
      </td>
      <td>${h.staffing}</td>
      <td><span class="rate-pill ${rateClass}">${h.failedRate.toFixed(1)}%</span></td>
      <td>${h.flagged}</td>
      <td><span class="sla-value ${slaClass}">${h.sla.toFixed(1)}%</span></td>
      <td><div class="trend-bars">${trendHTML}</div></td>
    </tr>`;
  }).join('');

  // Click row to select hub
  tbody.querySelectorAll('tr').forEach(tr => {
    tr.style.cursor = 'pointer';
    tr.addEventListener('click', () => {
      const hub = tr.dataset.hub;
      if (hub) {
        els.hubFilter.value = hub;
        state.selectedHub = hub;
        renderFailureChart();
        renderFlaggedQueue();
        if (els.chartHubLabel) els.chartHubLabel.textContent = hub;
      }
    });
  });

  if (els.hubMeta) els.hubMeta.textContent = `Real-time delivery metrics · ${hubData.filter(h => h.volume > 0).length} active hubs`;
}

function generateTrendBars(rows) {
  // Generate 7 bars from daily failure rates
  if (rows.length === 0) return [0,0,0,0,0,0,0];
  const sorted = [...rows].sort((a,b) => a.date.localeCompare(b.date)).slice(-7);
  const bars = sorted.map(r => {
    const vol = r.daily_parcel_volume || 1;
    return (r.daily_failed_deliveries || 0) / vol * 100;
  });
  while (bars.length < 7) bars.unshift(0);
  return bars;
}

function renderFailureChart() {
  const canvas = document.getElementById('failureChart');
  if (!canvas) return;

  const parcels = filterParcelsByHub(state.parcelHistory);
  const failedParcels = parcels.filter(p => p.failure_reason != null);

  const reasonCounts = {};
  failedParcels.forEach(p => {
    const reason = p.failure_reason || 'unknown';
    reasonCounts[reason] = (reasonCounts[reason] || 0) + 1;
  });

  const labels = Object.keys(reasonCounts);
  const data = Object.values(reasonCounts);
  const total = data.reduce((s, v) => s + v, 0);

  const colorMap = {
    'bad address': '#EE4D2D',
    'customer not available': '#F97316',
    'rider capacity': '#8B5CF6',
    'routing delay': '#3B82F6',
    'hub backlog': '#14B8A6',
    'weather/disruption': '#6B7280'
  };
  const bgColors = labels.map(l => colorMap[l] || '#9CA3AF');

  if (window._failureChart) window._failureChart.destroy();
  if (els.chartSkeleton) els.chartSkeleton.classList.add('hidden');

  if (labels.length === 0) {
    canvas.style.display = 'none';
    if (els.chartSkeleton) {
      els.chartSkeleton.classList.remove('hidden');
      els.chartSkeleton.innerHTML = '<p style="color:#94A3B8;font-size:13px;text-align:center;padding:40px 0;">No failure data for selected period</p>';
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
        borderRadius: 4, barThickness: 26
      }]
    },
    options: {
      indexAxis: 'y', responsive: true, maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: { callbacks: { label: (ctx) => `${data[ctx.dataIndex]} parcels (${ctx.raw}%)` } }
      },
      scales: {
        x: { grid: { color: '#F1F5F9' }, ticks: { callback: v => v + '%', font: { size: 11, weight: '600' }, color: '#94A3B8' }, max: 100 },
        y: { grid: { display: false }, ticks: { font: { size: 11, weight: '600' }, color: '#334155' } }
      }
    }
  });

  if (els.chartHubLabel) els.chartHubLabel.textContent = state.selectedHub === 'ALL' ? 'All Hubs' : state.selectedHub;
}

function renderFlaggedQueue() {
  const list = els.flaggedList;
  if (!list) return;

  const parcels = filterParcelsByHub(state.parcelHistory);
  let flagged = parcels
    .filter(p => p.failure_reason != null)
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  // Apply severity filter
  if (state.severityFilter !== 'all') {
    flagged = flagged.filter(p => getSeverity(p) === state.severityFilter);
  }

  const displayed = flagged.slice(0, 25);
  const escalated = flagged.filter(p => getParcelStatus(p) === 'escalated').length;

  if (els.flaggedSummary) els.flaggedSummary.textContent = `${flagged.length} open · ${escalated} escalated`;

  if (displayed.length === 0) {
    list.innerHTML = '<div style="padding:30px 0;text-align:center;color:#94A3B8;font-size:13px;">No flagged parcels</div>';
    return;
  }

  list.innerHTML = displayed.map(p => {
    const status = getParcelStatus(p);
    const severity = getSeverity(p);
    const timeAgo = getTimeAgo(p.date);
    const customerName = generateCustomerName(p.parcel_id);

    return `<div class="flagged-card severity-${severity}">
      <div class="flagged-card-header">
        <span class="flagged-parcel-id">${p.parcel_id || 'N/A'}</span>
        <span class="flagged-time">${timeAgo}</span>
      </div>
      <div class="flagged-detail">
        <span>${p.hub_id || 'Unknown'} · ${customerName}</span>
        <span class="flagged-severity ${severity}">${capitalize(severity)}</span>
      </div>
      <div class="flagged-tags">
        <span class="flag-tag reason">${formatReasonLabel(p.failure_reason)}</span>
        <span class="flag-tag status-${status}">${capitalize(status)}</span>
      </div>
    </div>`;
  }).join('');
}

function renderResolution() {
  const parcels = filterParcelsByHub(state.parcelHistory);
  const flagged = parcels.filter(p => p.failure_reason != null);
  const resolved = flagged.filter(p => p.delivery_outcome === 'delivered_late' || (p.is_redelivery && p.delivery_outcome === 'delivered_on_time'));
  const total = flagged.length;
  const resolvedCount = resolved.length;
  const pct = total > 0 ? (resolvedCount / total * 100) : 0;

  if (els.resolutionCount) els.resolutionCount.textContent = `${resolvedCount} / ${total}`;
  if (els.resolutionFill) els.resolutionFill.style.width = pct + '%';
  if (els.resolutionSub) els.resolutionSub.textContent = `${pct.toFixed(1)}% resolved · ${total - resolvedCount} remaining`;
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

function capitalize(s) { return s ? s.charAt(0).toUpperCase() + s.slice(1) : ''; }

function getParcelStatus(p) {
  if (p.delivery_outcome === 'failed' && (p.attempt_count || 1) >= 3) return 'escalated';
  if (p.delivery_outcome === 'failed') return 'pending';
  if (p.delivery_outcome === 'delivered_late') return 'confirmed';
  return 'pending';
}

function getSeverity(p) {
  const attempts = p.attempt_count || 1;
  if (attempts >= 3 || p.priority_flag) return 'high';
  if (attempts >= 2 || p.failure_reason === 'bad address') return 'med';
  return 'low';
}

function generateCustomerName(parcelId) {
  // Generate deterministic fake names from parcel ID for demo
  const names = ['R. Tan','J. Lim','A. Singh','M. Lee','S. Kumar','K. Chen','D. Reyes','P. Santos','L. Wang','F. Garcia'];
  const idx = hashCode(parcelId || '') % names.length;
  return names[Math.abs(idx)];
}

function hashCode(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return hash;
}

function getTimeAgo(dateStr) {
  if (!dateStr) return '';
  // Calculate relative to the latest data date (not real-world now)
  const refDate = state.latestDataDate ? new Date(state.latestDataDate + 'T23:59:59') : new Date();
  const diff = refDate.getTime() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 0) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function showError() {
  els.errorBanner?.classList.add('visible');
  const dot = els.syncPill?.querySelector('.sync-dot-inline');
  if (dot) dot.classList.add('error');
  if (els.lastSynced) els.lastSynced.textContent = 'Connection failed';
}

function hideError() {
  els.errorBanner?.classList.remove('visible');
}

function updateSyncStatus(success) {
  const dot = els.syncPill?.querySelector('.sync-dot-inline');
  if (success) {
    if (dot) dot.classList.remove('error');
    if (els.lastSynced && state.lastSynced) {
      els.lastSynced.textContent = `Synced ${formatTime(state.lastSynced)}`;
    }
  }
}

function formatTime(date) {
  if (!date) return '—';
  const now = new Date();
  const diff = Math.floor((now - date) / 1000);
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}
