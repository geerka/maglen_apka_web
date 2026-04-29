/* ============================================================
   FitCoach Dashboard – app.js   (full working demo)
   ============================================================ */

const HOUR_START  = 8;
const HOUR_HEIGHT = 52; // px per hour

/* ── Helpers ─────────────────────────────────────────────── */
function timeToY(t) {
  const [h, m] = t.split(':').map(Number);
  return ((h - HOUR_START) + m / 60) * HOUR_HEIGHT;
}

function showToast(msg, ok = true) {
  const el  = document.getElementById('liveToast');
  const txt = document.getElementById('toastMsg');
  if (!el || !txt) return;
  el.className = `toast align-items-center border-0 text-bg-${ok ? 'success' : 'danger'}`;
  txt.textContent = msg;
  bootstrap.Toast.getOrCreateInstance(el, { delay: 2500 }).show();
}

function updateOnlineStatus() {
  const el = document.getElementById('onlineStatus');
  if (!el) return;
  const online = navigator.onLine;
  el.textContent = online ? 'ONLINE' : 'OFFLINE';
  el.classList.toggle('is-online', online);
  el.classList.toggle('is-offline', !online);
}

/* ── Calendar rendering ──────────────────────────────────── */
function renderSessions() {
  const grid = document.getElementById('timeGrid');
  if (!grid) return;

  // Clear old blocks
  grid.querySelectorAll('.session-block').forEach(b => b.remove());

  const hours = 11;
  grid.style.height = (hours * HOUR_HEIGHT) + 'px';

  const dayWidth = grid.clientWidth / 7;
  if (dayWidth <= 0) return; // not yet painted

  SESSIONS.forEach(s => {
    const top    = timeToY(s.start);
    const bottom = timeToY(s.end);
    const height = Math.max(bottom - top, 26);

    const el = document.createElement('div');
    el.className = `session-block session-${s.color}`;
    el.style.cssText = `
      top:${top}px;height:${height}px;
      left:${s.day * dayWidth + 3}px;
      width:${dayWidth - 7}px;
    `;
    el.textContent = s.title;
    el.title = `${s.title}  ${s.start}–${s.end}`;

    el.addEventListener('click', () => openSessionModal(s));
    grid.appendChild(el);
  });
}

/* ── Session modal ───────────────────────────────────────── */
function openSessionModal(s) {
  document.getElementById('sessionModalTitle').textContent = s.title;
  document.getElementById('sessionModalBody').innerHTML = `
    <p class="mb-1"><strong>Čas:</strong> ${s.start} – ${s.end}</p>
    <p class="mb-1"><strong>Deň:</strong> ${['Pon','Uto','Str','Štv','Pia','Sob','Ned'][s.day]}</p>
    <p class="mb-0"><strong>Typ:</strong> ${s.color === 'blue' ? 'Personal Training' : s.color === 'teal' ? 'Group Training' : 'Olympic Training'}</p>
  `;
  bootstrap.Modal.getOrCreateInstance(document.getElementById('sessionModal')).show();
}

/* ── Week navigation ─────────────────────────────────────── */
let weekOffset = 0;
const BASE_DAYS = WEEK_DAYS;          // from Jinja
const DAY_LABELS = ['MI','UT','ST','ŠT','PI','SO','NE'];

function updateWeekStrip() {
  const cols = document.querySelectorAll('#weekStrip .day-col');
  const baseDate = new Date(2025, 3, 21); // Mon 21 Apr 2025 (start of demo week)
  baseDate.setDate(baseDate.getDate() + weekOffset * 7);

  cols.forEach((col, i) => {
    const d = new Date(baseDate);
    d.setDate(baseDate.getDate() + i);
    col.querySelector('.day-label').textContent = DAY_LABELS[i];
    col.querySelector('.day-num').textContent = d.getDate();

    // Highlight "today" only when offset=0
    const isToday = weekOffset === 0 && BASE_DAYS[i] && BASE_DAYS[i].active;
    col.classList.toggle('active', !!isToday);
  });
}

document.getElementById('prevWeek')?.addEventListener('click', () => {
  weekOffset--;
  updateWeekStrip();
});
document.getElementById('nextWeek')?.addEventListener('click', () => {
  weekOffset++;
  updateWeekStrip();
});

/* Day col click → highlight */
document.querySelectorAll('#weekStrip .day-col').forEach(col => {
  col.addEventListener('click', () => {
    document.querySelectorAll('#weekStrip .day-col').forEach(c => c.classList.remove('active'));
    col.classList.add('active');
  });
});

/* ── Profile tabs ────────────────────────────────────────── */
document.querySelectorAll('.profile-tabs .nav-link').forEach(link => {
  link.addEventListener('click', e => {
    e.preventDefault();
    const tabId = link.dataset.tab;
    if (!tabId) return;

    document.querySelectorAll('.profile-tabs .nav-link').forEach(l => l.classList.remove('active'));
    document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));

    link.classList.add('active');
    const panel = document.getElementById(tabId);
    if (panel) panel.classList.add('active');
  });
});

/* ── Top navbar page links (demo) ────────────────────────── */
document.querySelectorAll('.topnav-link').forEach(link => {
  link.addEventListener('click', e => {
    e.preventDefault();
    document.querySelectorAll('.topnav-link').forEach(l => l.classList.remove('active'));
    link.classList.add('active');
    showToast(`Navigácia: ${link.querySelector('span')?.textContent || '...'}`, true);
  });
});

/* ── Charts ──────────────────────────────────────────────── */
function renderProgressChart() {
  const ctx = document.getElementById('progressChart');
  if (!ctx) return;
  new Chart(ctx, {
    type: 'line',
    data: {
      labels: PROGRESS.labels,
      datasets: [{
        data: PROGRESS.values,
        borderColor: '#2F7FBF',
        backgroundColor: 'rgba(47,127,191,.12)',
        fill: true, tension: 0.4,
        pointRadius: 3, pointBackgroundColor: '#2F7FBF', borderWidth: 2,
      }]
    },
    options: {
      plugins: { legend: { display: false } },
      scales: {
        x: { grid: { display: false }, ticks: { font: { size: 9 }, color: '#6B7D93' } },
        y: { grid: { color: '#DDE4EF' }, ticks: { font: { size: 9 }, color: '#6B7D93' }, min: 26, max: 40 }
      },
      responsive: true, maintainAspectRatio: false,
      animation: { duration: 800 }
    }
  });
}

