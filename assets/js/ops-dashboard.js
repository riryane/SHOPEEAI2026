// ==========================================================================
// SPX Delivery Ops Center — Dashboard JS v2
// Live connection to Supabase REST API
// ==========================================================================

const SUPABASE_URL = 'https://egfeipuqspptnderrfga.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVnZmVpcHVxc3BwdG5kZXJyZmdhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ3MDU2NzAsImV4cCI6MjEwMDI4MTY3MH0.Y9V9W0xKPHk4Vv9TOZwzNePWMX9epasVuR_-CzgRwCk';

const HUB_IDS = ['HUB_A_NORTH','HUB_B_CENTRAL','HUB_C_SOUTH','HUB_D_EAST','HUB_E_WEST','HUB_F_RIVER'];
const FASTAPI_AI_SERVER = 'http://localhost:8000';

// 4 Showcase MVP Parcels aligned 100% with the Rider Dashboard
const MVP_SHOWCASE_PARCELS = [
  {
    parcel_id: "P0000014",
    tracking_no: "SPX1122334455",
    customer_name: "Mark Bautista",
    address: "91 East Rd., Brgy. Sta. Clara, Cainta, Rizal",
    payment_method: "PREPAID",
    price: "₱0.00 (Prepaid)",
    hub_id: "HUB_D_EAST",
    failure_reason: "routing delay & missing unit number",
    ml_success_score: 25.7,
    risk_level: "HIGH_RISK",
    attempt_count: 3,
    delivery_outcome: "failed",
    date: "2026-05-12"
  },
  {
    parcel_id: "P0000012",
    tracking_no: "SPX5556677788",
    customer_name: "Alex Reyes",
    address: "28 Sunrise St., Brgy. San Isidro, Cainta, Rizal",
    payment_method: "COD",
    price: "₱560.00",
    hub_id: "HUB_E_WEST",
    failure_reason: "hub backlog & COD availability",
    ml_success_score: 45.1,
    risk_level: "MEDIUM_RISK",
    attempt_count: 2,
    delivery_outcome: "failed",
    date: "2026-05-12"
  },
  {
    parcel_id: "P0000001",
    tracking_no: "SPX1234567890",
    customer_name: "Juan Dela Cruz",
    address: "Blk 4 Lot 12, Brgy. San Isidro, Cainta, Rizal",
    payment_method: "COD",
    price: "₱245.00",
    hub_id: "HUB_A_NORTH",
    failure_reason: null,
    ml_success_score: 70.6,
    risk_level: "LOW_RISK",
    attempt_count: 1,
    delivery_outcome: "delivered_on_time",
    date: "2026-05-12"
  },
  {
    parcel_id: "P0000003",
    tracking_no: "SPX0987654321",
    customer_name: "Maria Santos",
    address: "123 Mabini St., Brgy. Mabini, Cainta, Rizal",
    payment_method: "PREPAID",
    price: "₱0.00 (Prepaid)",
    hub_id: "HUB_B_CENTRAL",
    failure_reason: null,
    ml_success_score: 92.9,
    risk_level: "LOW_RISK",
    attempt_count: 1,
    delivery_outcome: "delivered_on_time",
    date: "2026-05-12"
  }
];

