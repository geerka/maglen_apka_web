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

    if (!data.products || data.products.length === 0) {
      box.innerHTML = '<div class="kal-result-empty">Žiadne výsledky. Skúste iný výraz.</div>';
      return;
    }

    box.innerHTML = data.products.slice(0, 10).map((p, i) =>
      `<div class="kal-result-item" data-idx="${i}">
         <div class="kal-result-name">${escHtml(p.name)}${p.brand ? ` <span class="kal-result-brand">· ${escHtml(p.brand)}</span>` : ''}</div>
         <div class="kal-result-macros">
           <span class="kal-tag kcal">${p.calories} kcal</span>
           <span class="kal-tag carbs">Sachar: ${p.carbs}&thinsp;g</span>
           <span class="kal-tag prot">Bielk: ${p.proteins}&thinsp;g</span>
           <span class="kal-tag fat">Tuky: ${p.fats}&thinsp;g</span>
           <small style="color:var(--muted);font-size:.6rem">/ 100&thinsp;g</small>
         </div>
       </div>`
    ).join('');

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
      tr.className = 'food-log-row';
      tr.innerHTML = `
        <td class="kal-food-name">${escHtml(item.name)}</td>
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
  const totals = foodLog.reduce(
    (a, f) => ({ calories: a.calories + f.calories, carbs: a.carbs + f.carbs, proteins: a.proteins + f.proteins, fats: a.fats + f.fats }),
    { calories: 0, carbs: 0, proteins: 0, fats: 0 }
  );
  document.getElementById('totalCalories').textContent = Math.round(totals.calories);
  document.getElementById('totalCarbs').textContent    = (Math.round(totals.carbs    * 10) / 10).toFixed(1);
  document.getElementById('totalProteins').textContent = (Math.round(totals.proteins * 10) / 10).toFixed(1);
  document.getElementById('totalFats').textContent     = (Math.round(totals.fats     * 10) / 10).toFixed(1);
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

/* ── Init ────────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
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