function renderInbodyChart() {
  const ctx = document.getElementById('inbodyChart');
  if (!ctx) return;
  new Chart(ctx, {
    type: 'line',
    data: {
      labels: INBODY.labels,
      datasets: [{
        data: INBODY.values,
        borderColor: '#2A9D8F',
        backgroundColor: 'rgba(42,157,143,.1)',
        fill: true, tension: 0.4,
        pointRadius: 2, borderWidth: 2,
      }]
    },
    options: {
      plugins: { legend: { display: false } },
      scales: {
        x: { display: false },
        y: { position: 'right', grid: { color: '#DDE4EF' }, ticks: { font: { size: 9 }, color: '#6B7D93' } }
      },
      responsive: true, maintainAspectRatio: false,
    }
  });
}

/* ── API-backed buttons ──────────────────────────────────── */
async function apiCall(url, method = 'POST') {
  try {
    const res = await fetch(url, { method });
    const data = await res.json();
    showToast(data.message || 'Hotovo!', data.status === 'ok');
    return data;
  } catch (e) {
    showToast('Chyba pripojenia', false);
  }
}

document.getElementById('btnRetest')?.addEventListener('click',       () => apiCall('/api/retest'));
document.getElementById('btnUpdatePlan')?.addEventListener('click',   () => apiCall('/api/update_plan'));
document.getElementById('btnHistory')?.addEventListener('click',      () => showToast('História načítaná'));
document.getElementById('btnVstupna')?.addEventListener('click',      () => showToast('Vstupná diagnostika otvorená'));
document.getElementById('btnUploadFoto')?.addEventListener('click',   () => showToast('Fotky nahrané'));
document.getElementById('btnZoznam')?.addEventListener('click',       () => showToast('Zoznam potravín'));
document.getElementById('btnZapis')?.addEventListener('click',        () => showToast('Zápis hárkov'));
document.getElementById('planRow')?.addEventListener('click',         () => showToast('Plán otvorený'));
document.getElementById('btnEditSession')?.addEventListener('click',  () => { bootstrap.Modal.getInstance(document.getElementById('sessionModal'))?.hide(); showToast('Tréning upravený'); });
document.getElementById('photoAdd')?.addEventListener('click',        () => showToast('Pridajte fotku'));

document.querySelectorAll('.online-btn').forEach(btn => {
  btn.addEventListener('click', () => showToast(`${btn.dataset.label} – otvorené`));
});

/* ── Resize → re-render sessions ────────────────────────── */
let resizeTimer;
window.addEventListener('resize', () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(renderSessions, 120);
});

/* ============================================================
   VÝŽIVA – Kalorické tabuľky
   ============================================================ */

let foodLog   = [];       // { id, name, grams, calories, carbs, proteins, fats }
let pendingProduct = null; // product awaiting quantity confirmation

/* ── Sub-tab switching (inside Výživa) ──────────────────── */
document.querySelectorAll('.vyzip-subtab').forEach(btn => {
  btn.addEventListener('click', () => {
    const target = btn.dataset.subtab;
    document.querySelectorAll('.vyzip-subtab').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.vyzip-section').forEach(s => s.classList.remove('active'));
    btn.classList.add('active');
    const section = document.getElementById(target);
    if (section) section.classList.add('active');
  });
});

/* ── Debounced auto-search ───────────────────────────────── */
let searchTimer;
document.getElementById('foodSearchInput')?.addEventListener('input', function () {
  clearTimeout(searchTimer);
  const q = this.value.trim();
  if (!q) {
    hideResults();
    return;
  }
  searchTimer = setTimeout(() => searchFood(q), 450);
});

document.getElementById('foodSearchInput')?.addEventListener('keydown', function (e) {
  if (e.key === 'Enter') { clearTimeout(searchTimer); searchFood(this.value.trim()); }
  if (e.key === 'Escape') hideResults();
});

document.getElementById('foodSearchBtn')?.addEventListener('click', () => {
  const q = document.getElementById('foodSearchInput')?.value.trim();
  if (q) searchFood(q);
});

document.addEventListener('click', e => {
  const wrap = document.getElementById('kalSearchWrap');
  if (wrap && !wrap.contains(e.target)) hideResults();
});

function hideResults() {
  const box = document.getElementById('foodSearchResults');
  if (box) box.style.display = 'none';
}

/* ── API call to /api/food-search ───────────────────────── */
async function searchFood(query) {
  if (!query) return;
  const box = document.getElementById('foodSearchResults');
  if (!box) return;
  box.innerHTML = '<div class="kal-result-loading"><i class="bi bi-hourglass-split"></i> Hľadám…</div>';
  box.style.display = 'block';

  try {
    const res  = await fetch(`/api/food-search?q=${encodeURIComponent(query)}`);
    const data = await res.json();

    if (data.error) {
      box.innerHTML = `<div class="kal-result-empty"><i class="bi bi-exclamation-circle"></i> Chyba pri načítaní. Skúste to znova.</div>`;
      return;
    }
    if (!data.products || data.products.length === 0) {
      box.innerHTML = '<div class="kal-result-empty">Žiadne výsledky. Skúste iný výraz.</div>';
      return;
    }

    box.innerHTML = data.products.slice(0, 10).map((p, i) => {
      const thumb = p.image
        ? `<img class="kal-result-thumb" src="${escHtml(p.image)}" alt="" loading="lazy">`
        : `<div class="kal-result-thumb kal-result-thumb--empty"><i class="bi bi-egg-fried"></i></div>`;
      return `<div class="kal-result-item" data-idx="${i}">
         ${thumb}
         <div class="kal-result-body">
           <div class="kal-result-name">${escHtml(p.name)}${p.brand ? ` <span class="kal-result-brand">· ${escHtml(p.brand)}</span>` : ''}</div>
           <div class="kal-result-macros">
             <span class="kal-tag kcal">${p.calories} kcal</span>
             <span class="kal-tag carbs">Sachar: ${p.carbs}&thinsp;g</span>
             <span class="kal-tag prot">Bielk: ${p.proteins}&thinsp;g</span>
             <span class="kal-tag fat">Tuky: ${p.fats}&thinsp;g</span>
             <small style="color:var(--muted);font-size:.6rem">/ 100&thinsp;g</small>
           </div>
         </div>
       </div>`;
    }).join('');

    box.querySelectorAll('.kal-result-item').forEach((el, i) => {
      el.addEventListener('click', () => {
        showAddPanel(data.products[i]);
        hideResults();
      });
    });
  } catch {
    box.innerHTML = '<div class="kal-result-empty">Chyba pri načítaní. Skúste to znova.</div>';
  }
}