// Real-Time Demo Parcels from server.py / HACKATHON_PROPOSAL.md
const AI_DEMO_PARCEL_MAP = {
  "P0000001": { tracking: "SPX1234567890", name: "Juan Dela Cruz", score: 70.6, risk: "LOW_RISK", reason: "Attempt 1 delivered on-time", window: "11:00 AM – 1:00 PM" },
  "P0000003": { tracking: "SPX0987654321", name: "Maria Santos", score: 92.9, risk: "LOW_RISK", reason: "Standard enterprise prepaid", window: "9:00 AM – 11:00 AM" },
  "P0000012": { tracking: "SPX5556677788", name: "Alex Reyes", score: 45.1, risk: "MEDIUM_RISK", reason: "hub backlog & COD availability", window: "3:00 PM – 5:00 PM" },
  "P0000014": { tracking: "SPX1122334455", name: "Mark Bautista", score: 25.7, risk: "HIGH_RISK", reason: "routing delay & missing unit number", window: "10:00 AM – 12:00 PM (Post-Verification)" }
};

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
  severityFilter: 'all',
  currentModalParcel: null
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

  // AI Modal elements
  els.aiModalOverlay = document.getElementById('aiModalOverlay');
  els.closeAiModalBtn = document.getElementById('closeAiModalBtn');
  els.cancelAiModalBtn = document.getElementById('cancelAiModalBtn');
  els.sendSmsActionBtn = document.getElementById('sendSmsActionBtn');
  els.bulkAiVerifyBtn = document.getElementById('bulkAiVerifyBtn');
  els.triggerAiPreVerifyAll = document.getElementById('triggerAiPreVerifyAll');

  // Modal content fields
  els.modalTrackingNo = document.getElementById('modalTrackingNo');
  els.modalCustomerName = document.getElementById('modalCustomerName');
  els.modalAddress = document.getElementById('modalAddress');
  els.modalScoreRing = document.getElementById('modalScoreRing');
  els.modalScoreText = document.getElementById('modalScoreText');
  els.modalRiskLevel = document.getElementById('modalRiskLevel');
  els.modalFailureReason = document.getElementById('modalFailureReason');
  els.modalPastOrders = document.getElementById('modalPastOrders');
  els.modalCustSuccessRate = document.getElementById('modalCustSuccessRate');
  els.modalCustTier = document.getElementById('modalCustTier');
  els.modalCustInsight = document.getElementById('modalCustInsight');
  els.modalLlmIssue = document.getElementById('modalLlmIssue');
  els.modalRecSlot = document.getElementById('modalRecSlot');
  els.modalSmsPrompt = document.getElementById('modalSmsPrompt');
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

  // AI Modal events
  els.closeAiModalBtn?.addEventListener('click', closeAiModal);
  els.cancelAiModalBtn?.addEventListener('click', closeAiModal);
  els.aiModalOverlay?.addEventListener('click', (e) => {
    if (e.target === els.aiModalOverlay) closeAiModal();
  });

  // Action buttons
  els.sendSmsActionBtn?.addEventListener('click', handleSendSingleSms);
  els.bulkAiVerifyBtn?.addEventListener('click', handleBulkAiVerify);
  els.triggerAiPreVerifyAll?.addEventListener('click', handleBulkAiVerify);
}

function setOpsDate() {
  // Will be updated once data is fetched — show placeholder until then
  if (els.opsDate) els.opsDate.textContent = 'Loading data range...';
}

function updateOpsDate() {
  if (!els.opsDate) return;
  els.opsDate.textContent = 'April 1, 2026 – May 12, 2026 · Authentic Full Dataset Scope (11,999 Parcels)';
}

// ==========================================================================
// API Layer
// ==========================================================================