/* ── Show inline "add" panel ─────────────────────────────── */
function showAddPanel(product) {
  pendingProduct = product;
  const panel = document.getElementById('addFoodPanel');
  document.getElementById('addFoodName').textContent = product.name;
  document.getElementById('addFoodMacros').innerHTML =
    `<span class="kal-tag kcal">${product.calories} kcal</span>
     <span class="kal-tag carbs">Sachar: ${product.carbs}&thinsp;g</span>
     <span class="kal-tag prot">Bielk: ${product.proteins}&thinsp;g</span>
     <span class="kal-tag fat">Tuky: ${product.fats}&thinsp;g</span>
     <small style="color:var(--muted);font-size:.6rem">/ 100&thinsp;g</small>`;
  const qtyInput = document.getElementById('qtyInput');
  if (qtyInput) qtyInput.value = 100;
  panel.style.display = 'block';
  qtyInput?.focus();
  document.getElementById('foodSearchInput').value = '';
}

document.getElementById('confirmAddBtn')?.addEventListener('click', () => {
  if (!pendingProduct) return;
  const grams = Math.max(1, parseFloat(document.getElementById('qtyInput')?.value) || 100);
  addToLog(pendingProduct, grams);
  pendingProduct = null;
  document.getElementById('addFoodPanel').style.display = 'none';
});

document.getElementById('cancelAddBtn')?.addEventListener('click', () => {
  pendingProduct = null;
  document.getElementById('addFoodPanel').style.display = 'none';
});

document.getElementById('qtyInput')?.addEventListener('keydown', e => {
  if (e.key === 'Enter') document.getElementById('confirmAddBtn')?.click();
  if (e.key === 'Escape') document.getElementById('cancelAddBtn')?.click();
});

/* ── Add food entry to log ───────────────────────────────── */
function addToLog(product, grams) {
  const f = grams / 100;
  foodLog.push({
    id:       Date.now(),
    name:     product.name,
    image:    product.image || "",
    grams,
    calories: Math.round(product.calories * f * 10) / 10,
    carbs:    Math.round(product.carbs    * f * 10) / 10,
    proteins: Math.round(product.proteins * f * 10) / 10,
    fats:     Math.round(product.fats     * f * 10) / 10,
  });
  renderLog();
}

/* ── Render food log table ───────────────────────────────── */
function renderLog() {
  const tbody    = document.getElementById('foodLogBody');
  const emptyRow = document.getElementById('emptyLogRow');
  if (!tbody) return;

  // Remove all food rows (keep emptyLogRow)
  tbody.querySelectorAll('.food-log-row').forEach(r => r.remove());

  if (foodLog.length === 0) {
    if (emptyRow) emptyRow.style.display = '';
  } else {
    if (emptyRow) emptyRow.style.display = 'none';
    foodLog.forEach(item => {
      const tr = document.createElement('tr');
      const thumb = item.image
        ? `<img class="kal-log-thumb" src="${escHtml(item.image)}" alt="" loading="lazy">`
        : `<span class="kal-log-thumb kal-log-thumb--empty"><i class="bi bi-egg-fried"></i></span>`;
      tr.className = 'food-log-row';
      tr.innerHTML = `
        <td class="kal-food-name">${thumb}${escHtml(item.name)}</td>
        <td>${item.grams}&thinsp;g</td>
        <td class="kal-kcal-cell">${item.calories}</td>
        <td>${item.carbs}&thinsp;g</td>
        <td>${item.proteins}&thinsp;g</td>
        <td>${item.fats}&thinsp;g</td>
        <td><button class="kal-remove-btn" data-id="${item.id}" title="Odstrániť"><i class="bi bi-x-lg"></i></button></td>
      `;
      tbody.appendChild(tr);
    });

    tbody.querySelectorAll('.kal-remove-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        foodLog = foodLog.filter(f => f.id !== parseInt(btn.dataset.id, 10));
        renderLog();
      });
    });
  }

  // Update summary totals
  const totals = foodLog.reduce((acc, f) => {
    acc.calories += f.calories;
    acc.carbs    += f.carbs;
    acc.proteins += f.proteins;
    acc.fats     += f.fats;
    return acc;
  }, { calories: 0, carbs: 0, proteins: 0, fats: 0 });

  document.getElementById('totalCalories').textContent = Math.round(totals.calories);
  document.getElementById('totalCarbs').textContent    = roundMacro(totals.carbs);
  document.getElementById('totalProteins').textContent = roundMacro(totals.proteins);
  document.getElementById('totalFats').textContent     = roundMacro(totals.fats);
}

document.getElementById('clearLogBtn')?.addEventListener('click', () => {
  if (foodLog.length === 0) return;
  foodLog = [];
  renderLog();
  showToast('Jedálniček vyčistený');
});

/* ── HTML escape helper ──────────────────────────────────── */
function escHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/* ── Round a macro value to one decimal place ────────────── */
function roundMacro(value) {
  return (Math.round(value * 10) / 10).toFixed(1);
}

/* ── Init ────────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  updateOnlineStatus();
  window.addEventListener('online', updateOnlineStatus);
  window.addEventListener('offline', updateOnlineStatus);
  // Chart.js needs a visible canvas → slight delay ensures layout is done
  setTimeout(() => {
    renderProgressChart();
    renderInbodyChart();
  }, 50);

  // Calendar needs the grid to have width → use ResizeObserver
  const grid = document.getElementById('timeGrid');
  if (grid) {
    const ro = new ResizeObserver(() => {
      if (grid.clientWidth > 0) { renderSessions(); ro.disconnect(); }
    });
    ro.observe(grid);
    // fallback
    setTimeout(renderSessions, 150);
  }
});

/* ============================================================
   TRÉNING TAB – Training programs from Excel
   ============================================================ */

const PROGRAMS = {
  'GBCI1': {
    name: 'Plan 1',
    level: 'Základný',
    days: [
      {
        label: 'Deň 1 a 3',
        exercises: [
          { por: 1, series: '3', tempo: '', p: '' },
          { por: 2, series: '3', tempo: '', p: '' },
          { por: 3, series: '3', tempo: '', p: '' },
          { por: 4, series: '3', tempo: '', p: '' },
          { por: 5, series: '3', tempo: '', p: '' },
          { por: 6, series: '3', tempo: '', p: '' },
          { por: 7, series: '3', tempo: '', p: '' },
          { por: 8, series: '3', tempo: '', p: '' },
        ]
      },
      {
        label: 'Deň 2 a 4',
        exercises: [
          { por: 1, series: '3', tempo: '', p: '' },
          { por: 2, series: '3', tempo: '', p: '' },
          { por: 3, series: '3', tempo: '', p: '' },
          { por: 4, series: '3', tempo: '', p: '' },
          { por: 5, series: '3', tempo: '', p: '' },
          { por: 6, series: '3', tempo: '', p: '' },
          { por: 7, series: '3', tempo: '', p: '' },
          { por: 8, series: '3', tempo: '', p: '' },
        ]
      }
    ]
  },
  '6-12-25': {
    name: 'Plan 2',
    level: 'Pokročilý',
    days: [
      {
        label: 'Deň A',
        exercises: [
          { por: 'A1', series: '6', tempo: '', p: '' },
          { por: 'A2', series: '6', tempo: '', p: '' },
          { por: 'A2', series: '6', tempo: '', p: '' },
          { por: 'B1', series: '12', tempo: '', p: '' },
          { por: 'B2', series: '12', tempo: '', p: '' },
          { por: 'B3', series: '12', tempo: '', p: '' },
          { por: 'C1', series: '25', tempo: '', p: '' },
          { por: 'C2', series: '25', tempo: '', p: '' },
          { por: 'C3', series: '25', tempo: '', p: '' },
        ]
      },
      {
        label: 'Deň B',
        exercises: [
          { por: 'A1', series: '6', tempo: '', p: '' },
          { por: 'A2', series: '6', tempo: '', p: '' },
          { por: 'A3', series: '6', tempo: '', p: '' },
          { por: 'B1', series: '12', tempo: '', p: '' },
          { por: 'B2', series: '12', tempo: '', p: '' },
          { por: 'B3', series: '12', tempo: '', p: '' },
          { por: 'C1', series: '25', tempo: '', p: '' },
          { por: 'C2', series: '25', tempo: '', p: '' },
          { por: 'C3', series: '25', tempo: '', p: '' },
        ]
      }
    ]
  }
};

let activeProgramKey = null;
let activeDayIndex = 0;
let trainingHistory = JSON.parse(localStorage.getItem('trn_history') || '[]');
const LOCAL_ACTIVE_KEY = 'trn_active';
let restoredActiveState = null; // temp holder when restoring from server/local
let dayExerciseCache = {}; // { dayIndex: [exerciseData] }
let activeStateUpdatedLocal = null;

function isoToMs(val) {
  const t = Date.parse(val || '');
  return Number.isNaN(t) ? 0 : t;
}
function debounce(fn, wait = 600) {
  let t;
  return function(...args) {
    clearTimeout(t);
    t = setTimeout(() => fn.apply(this, args), wait);
  };
}

function getCurrentActiveState() {
  if (!activeProgramKey) return null;
  dayExerciseCache[activeDayIndex] = collectFormData();
  return {
    programKey: activeProgramKey,
    activeDayIndex: activeDayIndex,
    dayExercises: dayExerciseCache,
    updated: new Date().toISOString(),
  };
}

function saveActiveStateLocal(state) {
  try { localStorage.setItem(LOCAL_ACTIVE_KEY, JSON.stringify(state)); } catch (e) { console.warn('local save failed', e); }
  activeStateUpdatedLocal = state.updated;
}

async function saveActiveStateServer(state) {
  try {
    await fetch('/api/active_state', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ state, updated: state.updated })
    });
  } catch (e) { console.warn('remote save failed', e); }
}

function saveActiveState(state) {
  saveActiveStateLocal(state);
  saveActiveStateServer(state);
}

async function clearActiveState() {
  try { localStorage.removeItem(LOCAL_ACTIVE_KEY); } catch (e) {}
  try { await fetch('/api/active_state', { method: 'DELETE' }); } catch (e) { console.warn('remote clear failed', e); }
  activeStateUpdatedLocal = null;
}

function renderHistory() {
  const list = document.getElementById('trn-history-list');
  if (!list) return;
  if (trainingHistory.length === 0) {
    list.innerHTML = '<div class="trn-history-empty"><i class="bi bi-inbox"></i><p>Zatiaľ žiadne záznamy</p></div>';
    return;
  }
  list.innerHTML = trainingHistory.slice().reverse().map((h, i) => `
    <div class="trn-history-row">
      <div class="trn-hist-icon"><i class="bi bi-activity"></i></div>
      <div class="trn-hist-info">
        <div class="trn-hist-name">${h.title ? escHtml(h.title) : `${h.programName} · ${h.dayLabel}`}</div>
        <div class="trn-hist-meta">${h.date} · ${h.exerciseCount} cvikov</div>
      </div>
      <button class="trn-hist-download" onclick="loadHistoryEntry(${trainingHistory.length - 1 - i})">
        <i class="bi bi-arrow-counterclockwise"></i> Načítať
      </button>
      <button class="trn-hist-download" onclick="downloadHistoryPDF(${trainingHistory.length - 1 - i})">
        <i class="bi bi-download"></i> PDF
      </button>
      <div class="trn-hist-menu">
        <button class="trn-hist-menu-btn" aria-label="Možnosti" onclick="toggleHistoryMenu(event)">
          <i class="bi bi-three-dots"></i>
        </button>
        <div class="trn-hist-menu-list">
          <button class="trn-hist-menu-item" onclick="deleteHistoryEntry(${trainingHistory.length - 1 - i})">
            <i class="bi bi-trash3"></i> Zmazať
          </button>
        </div>
      </div>
    </div>
  `).join('');
}