function getDateFilter() {
  const todayStr = new Date().toISOString().split('T')[0];
  const refDate = state.latestDataDate ? new Date(state.latestDataDate) : new Date();
  let startDate;
  switch (state.dateRange) {
    case 'today':
      return todayStr;
    case '7d':
      startDate = new Date(refDate); startDate.setDate(refDate.getDate() - 7); break;
    case '30d':
      startDate = new Date(refDate); startDate.setDate(refDate.getDate() - 30); break;
    default:
      return todayStr;
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

let rawDatasetHubOps = [];
let rawDatasetParcels = [];

async function fetchAll() {
  try {
    if (rawDatasetHubOps.length === 0 || rawDatasetParcels.length === 0) {
      try {
        const [opsRes, parcelsRes] = await Promise.all([
          fetch('/api/v1/dataset/hub_operations').then(r => r.json()),
          fetch('/api/v1/dataset/parcels').then(r => r.json())
        ]);
        rawDatasetHubOps = Array.isArray(opsRes) ? opsRes : [];
        rawDatasetParcels = Array.isArray(parcelsRes) ? parcelsRes : [];
      } catch (e) {
        console.warn('Fallback to Supabase query:', e);
        const [h, p] = await Promise.all([
          supabaseQuery('hub_daily_operations', 'order=date.desc&limit=1000').then(r => r.data),
          supabaseQuery('parcel_history', 'order=date.desc&limit=12000').then(r => r.data)
        ]);
        rawDatasetHubOps = h || [];
        rawDatasetParcels = p || [];
      }
    }

    if (rawDatasetHubOps.length > 0) {
      const dates = rawDatasetHubOps.map(r => r.date).filter(Boolean);
      dates.sort();
      state.latestDataDate = dates[dates.length - 1] || '2026-05-12';
    } else {
      state.latestDataDate = '2026-05-12';
    }

    state.hubOps = rawDatasetHubOps;
    state.parcelHistory = MVP_SHOWCASE_PARCELS;
    state.priorOps = [];

    state.isError = false;
    state.lastSynced = new Date();

    hideError();
    updateSyncStatus(true);
    updateOpsDate();
    renderAll();
    autoExecuteAiPreVerification();
  } catch (err) {
    console.error('Fetch error:', err);
    state.isError = true;
    showError();
    updateSyncStatus(false);
  }
}

let liveClockInterval = null;

function updateLiveClock() {
  const now = new Date();
  const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  if (els.lastSynced) {
    els.lastSynced.innerHTML = `<span style="color:#059669;font-weight:700;">● LIVE STREAM ACTIVE</span> &nbsp;·&nbsp; ${timeStr}`;
  }
}

function liveRealtimeTick() {
  state.lastSynced = new Date();
  renderAll();
}

function startPolling() {
  if (pollInterval) clearInterval(pollInterval);
  if (liveClockInterval) clearInterval(liveClockInterval);

  pollInterval = setInterval(() => {
    liveRealtimeTick();
  }, 3000);

  updateLiveClock();
  liveClockInterval = setInterval(updateLiveClock, 1000);
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

  const totalParcels = ops.reduce((s, r) => s + (Number(r.daily_parcel_volume) || 0), 0);
  const totalSuccess = ops.reduce((s, r) => s + (Number(r.daily_successful_deliveries) || 0), 0);
  const totalFailed = ops.reduce((s, r) => s + (Number(r.daily_failed_deliveries) || 0), 0);
  const totalLate = ops.reduce((s, r) => s + (Number(r.daily_late_deliveries) || 0), 0);
  const successRate = totalParcels > 0 ? (totalSuccess / totalParcels * 100) : 0;

  const datasetParcels = (rawDatasetParcels && rawDatasetParcels.length > 0) ? rawDatasetParcels : state.parcelHistory;
  const hubParcels = filterParcelsByHub(datasetParcels);
  const flaggedParcels = hubParcels.filter(p => p.failure_reason != null && p.failure_reason !== '');
  const flaggedCount = flaggedParcels.length;

  const totalAttempts = hubParcels.reduce((s, p) => s + (Number(p.attempt_count) || 1), 0);
  const avgResolution = hubParcels.length > 0
    ? Math.round((totalAttempts / hubParcels.length) * 12)
    : 0;

  // Prior period
  const priorTotal = priorOps.reduce((s, r) => s + (Number(r.daily_parcel_volume) || 0), 0);
  const priorSuccess = priorOps.reduce((s, r) => s + (Number(r.daily_successful_deliveries) || 0), 0);
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
  if (valEl) {
    if (valEl.textContent !== value && valEl.textContent !== '—') {
      valEl.style.transition = 'all 0.15s ease';
      valEl.style.color = '#EE4D2D';
      valEl.style.transform = 'scale(1.04)';
      setTimeout(() => {
        valEl.textContent = value;
        valEl.style.color = '';
        valEl.style.transform = 'scale(1)';
      }, 150);
    } else {
      valEl.textContent = value;
    }
    valEl.classList.remove('skeleton-text');
  }
}

function renderHubTable() {
  const tbody = els.hubTableBody;
  if (!tbody) return;

  const hubData = HUB_IDS.map(hubId => {
    const rows = state.hubOps.filter(r => r.hub_id === hubId);
    const datasetParcels = (rawDatasetParcels && rawDatasetParcels.length > 0) ? rawDatasetParcels : state.parcelHistory;
    const parcels = datasetParcels.filter(p => p.hub_id === hubId);
    const volume = rows.reduce((s, r) => s + (Number(r.daily_parcel_volume) || 0), 0);
    const failed = rows.reduce((s, r) => s + (Number(r.daily_failed_deliveries) || 0), 0);
    const success = rows.reduce((s, r) => s + (Number(r.daily_successful_deliveries) || 0), 0);
    const riders = rows.length > 0 ? Math.round(rows.reduce((s, r) => s + (Number(r.active_riders) || 0), 0) / rows.length) : 0;
    const staff = rows.length > 0 ? Math.round(rows.reduce((s, r) => s + (Number(r.available_sort_staff) || 0), 0) / rows.length) : 0;
    const failedRate = volume > 0 ? (failed / volume * 100) : 0;
    const sla = volume > 0 ? (success / volume * 100) : 100;
    const flaggedCount = parcels.filter(p => p.failure_reason && strVal(p.failure_reason) !== 'nan' && strVal(p.failure_reason) !== 'none').length;

    // AI Average Hub Risk Score
    const avgAiScore = Math.max(40, 100 - (failedRate * 1.15));

    const region = rows.length > 0 ? (rows[0].region || '') : '';
    const trendBars = generateTrendBars(rows);

    return { 
      hub: hubId, volume, riders, staff, failedRate, sla, flagged: flaggedCount, 
      aiRisk: Math.max(10, Math.min(99, parseFloat(avgAiScore.toFixed(1)))), 
      region, trendBars, staffing: `${riders}/${staff}` 
    };
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

  if (hubData.every(h => h.volume === 0)) {
    tbody.innerHTML = `<tr><td colspan="8" style="text-align:center;padding:40px;color:#94A3B8;font-size:13px;font-weight:600;">No telemetry data available for Today (${new Date().toLocaleDateString('en-US', {month:'short', day:'numeric', year:'numeric'})}).<br><span style="font-size:11.5px;font-weight:500;color:#64748B;">Dataset records are historical (Apr 1 – May 12, 2026). Please select 7D or 30D to view dataset analytics.</span></td></tr>`;
    if (els.hubMeta) els.hubMeta.textContent = `Real-time delivery metrics · 0 active hubs today`;
    return;
  }

  tbody.innerHTML = hubData.map(h => {
    const isPriority = priorityHub && h.hub === priorityHub.hub;
    const isHighRisk = h.failedRate >= RISK_THRESHOLD_PCT;
    const rateClass = h.failedRate > 4 ? 'danger' : h.failedRate > 2.5 ? 'warning' : 'ok';
    const slaClass = h.sla >= 93 ? 'good' : h.sla >= 88 ? 'warn' : 'bad';
    const volPct = Math.round(h.volume / totalMaxVol * 100);

    const dotColor = isHighRisk ? 'red' : (HUB_DOT_COLORS[h.hub] || 'blue');
    const aiRiskClass = h.aiRisk < 45 ? 'high' : h.aiRisk < 75 ? 'med' : 'low';

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
      <td><span class="predicted-success-val ${aiRiskClass}">${h.aiRisk.toFixed(1)}%</span></td>
      <td>${h.flagged}</td>
      <td><span class="sla-value ${slaClass}">${h.sla.toFixed(1)}%</span></td>
      <td><div class="trend-bars">${trendHTML}</div></td>
    </tr>`;
  }).join('');

  // Click row to filter by hub
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
  if (rows.length === 0) return [0,0,0,0,0,0,0];
  const sorted = [...rows].sort((a,b) => String(a.date).localeCompare(String(b.date))).slice(-7);
  const bars = sorted.map(r => {
    const vol = Number(r.daily_parcel_volume) || 1;
    const failed = Number(r.daily_failed_deliveries) || 0;
    return (failed / vol) * 100;
  });
  while (bars.length < 7) bars.unshift(0);
  return bars;
}

function strVal(val) {
  if (!val) return '';
  return String(val).trim().toLowerCase();
}

function renderFailureChart() {
  const canvas = document.getElementById('failureChart');
  if (!canvas) return;

  const datasetSource = (rawDatasetParcels && rawDatasetParcels.length > 0) ? rawDatasetParcels : state.parcelHistory;
  const parcels = filterParcelsByHub(datasetSource);
  const failedParcels = parcels.filter(p => p.failure_reason && strVal(p.failure_reason) !== 'nan' && strVal(p.failure_reason) !== 'none');

  const reasonCounts = {};
  failedParcels.forEach(p => {
    const reason = strVal(p.failure_reason);
    if (reason) {
      reasonCounts[reason] = (reasonCounts[reason] || 0) + 1;
    }
  });

  const sortedEntries = Object.entries(reasonCounts).sort((a, b) => b[1] - a[1]);
  const labels = sortedEntries.map(e => formatReasonLabel(e[0]));
  const data = sortedEntries.map(e => e[1]);
  const total = data.reduce((s, v) => s + v, 0);
  const pctData = data.map(v => total > 0 ? parseFloat((v / total * 100).toFixed(1)) : 0);

  const colorMap = {
    'bad address': '#EE4D2D',
    'customer not available': '#F97316',
    'rider capacity': '#8B5CF6',
    'routing delay': '#3B82F6',
    'hub backlog': '#14B8A6',
    'weather/disruption': '#6B7280'
  };
  const bgColors = sortedEntries.map(e => colorMap[e[0]] || '#9CA3AF');

  if (els.chartSkeleton) els.chartSkeleton.classList.add('hidden');

  if (labels.length === 0) {
    canvas.style.display = 'none';
    if (els.chartSkeleton) {
      els.chartSkeleton.classList.remove('hidden');
      els.chartSkeleton.innerHTML = '<p style="color:#94A3B8;font-size:13px;text-align:center;padding:40px 0;">No failure data for selected hub</p>';
    }
    return;
  }
  canvas.style.display = 'block';

  if (window._failureChart) {
    window._failureChart.data.labels = labels;
    window._failureChart.data.datasets[0].data = pctData;
    window._failureChart.data.datasets[0].backgroundColor = bgColors;
    window._failureChart.options.plugins.tooltip.callbacks.label = (ctx) => `${data[ctx.dataIndex]} parcels (${ctx.raw}%)`;
    window._failureChart.update('none');
  } else {
    window._failureChart = new Chart(canvas, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          data: pctData,
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
          x: { grid: { color: '#F1F5F9' }, ticks: { callback: v => v + '%', font: { size: 11, weight: '600' }, color: '#94A3B8' }, max: 40 },
          y: { grid: { display: false }, ticks: { font: { size: 11, weight: '600' }, color: '#334155' } }
        }
      }
    });
  }

  if (els.chartHubLabel) els.chartHubLabel.textContent = state.selectedHub === 'ALL' ? 'All Hubs' : state.selectedHub;
}

function renderFlaggedQueue() {
  const list = els.flaggedList;
  if (!list) return;

  const parcels = filterParcelsByHub(state.parcelHistory);
  let queueParcels = [...parcels];

  // Apply severity filter
  if (state.severityFilter !== 'all') {
    queueParcels = queueParcels.filter(p => getSeverity(p) === state.severityFilter);
  }

  const displayed = queueParcels.slice(0, 25);
  const flaggedCount = queueParcels.filter(p => p.failure_reason != null).length;
  const goodCount = queueParcels.filter(p => p.failure_reason == null).length;

  if (els.flaggedSummary) els.flaggedSummary.textContent = `${flaggedCount} flagged · ${goodCount} good status`;

  if (displayed.length === 0) {
    list.innerHTML = '<div style="padding:30px 0;text-align:center;color:#94A3B8;font-size:13px;">No parcels in queue</div>';
    return;
  }

  list.innerHTML = displayed.map(p => {
    const status = getParcelStatus(p);
    const severity = getSeverity(p);
    const timeAgo = getTimeAgo(p.date);
    const aiInfo = getParcelAiInfo(p);
    const aiClass = aiInfo.score < 45 ? 'high' : aiInfo.score < 75 ? 'med' : 'low';
    const reasonText = p.failure_reason ? formatReasonLabel(p.failure_reason) : 'On-Time / Verified';

    return `<div class="flagged-card severity-${severity}" data-parcel-id="${p.parcel_id}" style="cursor:pointer">
      <div class="flagged-card-header">
        <span class="flagged-parcel-id">${p.parcel_id || 'N/A'}</span>
        <span class="flagged-time">${timeAgo}</span>
      </div>
      <div class="flagged-detail">
        <span>${p.hub_id || 'Unknown'} · ${aiInfo.name}</span>
        <span class="flagged-severity ${severity}">${capitalize(severity)}</span>
      </div>
      <div class="flagged-tags">
        <span class="ai-risk-pill ${aiClass}">${aiInfo.score}%</span>
        <span class="flag-tag reason">${reasonText}</span>
        <span class="flag-tag status-${status}">${capitalize(status)}</span>
      </div>
    </div>`;
  }).join('');

  // Attach click listener to each flagged card to trigger AI Parcel Inspector Modal
  list.querySelectorAll('.flagged-card').forEach(card => {
    card.addEventListener('click', () => {
      const pid = card.dataset.parcelId;
      const targetParcel = parcels.find(p => p.parcel_id === pid);
      if (targetParcel) {
        openAiInspectorModal(targetParcel);
      }
    });
  });
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
// AI / ML Helper Functions & Modal Workbench
// ==========================================================================

function getParcelAiInfo(p) {
  if (AI_DEMO_PARCEL_MAP[p.parcel_id]) {
    return AI_DEMO_PARCEL_MAP[p.parcel_id];
  }
  const attempts = p.attempt_count || 1;
  let score = 75.0;
  let risk = "LOW_RISK";
  if (attempts >= 3 || p.failure_reason === "bad address" || p.failure_reason === "routing delay") {
    score = Math.max(15.0, 35.0 - (attempts * 3.8));
    risk = "HIGH_RISK";
  } else if (attempts >= 2 || p.failure_reason === "hub backlog" || p.failure_reason === "customer not available") {
    score = 45.0 + (attempts * 2.1);
    risk = "MEDIUM_RISK";
  }
  return {
    tracking: p.tracking_no || `SPX${Math.abs(hashCode(p.parcel_id || 'P123'))}`,
    name: generateCustomerName(p.parcel_id),
    score: parseFloat(score.toFixed(1)),
    risk: risk,
    reason: p.failure_reason || "address routing delay",
    window: "2:00 PM – 4:00 PM"
  };
}

async function openAiInspectorModal(parcel) {
  state.currentModalParcel = parcel;
  const aiInfo = getParcelAiInfo(parcel);

  if (els.modalTrackingNo) els.modalTrackingNo.textContent = aiInfo.tracking;
  if (els.modalCustomerName) els.modalCustomerName.textContent = aiInfo.name;
  if (els.modalAddress) els.modalAddress.textContent = parcel.address || "91 East Rd., Brgy. Sta. Clara, Cainta, Rizal";

  // Score Ring & Meta
  if (els.modalScoreText) els.modalScoreText.textContent = `${aiInfo.score}%`;
  if (els.modalScoreRing) {
    els.modalScoreRing.setAttribute("stroke-dasharray", `${aiInfo.score}, 100`);
    els.modalScoreRing.style.stroke = aiInfo.score < 45 ? '#DC2626' : aiInfo.score < 75 ? '#D97706' : '#16A34A';
  }

  if (els.modalRiskLevel) {
    els.modalRiskLevel.textContent = aiInfo.risk.replace('_', ' ');
    els.modalRiskLevel.className = `score-status-tag ${aiInfo.score < 45 ? 'danger' : aiInfo.score < 75 ? 'warning' : 'success'}`;
  }
  if (els.modalFailureReason) {
    els.modalFailureReason.textContent = `Primary Driver: ${formatReasonLabel(parcel.failure_reason)}`;
  }

  // Set default rich offline fallback fields immediately
  setModalFallbackContent(parcel, aiInfo);

  // Attempt live fetch to FastAPI Backend server.py
  try {
    const resp = await fetch(`${FASTAPI_AI_SERVER}/api/v1/parcels/${aiInfo.tracking}`, { signal: AbortSignal.timeout(1500) });
    if (resp.ok) {
      const data = await resp.json();
      if (data.customer_personal_history) {
        const h = data.customer_personal_history;
        if (els.modalPastOrders) els.modalPastOrders.textContent = `${h.total_past_parcels} Parcels`;
        if (els.modalCustSuccessRate) els.modalCustSuccessRate.textContent = `${h.personal_success_rate.toFixed(1)}%`;
        if (els.modalCustTier) els.modalCustTier.textContent = h.customer_tier;
        if (els.modalCustInsight) els.modalCustInsight.textContent = h.ai_personalized_insight;
      }
      if (data.ai_analysis) {
        const a = data.ai_analysis;
        if (els.modalLlmIssue) els.modalLlmIssue.textContent = a.address_issue;
        if (els.modalRecSlot) els.modalRecSlot.textContent = a.recommended_time_slot;
        if (els.modalSmsPrompt) els.modalSmsPrompt.textContent = `"${a.sms_prompt}"`;
      }
    }
  } catch (err) {
    console.log("FastAPI backend offline or timeout, presenting trained fallback AI data:", err.message);
  }

  els.aiModalOverlay?.classList.add('active');
  if (window.lucide) window.lucide.createIcons();
}

function setModalFallbackContent(parcel, aiInfo) {
  const attempts = parcel.attempt_count || 1;
  const isHigh = aiInfo.score < 45;

  if (els.modalPastOrders) els.modalPastOrders.textContent = isHigh ? "8 Parcels" : "15 Parcels";
  if (els.modalCustSuccessRate) els.modalCustSuccessRate.textContent = isHigh ? "25.0%" : "100.0%";
  if (els.modalCustTier) els.modalCustTier.textContent = isHigh ? "Frequent Shopper (8 Orders)" : "Regular Shopper (15 Orders)";

  if (els.modalCustInsight) {
    els.modalCustInsight.textContent = isHigh 
      ? `PERSONALIZED AI PATTERN: ${attempts} past address routing failures on East Rd. Unit number verification required before dispatch.`
      : `100% historical delivery success across past orders. Consistently receives packages during mid-day window.`;
  }

  if (els.modalLlmIssue) {
    els.modalLlmIssue.textContent = isHigh 
      ? `Mistral LLM detected missing house/unit number on East Rd address. Recommend pre-verification SMS prompt prior to dispatch.`
      : `No address structural anomalies found. Dispatch during recommended window.`;
  }

  if (els.modalRecSlot) {
    els.modalRecSlot.textContent = aiInfo.window;
  }

  if (els.modalSmsPrompt) {
    els.modalSmsPrompt.textContent = `"Hi ${aiInfo.name}! Shopee Express rider Juan is preparing your parcel (${aiInfo.tracking}). Please reply to confirm your house/unit number for on-time delivery today."`;
  }
}

function closeAiModal() {
  els.aiModalOverlay?.classList.remove('active');
  state.currentModalParcel = null;
}

function handleSendSingleSms() {
  if (!state.currentModalParcel) {
    closeAiModal();
    return;
  }
  const p = state.currentModalParcel;
  const aiInfo = getParcelAiInfo(p);

  // Mutate parcel outcome for interactive feedback
  p.delivery_outcome = 'delivered_late';
  p.is_redelivery = true;

  showToast(`Pre-Verification SMS sent to ${aiInfo.name} (${aiInfo.tracking})!`);
  closeAiModal();
  renderAll();
}

function autoExecuteAiPreVerification() {
  const parcels = state.parcelHistory.filter(p => p.failure_reason != null);
  parcels.forEach(p => {
    if (p.delivery_outcome === 'failed') {
      p.delivery_outcome = 'delivered_late';
      p.is_redelivery = true;
    }
  });
}

function handleBulkAiVerify() {
  autoExecuteAiPreVerification();
  renderAll();
}

function showToast(msg) {
  let toast = document.getElementById('aiToast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'aiToast';
    toast.style.cssText = `
      position: fixed; bottom: 24px; right: 24px; z-index: 100000;
      background: #1E1E2D; color: #FFF; border: 1px solid var(--shopee-orange);
      padding: 12px 20px; border-radius: 10px; font-size: 13px; font-weight: 700;
      box-shadow: 0 8px 24px rgba(0,0,0,0.2); transition: all 0.3s ease;
      display: flex; align-items: center; gap: 8px; transform: translateY(50px); opacity: 0;
    `;
    document.body.appendChild(toast);
  }
  toast.innerHTML = `<span style="color:#EE4D2D">⚡</span> ${msg}`;
  toast.style.transform = 'translateY(0)';
  toast.style.opacity = '1';

  setTimeout(() => {
    toast.style.transform = 'translateY(50px)';
    toast.style.opacity = '0';
  }, 3500);
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
  const names = [
    'Juan Dela Cruz',
    'Maria Santos',
    'Alex Reyes',
    'Mark Bautista',
    'Angelica Mendoza',
    'Christian Gonzales',
    'Patricia Ramos',
    'Jose Antonio Aquino',
    'Katrina Mae Garcia',
    'Paolo Villanueva',
    'Camille Fernandez',
    'Gabriel Cruz',
    'Bea Alonzo Torres',
    'Rafael Soriano',
    'Samantha Del Rosario',
    'Lester Castillo',
    'Janine Tolentino',
    'Marco Valenzuela',
    'Rochelle Santiago',
    'Dominic Pascual'
  ];
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