function toggleHistoryMenu(event) {
  event.stopPropagation();
  const btn = event.currentTarget;
  const menu = btn?.parentElement?.querySelector('.trn-hist-menu-list');
  if (!menu) return;
  document.querySelectorAll('.trn-hist-menu-list').forEach(m => {
    if (m !== menu) m.classList.remove('open');
  });
  menu.classList.toggle('open');
}

async function deleteHistoryEntry(idx) {
  const entry = trainingHistory[idx];
  if (!entry) return;
  const ok = window.confirm('Naozaj chcete zmazať tento tréning?');
  if (!ok) return;

  if (entry.id) {
    try {
      const res = await fetch(`/api/entries/${entry.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!data || data.status !== 'ok') {
        showToast('Zmazanie zlyhalo', false);
        return;
      }
    } catch (e) {
      showToast('Zmazanie zlyhalo', false);
      return;
    }
  }

  trainingHistory.splice(idx, 1);
  localStorage.setItem('trn_history', JSON.stringify(trainingHistory));
  renderHistory();
  showToast('Tréning zmazaný', true);
}

function resolveDayIndex(programKey, dayLabel) {
  const prog = PROGRAMS[programKey];
  if (!prog) return 0;
  const idx = prog.days.findIndex(d => d.label === dayLabel);
  return idx >= 0 ? idx : 0;
}

function loadHistoryEntry(idx) {
  const entry = trainingHistory[idx];
  if (!entry || !PROGRAMS[entry.programKey]) {
    showToast('Záznam sa nepodarilo načítať', false);
    return;
  }

  activeProgramKey = entry.programKey;
  activeDayIndex = resolveDayIndex(entry.programKey, entry.dayLabel);
  dayExerciseCache = {};
  dayExerciseCache[activeDayIndex] = entry.exercises || [];

  const state = {
    programKey: activeProgramKey,
    activeDayIndex: activeDayIndex,
    dayExercises: dayExerciseCache,
    updated: new Date().toISOString(),
  };
  saveActiveState(state);

  showEditorView();
  renderActiveProgramHeader();
  renderExerciseTable();
  showToast('Tréning načítaný', true);
}

function showActiveProgramView(state) {
  const prog = PROGRAMS[state.programKey];
  if (!prog) return;
  document.getElementById('trn-current-name').textContent = prog.name;
  const meta = `Deň: ${prog.days[state.activeDayIndex || 0].label} | Posledná zmena: ${new Date(state.updated).toLocaleString('sk-SK')}`;
  document.getElementById('trn-current-meta').textContent = meta;

  document.getElementById('trn-program-selection').style.display = 'none';
  document.getElementById('trn-current-program').style.display = 'block';
  document.getElementById('trn-active').style.display = 'none';
  document.getElementById('trn-selector').style.display = 'flex';
}

function showProgramSelectionView() {
  document.getElementById('trn-program-selection').style.display = 'block';
  document.getElementById('trn-current-program').style.display = 'none';
  document.getElementById('trn-active').style.display = 'none';
  document.getElementById('trn-selector').style.display = 'flex';
}

function showEditorView() {
  document.getElementById('trn-selector').style.display = 'none';
  document.getElementById('trn-active').style.display = 'flex';
}

async function syncServerEntries() {
  try {
    const res = await fetch('/api/entries');
    const data = await res.json();
    if (!data || data.status !== 'ok' || !Array.isArray(data.entries)) return;

    const local = JSON.parse(localStorage.getItem('trn_history') || '[]');
    const byKey = {};
    local.concat(data.entries).forEach(e => {
      const key = e.id || e.timestamp || (e.programKey + '|' + e.date);
      if (!byKey[key]) byKey[key] = e;
    });
    const merged = Object.values(byKey).sort((a, b) => (b.id || 0) - (a.id || 0));
    trainingHistory = merged;
    localStorage.setItem('trn_history', JSON.stringify(trainingHistory));
    renderHistory();
  } catch (e) {
    console.warn('Failed to sync server entries', e);
  }
}

async function restoreActiveState() {
  let state = null;
  try {
    const res = await fetch('/api/active_state');
    const data = await res.json();
    if (data && data.status === 'ok' && data.state) {
      state = data.state;
    }
  } catch (e) {
    console.warn('Failed to fetch active state from server', e);
  }

  if (!state) {
    try {
      const local = JSON.parse(localStorage.getItem(LOCAL_ACTIVE_KEY) || 'null');
      if (local && local.programKey) {
        state = local;
      }
    } catch (e) {
      console.warn('Failed to restore local active state', e);
    }
  }

  if (state && state.programKey) {
    restoredActiveState = state;
    activeProgramKey = state.programKey;
    activeDayIndex = state.activeDayIndex || 0;
    dayExerciseCache = state.dayExercises || {};
    activeStateUpdatedLocal = state.updated || null;
    showActiveProgramView(state);
  } else {
    showProgramSelectionView();
  }
}

async function pollActiveState() {
  try {
    const res = await fetch('/api/active_state');
    const data = await res.json();
    if (!data || data.status !== 'ok') return;

    if (!data.state) {
      const local = JSON.parse(localStorage.getItem(LOCAL_ACTIVE_KEY) || 'null');
      if (local || activeProgramKey) {
        await clearActiveState();
        activeProgramKey = null;
        activeDayIndex = 0;
        dayExerciseCache = {};
        showProgramSelectionView();
        showToast('Tréning bol ukončený na inom zariadení', false);
      }
      return;
    }

    const serverUpdated = isoToMs(data.state.updated);
    const localUpdated = isoToMs(activeStateUpdatedLocal || data.updated);
    if (serverUpdated <= localUpdated) return;

    activeProgramKey = data.state.programKey;
    activeDayIndex = data.state.activeDayIndex || 0;
    dayExerciseCache = data.state.dayExercises || {};
    activeStateUpdatedLocal = data.state.updated || null;
    saveActiveStateLocal(data.state);

    if (document.getElementById('trn-active')?.style.display !== 'none') {
      renderActiveProgramHeader();
      renderExerciseTable();
      showToast('Tréning bol aktualizovaný z iného zariadenia', true);
    } else {
      showActiveProgramView(data.state);
    }
  } catch (e) {
    console.warn('Failed to poll active state', e);
  }
}
const LOCAL_FOOD_KEY = 'food_log_state';
let foodLogUpdated = null;

function saveFoodLogLocal(state) {
  try { localStorage.setItem(LOCAL_FOOD_KEY, JSON.stringify(state)); } catch (e) { console.warn('local food save failed', e); }
  foodLogUpdated = state.updated;
}

async function saveFoodLogServer(state) {
  try {
    await fetch('/api/food_log', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ state, updated: state.updated })
    });
  } catch (e) { console.warn('remote food save failed', e); }
}

function saveFoodLogState() {
  const state = { items: foodLog, updated: new Date().toISOString() };
  saveFoodLogLocal(state);
  saveFoodLogServer(state);
}

async function restoreFoodLog() {
  let state = null;
  try {
    const res = await fetch('/api/food_log');
    const data = await res.json();
    if (data && data.status === 'ok' && data.state) {
      state = data.state;
    }
  } catch (e) {
    console.warn('Failed to fetch food log from server', e);
  }

  if (!state) {
    try {
      const local = JSON.parse(localStorage.getItem(LOCAL_FOOD_KEY) || 'null');
      if (local && Array.isArray(local.items)) {
        state = local;
      }
    } catch (e) {
      console.warn('Failed to restore local food log', e);
    }
  }

  if (state && Array.isArray(state.items)) {
    foodLog = state.items;
    foodLogUpdated = state.updated || null;
    renderLog();
  }
}

async function pollFoodLog() {
  try {
    const res = await fetch('/api/food_log');
    const data = await res.json();
    if (!data || data.status !== 'ok') return;

    if (!data.state) {
      const local = JSON.parse(localStorage.getItem(LOCAL_FOOD_KEY) || 'null');
      if (local && Array.isArray(local.items) && local.items.length > 0) {
        foodLog = [];
        saveFoodLogLocal({ items: [], updated: new Date().toISOString() });
        renderLog();
      }
      return;
    }

    const serverUpdated = isoToMs(data.state.updated);
    const localUpdated = isoToMs(foodLogUpdated || data.updated);
    if (serverUpdated <= localUpdated) return;

    foodLog = Array.isArray(data.state.items) ? data.state.items : [];
    foodLogUpdated = data.state.updated || null;
    saveFoodLogLocal({ items: foodLog, updated: foodLogUpdated });
    renderLog();
  } catch (e) {
    console.warn('Failed to poll food log', e);
  }
}
function startProgram(key) {
  activeProgramKey = key;
  activeDayIndex = 0;
  dayExerciseCache = {};
  showEditorView();
  renderActiveProgramHeader();
  renderExerciseTable();
  // persist initial active program state
  const st = { programKey: activeProgramKey, activeDayIndex, dayExercises: {}, updated: new Date().toISOString() };
  saveActiveState(st);
  saveFoodLogState();
}

function renderActiveProgramHeader() {
  const prog = PROGRAMS[activeProgramKey];
  document.getElementById('trn-active-badge').textContent = prog.name;
  document.getElementById('trn-active-day').textContent = prog.days[activeDayIndex].label;

  const switcher = document.getElementById('trn-day-switcher');
  switcher.innerHTML = prog.days.map((d, i) => `
    <button class="trn-day-btn ${i === activeDayIndex ? 'active' : ''}" onclick="switchDay(${i})">${d.label}</button>
  `).join('');
}

function switchDay(idx) {
  dayExerciseCache[activeDayIndex] = collectFormData();
  activeDayIndex = idx;
  renderActiveProgramHeader();
  renderExerciseTable();
  const state = getCurrentActiveState();
  if (state) saveActiveState(state);
}

function normalizeExerciseName(name) {
  return String(name || '').trim().toLowerCase();
}

function buildPrevExerciseMap() {
  const map = {};
  const entries = trainingHistory.slice().sort((a, b) => {
    const aKey = a.timestamp ? Date.parse(a.timestamp) : (a.id || 0);
    const bKey = b.timestamp ? Date.parse(b.timestamp) : (b.id || 0);
    return (bKey || 0) - (aKey || 0);
  });

  entries.forEach(entry => {
    (entry.exercises || []).forEach(ex => {
      const key = normalizeExerciseName(ex.cvik);
      if (!key || map[key]) return;
      map[key] = {
        set1op: ex.set1op || '',
        set1kg: ex.set1kg || '',
        set2op: ex.set2op || '',
        set2kg: ex.set2kg || '',
        set3op: ex.set3op || '',
        set3kg: ex.set3kg || '',
      };
    });
  });

  return map;
}

function applyPrevPlaceholders(idx, prevMap) {
  const apply = (id, fallback) => {
    const el = document.getElementById(id);
    if (!el) return;
    const parts = id.split('_')[0];
    const setNum = parts.replace('set', '').replace('op', '').replace('kg', '');
    const isKg = id.includes('kg');
    const isOp = id.includes('op');
    
    if (isOp) {
      const key = `set${setNum}op`;
      if (prevMap[key]) el.setAttribute('placeholder', prevMap[key]);
    } else if (isKg) {
      const key = `set${setNum}kg`;
      if (prevMap[key]) el.setAttribute('placeholder', prevMap[key]);
    }
  };

  apply(`set1op_${idx}`);
  apply(`set1kg_${idx}`);
  apply(`set2op_${idx}`);
  apply(`set2kg_${idx}`);
  apply(`set3op_${idx}`);
  apply(`set3kg_${idx}`);
}

function renderExerciseTable() {
  const prog = PROGRAMS[activeProgramKey];
  const day = prog.days[activeDayIndex];
  const exercises = dayExerciseCache[activeDayIndex] || day.exercises;
  const tbody = document.getElementById('trn-tbody');

  // Group by section (A/B/C for 6-12-25, flat for GBCI1)
  let rows = '';
  let lastSection = null;

  exercises.forEach((ex, idx) => {
    const section = typeof ex.por === 'string' ? ex.por[0] : null;
    if (section && section !== lastSection) {
      lastSection = section;
      const sectionName = section === 'A' ? 'Sekcia A (6 opakovaní)' : section === 'B' ? 'Sekcia B (12 opakovaní)' : 'Sekcia C (25 opakovaní)';
      rows += `<tr class="trn-section-row"><td colspan="9">${sectionName}</td></tr>`;
    }

    rows += `
      <tr>
        <td class="trn-por">${ex.por}</td>
        <td><input class="trn-cvik-input" type="text" placeholder="Názov cviku…" id="cvik_${idx}" value="${ex.cvik || ''}"></td>
        <td><input class="trn-series-input" type="text" placeholder="${ex.series}" id="series_${idx}" value="${ex.series || ''}"></td>
        <td><input class="trn-tempo-input" type="text" placeholder="—" id="tempo_${idx}" value="${ex.tempo || ''}"></td>
        <td><input class="trn-p-input" type="text" placeholder="—" id="p_${idx}" value="${ex.p || ''}"></td>
        <td>
          <div class="trn-set-cell">
            <input class="trn-set-inp" type="number" placeholder="op" id="set1op_${idx}" value="${ex.set1op || ''}" min="0">
            <span class="trn-set-sep">/</span>
            <input class="trn-set-inp" type="number" placeholder="kg" id="set1kg_${idx}" value="${ex.set1kg || ''}" step="0.5" min="0">
          </div>
        </td>
        <td>
          <div class="trn-set-cell">
            <input class="trn-set-inp" type="number" placeholder="op" id="set2op_${idx}" value="${ex.set2op || ''}" min="0">
            <span class="trn-set-sep">/</span>
            <input class="trn-set-inp" type="number" placeholder="kg" id="set2kg_${idx}" value="${ex.set2kg || ''}" step="0.5" min="0">
          </div>
        </td>
        <td>
          <div class="trn-set-cell">
            <input class="trn-set-inp" type="number" placeholder="op" id="set3op_${idx}" value="${ex.set3op || ''}" min="0">
            <span class="trn-set-sep">/</span>
            <input class="trn-set-inp" type="number" placeholder="kg" id="set3kg_${idx}" value="${ex.set3kg || ''}" step="0.5" min="0">
          </div>
        </td>
        <td><input class="trn-note-input" type="text" placeholder="Poznámka…" id="note_${idx}" value="${ex.note || ''}"></td>
      </tr>
    `;
  });

  tbody.innerHTML = rows;

  // Apply previous exercise placeholders
  const prevMap = buildPrevExerciseMap();
  exercises.forEach((ex, idx) => {
    applyPrevPlaceholders(idx, prevMap[normalizeExerciseName(ex.cvik)] || {});
  });

  // Attach input listeners to autosave progress (debounced)
  const saveDebounced = debounce(() => {
    const state = getCurrentActiveState();
    if (state) saveActiveState(state);
  }, 800);

  tbody.querySelectorAll('input').forEach(inp => {
    inp.addEventListener('input', saveDebounced);
  });
}

function collectFormData() {
  const prog = PROGRAMS[activeProgramKey];
  const day = prog.days[activeDayIndex];
  const exercises = dayExerciseCache[activeDayIndex] || day.exercises;
  return exercises.map((ex, idx) => ({
    por: ex.por,
    cvik: document.getElementById(`cvik_${idx}`)?.value || '',
    series: document.getElementById(`series_${idx}`)?.value || ex.series,
    tempo: document.getElementById(`tempo_${idx}`)?.value || '',
    p: document.getElementById(`p_${idx}`)?.value || '',
    set1op: document.getElementById(`set1op_${idx}`)?.value || '',
    set1kg: document.getElementById(`set1kg_${idx}`)?.value || '',
    set2op: document.getElementById(`set2op_${idx}`)?.value || '',
    set2kg: document.getElementById(`set2kg_${idx}`)?.value || '',
    set3op: document.getElementById(`set3op_${idx}`)?.value || '',
    set3kg: document.getElementById(`set3kg_${idx}`)?.value || '',
    note: document.getElementById(`note_${idx}`)?.value || '',
  }));
}

function cancelProgram(clear = false) {
  document.getElementById('trn-selector').style.display = 'flex';
  document.getElementById('trn-active').style.display = 'none';
  if (clear) {
    activeProgramKey = null;
    activeDayIndex = 0;
  }
}

async function saveProgress() {
  if (!activeProgramKey) return;
  const ok = window.confirm('Naozaj chcete uložiť a uzavrieť tento tréning (deň)?');
  if (!ok) return;

  const prog = PROGRAMS[activeProgramKey];
  const day = prog.days[activeDayIndex];
  const data = collectFormData();
  const now = new Date();
  const dateStr = now.toLocaleDateString('sk-SK');

  const clientNameEl = document.querySelector('.client-name');
  const clientName = clientNameEl ? clientNameEl.textContent.trim() : 'Klient';
  const timeStr = now.toLocaleTimeString('sk-SK', { hour: '2-digit', minute: '2-digit' });
  const defaultTitle = `${clientName} - ${prog.name} - ${day.label} ${dateStr} ${timeStr}`;
  const inputTitle = window.prompt('Názov tréningu', defaultTitle);
  if (inputTitle === null) return;
  const finalTitle = inputTitle.trim() || defaultTitle;

  // Save to history
  const entry = {
    programKey: activeProgramKey,
    title: finalTitle,
    programName: prog.name,
    dayLabel: day.label,
    date: dateStr,
    timestamp: now.toISOString(),
    exerciseCount: data.length,
    exercises: data
  };
  try {
    const res = await fetch('/api/save_entry', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(entry),
    });
    const resp = await res.json();
    if (resp && resp.status === 'ok' && resp.id) entry.id = resp.id;
  } catch (e) {
    console.warn('Failed to save entry on server');
    showToast('Uložené lokálne (offline)', false);
  }

  trainingHistory.push(entry);
  localStorage.setItem('trn_history', JSON.stringify(trainingHistory));

  if (dayExerciseCache[activeDayIndex]) {
    dayExerciseCache[activeDayIndex] = dayExerciseCache[activeDayIndex].map(ex => ({
      ...ex, set1op: '', set1kg: '', set2op: '', set2kg: '', set3op: '', set3kg: ''
    }));
  }

  await clearActiveState();
  const resetState = { programKey: activeProgramKey, activeDayIndex, dayExercises: dayExerciseCache, updated: new Date().toISOString() };
  saveActiveState(resetState);

  renderExerciseTable();
  renderHistory();
  showToast('Výsledky uložené. Čaká sa na ďalšie zadania.', true);
}

async function endProgram() {
  if (!activeProgramKey) return;
  const ok = window.confirm('Naozaj chcete natrvalo ukončiť celý prebiehajúci program?');
  if (!ok) return;

  await clearActiveState();
  activeProgramKey = null;
  activeDayIndex = 0;
  dayExerciseCache = {};
  showProgramSelectionView();
  renderHistory();
  showToast('Program ukončený a archivovaný!', true);
}

function generatePDF(entry) {
  // Build print-friendly HTML
  const rows = entry.exercises.map(ex => `
    <tr>
      <td style="font-weight:700;color:#1A5080;padding:6px 8px;border:1px solid #DDE4EF;text-align:center;">${ex.por}</td>
      <td style="padding:6px 8px;border:1px solid #DDE4EF;">${ex.cvik || '—'}</td>
      <td style="padding:6px 8px;border:1px solid #DDE4EF;text-align:center;">${ex.series || '—'}</td>
      <td style="padding:6px 8px;border:1px solid #DDE4EF;text-align:center;">${ex.tempo || '—'}</td>
      <td style="padding:6px 8px;border:1px solid #DDE4EF;text-align:center;">${ex.p || '—'}</td>
      <td style="padding:6px 8px;border:1px solid #DDE4EF;text-align:center;">${ex.set1op ? ex.set1op + ' / ' + (ex.set1kg || '—') + 'kg' : '—'}</td>
      <td style="padding:6px 8px;border:1px solid #DDE4EF;text-align:center;">${ex.set2op ? ex.set2op + ' / ' + (ex.set2kg || '—') + 'kg' : '—'}</td>
      <td style="padding:6px 8px;border:1px solid #DDE4EF;text-align:center;">${ex.set3op ? ex.set3op + ' / ' + (ex.set3kg || '—') + 'kg' : '—'}</td>
      <td style="padding:6px 8px;border:1px solid #DDE4EF;">${ex.note || ''}</td>
    </tr>
  `).join('');

  const pdfTitle = entry.title || `${entry.programName} - ${entry.dayLabel} - ${entry.date}`;
  const html = `<!DOCTYPE html>
<html lang="sk">
<head>
<meta charset="UTF-8">
<title>${pdfTitle}</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'DM Sans', Arial, sans-serif; font-size: 11px; color: #1A2636; padding: 24px; }
  h1 { font-size: 20px; font-weight: 900; color: #1E3A5F; letter-spacing: .04em; margin-bottom: 3px; }
  .meta { font-size: 10px; color: #6B7D93; margin-bottom: 16px; }
  .badge { display: inline-block; background: #EAF3FB; color: #1A5080; font-size: 9px; font-weight: 700; letter-spacing: .06em; padding: 2px 9px; border-radius: 20px; margin-right: 6px; text-transform: uppercase; }
  table { width: 100%; border-collapse: collapse; margin-top: 10px; }
  thead th { background: #1E3A5F; color: #fff; padding: 7px 8px; font-size: 9px; font-weight: 700; letter-spacing: .04em; text-transform: uppercase; border: 1px solid #1A5080; text-align: left; }
  tbody tr:nth-child(even) { background: #F5F8FD; }
  @media print { body { padding: 12px; } }
</style>
</head>
<body>
  <div class="badge">Maglen Training Center</div>
  <h1>${pdfTitle}</h1>
  <div class="meta">Dátum: ${entry.date} &nbsp;|&nbsp; Počet cvikov: ${entry.exerciseCount}</div>
  <table>
    <thead>
      <tr>
        <th>Por.</th><th>Cvik</th><th>Série×op</th><th>Tempo</th><th>P</th>
        <th>Séria 1</th><th>Séria 2</th><th>Séria 3</th><th>Poznámka</th>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>
</body>
</html>`;

  const blob = new Blob([html], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const safeTitle = String(pdfTitle).replace(/[^a-zA-Z0-9_-]+/g, '_');
  a.download = `trening_${safeTitle}.html`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function downloadHistoryPDF(idx) {
  const entry = trainingHistory[idx];
  if (entry) generatePDF(entry);
}

document.addEventListener('DOMContentLoaded', () => {
  const saveBtn = document.getElementById('trn-save-btn');
  if (saveBtn) {
    saveBtn.addEventListener('click', () => {
      saveProgress();
    });
  }

  const endBtn = document.getElementById('trn-end-btn');
  if (endBtn) {
    endBtn.addEventListener('click', endProgram);
  }

  const continueBtn = document.getElementById('trn-continue-btn');
  if (continueBtn) {
    continueBtn.addEventListener('click', () => {
      showEditorView();
      renderActiveProgramHeader();
      renderExerciseTable();
    });
  }

  const backBtn = document.getElementById('trn-back-btn');
  if (backBtn) {
    backBtn.addEventListener('click', () => {
      const state = getCurrentActiveState();
      if (state) {
        saveActiveState(state);
        showActiveProgramView(state);
      }
    });
  }

  renderHistory();
  restoreActiveState();
  syncServerEntries();
  restoreFoodLog();

  setInterval(syncServerEntries, 15000);
  setInterval(pollActiveState, 6000);
  setInterval(pollFoodLog, 8000);
  document.addEventListener('click', () => {
    document.querySelectorAll('.trn-hist-menu-list').forEach(m => m.classList.remove('open'));
  });
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
      syncServerEntries();
      pollActiveState();
      pollFoodLog();
    }
  });
  saveFoodLogState();
});
