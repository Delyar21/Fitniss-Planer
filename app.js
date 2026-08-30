// ============================================================
// FITNESS MASTER PLAN — COMPLETE EDIT ENGINE v2.0
// ============================================================

let currentLang = localStorage.getItem('fitness_language') || 'ar';
let currentTab  = 'overview';
let editMode    = false;

// ─── LANGUAGE CONTROLLER ────────────────────────────────────
function setLang(lang, btn) {
  currentLang = lang;
  document.querySelectorAll('.lang-btn').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');
  document.querySelectorAll('[data-lang]').forEach(el =>
    el.classList.toggle('show', el.dataset.lang === lang));
  document.querySelectorAll('[data-lang-inline]').forEach(el =>
    el.classList.toggle('show', el.dataset.langInline === lang));
  const ctx = typeof getPlanContext === 'function' ? getPlanContext() : { planId:'default', name:'' };
  const subs = ctx.planId !== 'default' ? {
    ar: ctx.name + ' — خطة مخصصة',
    de: ctx.name + ' — Benutzerdefinierter Plan',
    en: ctx.name + ' — Custom Plan'
  } : {
    ar: 'خطتك الكاملة | الصالة + كاليستانيكس + ماراتون',
    de: 'Dein kompletter Plan | Gym + Calisthenics + Marathon',
    en: 'Your complete plan | Gym + Calisthenics + Marathon'
  };
  document.getElementById('hero-sub').textContent = subs[lang];
  document.documentElement.dir  = lang === 'ar' ? 'rtl' : 'ltr';
  document.documentElement.lang = lang;

  // Update toolbar labels and Fitness 2.0 UI on language change
  updateToolbarLabels();
  localStorage.setItem('fitness_language', lang);
  window.FitnessFeatures?.refreshLanguage?.();
}

// ─── TAB SWITCHER ───────────────────────────────────────────
function setTab(tab) {
  currentTab = tab;
  document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  document.getElementById('sec-' + tab).classList.add('active');
  document.getElementById('tab-' + tab).classList.add('active');
}

// ─── ACCORDION ──────────────────────────────────────────────
function toggleMeal(head) {
  const body = head.nextElementSibling;
  const isOpen = body.classList.contains('open');
  body.classList.toggle('open', !isOpen);
  head.classList.toggle('open-head', !isOpen);
}

// ============================================================
// EDIT MODE ENGINE
// ============================================================

function toggleEditMode() {
  editMode = !editMode;
  document.body.classList.toggle('edit-mode', editMode);

  updateToolbarLabels();

  if (editMode) {
    makePageEditable();
  } else {
    saveAllEdits();
    removeEditHandles();
  }
}

function updateToolbarLabels() {
  const btn = document.getElementById('edit-toggle-btn');
  const resetBtn = document.getElementById('reset-btn');
  if (!btn) return;
  const labels = {
    ar: ['\u270F\uFE0F \u062A\u0639\u062F\u064A\u0644 \u0627\u0644\u062E\u0637\u0629', '\u2705 \u0627\u0646\u062A\u0647\u0627\u0621 \u0627\u0644\u062A\u0639\u062F\u064A\u0644'],
    de: ['\u270F\uFE0F Plan bearbeiten', '\u2705 Bearbeitung beenden'],
    en: ['\u270F\uFE0F Edit Plan', '\u2705 Done Editing']
  };
  const resetLabels = { ar: '\u21A9 \u0625\u0639\u0627\u062F\u0629 \u062A\u0639\u064A\u064A\u0646', de: '\u21A9 Zur\u00FCcksetzen', en: '\u21A9 Reset' };
  btn.textContent = labels[currentLang][editMode ? 1 : 0];
  btn.classList.toggle('active', editMode);
  if (resetBtn) resetBtn.textContent = resetLabels[currentLang];
}

// ─── MAKE EVERYTHING EDITABLE ───────────────────────────────
function makePageEditable() {
  // 1. All editable text elements
  const textSelectors = [
    '.sec-title', '.sec-sub',
    '.tip-text',
    '.phase h3', '.phase p', '.phase-label',
    '.mt-month', '.mt-focus', '.mt-detail', '.mt-km',
    '.ex-name', '.ex-detail', '.ex-type',
    '.session',
    '.meal-name', '.meal-desc', '.meal-time',
    '.meal-head h3',
    '.budget-desc', '.budget-cat',
    '.stat-val', '.stat-lbl',
    '.muscle-group-header',
    '.hero-tag', '#hero-sub',
    '.kcal-badge',
    '.set-badge',
    '.budget-val-text'
  ];

  textSelectors.forEach(sel => {
    document.querySelectorAll(sel).forEach(el => {
      if (!el.classList.contains('editable-text')) {
        el.classList.add('editable-text');
        el.setAttribute('contenteditable', 'true');
        el.setAttribute('spellcheck', 'false');
      }
    });
  });

  // 2. Checklist items (strong + text)
  document.querySelectorAll('.checklist li').forEach(li => {
    li.setAttribute('contenteditable', 'true');
    li.classList.add('editable-text');
  });

  // 3. Progress bars — show sliders
  document.querySelectorAll('.progress-bar').forEach(bar => {
    if (bar.querySelector('.prog-slider')) return;
    const fill = bar.querySelector('.progress-fill');
    if (!fill) return;
    const slider = document.createElement('input');
    slider.type  = 'range';
    slider.min   = '0'; slider.max = '100';
    slider.value = parseInt(fill.style.width) || 50;
    slider.className = 'prog-slider';
    slider.oninput = () => { fill.style.width = slider.value + '%'; };
    bar.appendChild(slider);
  });

  // 4. Add "Add Card" buttons to ex-grids
  document.querySelectorAll('.ex-grid').forEach(grid => {
    if (grid.querySelector('.add-card-btn')) return;
    const btn = document.createElement('button');
    btn.className = 'add-card-btn';
    btn.textContent = currentLang === 'ar' ? '+ إضافة تمرين' : currentLang === 'de' ? '+ Übung hinzufügen' : '+ Add Exercise';
    btn.onclick = () => addExCard(grid);
    grid.appendChild(btn);
  });

  // 5. Add session buttons in week-grids
  document.querySelectorAll('.day-body').forEach(body => {
    if (body.querySelector('.add-session-btn')) return;
    const btn = document.createElement('button');
    btn.className = 'add-session-btn';
    btn.textContent = '+';
    btn.onclick = () => addSession(body);
    body.appendChild(btn);
  });

  // 6. Delete handles on ex-cards
  document.querySelectorAll('.ex-card').forEach(card => {
    if (!card.querySelector('.delete-card-btn')) addDeleteBtn(card);
  });

  // 7. Delete handles on sessions
  document.querySelectorAll('.session').forEach(s => {
    if (!s.querySelector('.delete-session-btn')) {
      const x = document.createElement('button');
      x.className = 'delete-session-btn';
      x.textContent = '×';
      x.onclick = (e) => { e.stopPropagation(); s.remove(); };
      s.appendChild(x);
    }
  });

  // 8. Add meal items
  document.querySelectorAll('.meal-body').forEach(body => {
    if (body.querySelector('.add-meal-btn')) return;
    const btn = document.createElement('button');
    btn.className = 'add-meal-btn';
    btn.textContent = '+ Add Meal';
    btn.onclick = () => addMealItem(body);
    body.appendChild(btn);
  });

  // 9. Delete on meal items
  document.querySelectorAll('.meal-item').forEach(item => {
    if (!item.querySelector('.delete-card-btn')) addDeleteBtn(item);
  });

  // 10. Marathon timeline — add & delete
  document.querySelectorAll('.marathon-timeline').forEach(tl => {
    if (tl.querySelector('.add-mt-btn')) return;
    const btn = document.createElement('button');
    btn.className = 'add-mt-btn edit-action-btn';
    btn.textContent = '+ Add Phase';
    btn.onclick = () => addMarathonPhase(tl);
    tl.appendChild(btn);
  });
  document.querySelectorAll('.mt-item').forEach(item => {
    if (!item.querySelector('.delete-card-btn')) addDeleteBtn(item);
  });

  // 11. Phase cards (overview)
  document.querySelectorAll('.phase').forEach(p => {
    if (!p.querySelector('.delete-card-btn')) addDeleteBtn(p);
  });

  // 12. Add phase to timeline
  document.querySelectorAll('.timeline').forEach(tl => {
    if (tl.querySelector('.add-phase-btn')) return;
    const btn = document.createElement('button');
    btn.className = 'add-phase-btn edit-action-btn';
    btn.textContent = '+ Add Phase';
    btn.onclick = () => addPhaseCard(tl);
    tl.after(btn);
  });

  // 13. Budget items — show remove btns
  document.querySelectorAll('.budget-item .remove-budget-btn').forEach(b => {
    b.style.display = 'inline-block';
    b.closest('.budget-item').classList.add('editable');
  });
  document.querySelectorAll('.budget-add-btn').forEach(b => b.classList.remove('hidden'));

  // 14. Checklist add
  document.querySelectorAll('.checklist').forEach(list => {
    if (list.querySelector('.add-checklist-btn')) return;
    const btn = document.createElement('button');
    btn.className = 'add-checklist-btn edit-action-btn';
    btn.textContent = '+ Add Item';
    btn.onclick = () => addChecklistItem(list);
    list.appendChild(btn);
  });
  document.querySelectorAll('.checklist li').forEach(li => {
    if (!li.querySelector('.delete-li-btn')) {
      const x = document.createElement('button');
      x.className = 'delete-li-btn';
      x.textContent = '×';
      x.onclick = (e) => { e.stopPropagation(); li.remove(); };
      li.prepend(x);
    }
  });

  // 15. Tip items - add/delete
  document.querySelectorAll('.tip').forEach(tip => {
    if (!tip.querySelector('.delete-card-btn')) addDeleteBtn(tip);
  });

  // 16. Budget grid items editable
  document.querySelectorAll('.budget-val-text').forEach(el => {
    el.setAttribute('contenteditable', 'true');
    el.classList.add('editable-text');
    el.onclick = null; // remove old inline handler, use contenteditable
  });

  // 17. meal-day add
  document.querySelectorAll('.section .content > div').forEach(langDiv => {
    const lang = langDiv.dataset.lang;
    if (!lang) return;
    if (langDiv.querySelector('.add-mealday-btn')) return;
    const btn = document.createElement('button');
    btn.className = 'add-mealday-btn edit-action-btn';
    btn.textContent = '+ Add Day Plan';
    btn.onclick = () => addMealDay(langDiv);
    langDiv.appendChild(btn);
  });
}

function removeEditHandles() {
  document.querySelectorAll(
    '.add-card-btn,.add-session-btn,.delete-card-btn,.delete-session-btn,' +
    '.add-meal-btn,.add-mt-btn,.add-checklist-btn,.delete-li-btn,' +
    '.edit-action-btn,.add-phase-btn,.add-mealday-btn,.prog-slider'
  ).forEach(el => el.remove());

  document.querySelectorAll('.editable-text').forEach(el => {
    el.removeAttribute('contenteditable');
    el.classList.remove('editable-text');
  });

  document.querySelectorAll('.budget-item .remove-budget-btn').forEach(b => {
    b.style.display = '';
  });
}

// ─── HELPER: ADD DELETE BUTTON ──────────────────────────────
function addDeleteBtn(el) {
  const btn = document.createElement('button');
  btn.className = 'delete-card-btn';
  btn.textContent = '×';
  btn.onclick = (e) => { e.stopPropagation(); el.remove(); };
  el.style.position = 'relative';
  el.appendChild(btn);
}

// ─── ADD EXERCISE CARD ───────────────────────────────────────
function addExCard(grid) {
  const card = document.createElement('div');
  card.className = 'ex-card';
  card.style.position = 'relative';
  card.innerHTML = `
    <div class="ex-type gym editable-text" contenteditable="true" spellcheck="false">${currentLang === 'ar' ? 'صالة · عضلة' : currentLang === 'de' ? 'Gym · Muskel' : 'Gym · Muscle'}</div>
    <div class="ex-name editable-text" contenteditable="true" spellcheck="false">${currentLang === 'ar' ? 'اسم التمرين' : currentLang === 'de' ? 'Übungsname' : 'Exercise Name'}</div>
    <div class="ex-detail editable-text" contenteditable="true" spellcheck="false">${currentLang === 'ar' ? 'الوصف والتقنية والملاحظات...' : currentLang === 'de' ? 'Beschreibung, Technik und Hinweise...' : 'Description, technique and cues...'}</div>
    <div class="ex-sets">
      <span class="set-badge gym editable-text" contenteditable="true" spellcheck="false">3 × 10</span>
      <span class="set-badge gym editable-text" contenteditable="true" spellcheck="false">${currentLang === 'ar' ? 'راحة 60 ثا' : currentLang === 'de' ? '60 Sek. Pause' : '60 sec rest'}</span>
    </div>
  `;
  addDeleteBtn(card);
  grid.insertBefore(card, grid.querySelector('.add-card-btn'));
}

// ─── ADD SESSION TO DAY ──────────────────────────────────────
function addSession(body) {
  const s = document.createElement('span');
  s.className = 'session gym editable-text';
  s.setAttribute('contenteditable', 'true');
  s.setAttribute('spellcheck', 'false');
  s.style.position = 'relative';
  s.textContent = '🏋️ New Session';
  const x = document.createElement('button');
  x.className = 'delete-session-btn';
  x.textContent = '×';
  x.onclick = (e) => { e.stopPropagation(); s.remove(); };
  s.appendChild(x);
  body.insertBefore(s, body.querySelector('.add-session-btn'));
}

// ─── ADD MEAL ITEM ───────────────────────────────────────────
function addMealItem(body) {
  const item = document.createElement('div');
  item.className = 'meal-item';
  item.style.position = 'relative';
  item.innerHTML = `
    <div class="meal-time editable-text" contenteditable="true" spellcheck="false">00:00 · Meal</div>
    <div class="meal-name editable-text" contenteditable="true" spellcheck="false">Meal Name</div>
    <div class="meal-desc editable-text" contenteditable="true" spellcheck="false">Ingredients and preparation...</div>
    <div class="kcal-badge editable-text" contenteditable="true" spellcheck="false">~000 kcal · 00g protein</div>
  `;
  addDeleteBtn(item);
  body.insertBefore(item, body.querySelector('.add-meal-btn'));
}

// ─── ADD MEAL DAY ─────────────────────────────────────────────
function addMealDay(langDiv) {
  const day = document.createElement('div');
  day.className = 'meal-day';
  day.style.position = 'relative';
  day.innerHTML = `
    <div class="meal-head" onclick="toggleMeal(this)">
      <h3 class="editable-text" contenteditable="true" spellcheck="false">🍽️ New Day Type</h3>
      <div class="meal-kcal editable-text" contenteditable="true" spellcheck="false">~0000 kcal <span class="arrow">▼</span></div>
    </div>
    <div class="meal-body">
      <div class="meal-item" style="position:relative">
        <div class="meal-time editable-text" contenteditable="true" spellcheck="false">07:00 · Breakfast</div>
        <div class="meal-name editable-text" contenteditable="true" spellcheck="false">Meal Name</div>
        <div class="meal-desc editable-text" contenteditable="true" spellcheck="false">Ingredients...</div>
        <div class="kcal-badge editable-text" contenteditable="true" spellcheck="false">~000 kcal</div>
      </div>
    </div>
  `;
  addDeleteBtn(day);
  langDiv.insertBefore(day, langDiv.querySelector('.add-mealday-btn'));
}

// ─── ADD MARATHON PHASE ──────────────────────────────────────
function addMarathonPhase(tl) {
  const item = document.createElement('div');
  item.className = 'mt-item';
  item.style.position = 'relative';
  item.innerHTML = `
    <div class="mt-month editable-text" contenteditable="true" spellcheck="false">Month YYYY</div>
    <div class="mt-focus editable-text" contenteditable="true" spellcheck="false">Phase Title</div>
    <div class="mt-detail editable-text" contenteditable="true" spellcheck="false">Describe your training for this phase...</div>
    <div class="mt-km editable-text" contenteditable="true" spellcheck="false">0-00 km/week</div>
  `;
  addDeleteBtn(item);
  tl.insertBefore(item, tl.querySelector('.add-mt-btn'));
}

// ─── ADD PHASE CARD (OVERVIEW) ────────────────────────────────
function addPhaseCard(tl) {
  const num = tl.querySelectorAll('.phase').length + 1;
  const colors = ['p1','p2','p3','p4'];
  const cls = colors[Math.min(num-1, colors.length-1)];
  const phase = document.createElement('div');
  phase.className = `phase ${cls}`;
  phase.style.position = 'relative';
  phase.innerHTML = `
    <div class="phase-num">${String(num).padStart(2,'0')}</div>
    <div class="phase-label editable-text" contenteditable="true" spellcheck="false">Phase ${num}</div>
    <h3 class="editable-text" contenteditable="true" spellcheck="false">Phase Title</h3>
    <p class="editable-text" contenteditable="true" spellcheck="false">Month – Month YYYY (X months)<br>Description of this training phase...</p>
    <div class="progress-bar"><div class="progress-fill" style="width:50%;background:var(--gym)"></div></div>
  `;
  addDeleteBtn(phase);
  tl.appendChild(phase);
  // add slider to progress bar (not fill)
  const progressBar = phase.querySelector('.progress-bar');
  const fill = phase.querySelector('.progress-fill');
  const slider = document.createElement('input');
  slider.type = 'range'; slider.min = '0'; slider.max = '100'; slider.value = 50;
  slider.className = 'prog-slider';
  slider.oninput = () => { fill.style.width = slider.value + '%'; };
  progressBar.appendChild(slider);
}

// ─── ADD CHECKLIST ITEM ──────────────────────────────────────
function addChecklistItem(list) {
  const li = document.createElement('li');
  li.setAttribute('contenteditable', 'true');
  li.setAttribute('spellcheck', 'false');
  li.classList.add('editable-text');
  li.innerHTML = `<strong>New item:</strong> Description`;
  const x = document.createElement('button');
  x.className = 'delete-li-btn';
  x.textContent = '×';
  x.onclick = (e) => { e.stopPropagation(); li.remove(); };
  li.prepend(x);
  list.insertBefore(li, list.querySelector('.add-checklist-btn'));
}

// ============================================================
// BUDGET FUNCTIONS (original)
// ============================================================

function editBudget(el) {
  if (editMode) return; // In edit mode, contenteditable handles it
  const valSpan = el.parentElement;
  const currentVal = el.textContent;
  if (valSpan.querySelector('.budget-edit-input')) return;
  const input = document.createElement('input');
  input.className = 'budget-edit-input';
  input.type = 'text';
  input.value = currentVal;
  input.onblur = () => saveBudgetValue(input, el, currentVal);
  input.onkeypress = (e) => { if (e.key === 'Enter') saveBudgetValue(input, el, currentVal); };
  el.style.display = 'none';
  valSpan.insertBefore(input, el.nextSibling);
  input.focus(); input.select();
}

function saveBudgetValue(input, el, oldVal) {
  el.textContent = input.value || oldVal;
  input.remove();
  el.style.display = 'inline-block';
}

function showSuggestions(lang, btn) {
  const suggestionsDiv = document.getElementById('suggestions-' + lang);
  suggestionsDiv.style.display = suggestionsDiv.style.display === 'none' ? 'grid' : 'none';
}

function addBudgetItem(lang, cat, val, desc) {
  const grid = document.getElementById('budget-grid-' + lang);
  const item = document.createElement('div');
  item.className = 'budget-item editable';
  const removeText = lang === 'ar' ? '\u062D\u0630\u0641' : lang === 'de' ? 'L\u00F6schen' : 'Remove';
  item.innerHTML = `
    <div class="budget-cat">${cat}</div>
    <div class="budget-val">
      <span class="budget-val-text" onclick="editBudget(this)">${val}</span>
      <button class="remove-budget-btn" onclick="removeBudgetItem(this)">${removeText}</button>
    </div>
    <div class="budget-desc">${desc}</div>
  `;
  grid.appendChild(item);
  document.getElementById('suggestions-' + lang).style.display = 'none';
}

function removeBudgetItem(btn) {
  btn.closest('.budget-item').remove();
}

function saveBudgetChanges() {
  saveAllEdits();
}

// ============================================================
// SAVE / LOAD — FULL PAGE STATE via localStorage
// ============================================================

function saveAllEdits() {
  const state = {};

  ['ar','de','en'].forEach(lang => {
    state[lang] = {};
    ['overview','weekly','exercises','nutrition','marathon','budget'].forEach(tab => {
      const sec = document.getElementById('sec-' + tab);
      if (!sec) return;
      const langDiv = sec.querySelector('[data-lang="' + lang + '"]');
      if (langDiv) {
        // Clean up edit handles before saving HTML
        const clone = langDiv.cloneNode(true);
        clone.querySelectorAll(
          '.add-card-btn,.add-session-btn,.delete-card-btn,.delete-session-btn,' +
          '.add-meal-btn,.add-mt-btn,.add-checklist-btn,.delete-li-btn,.prog-slider,' +
          '.edit-action-btn,.add-phase-btn,.add-mealday-btn'
        ).forEach(el => el.remove());
        clone.querySelectorAll('[contenteditable]').forEach(el => el.removeAttribute('contenteditable'));
        clone.querySelectorAll('.editable-text').forEach(el => el.classList.remove('editable-text'));
        state[lang][tab] = clone.innerHTML;
      }
    });
  });

  state.statsBar = document.querySelector('.stats-bar').innerHTML;
  state.heroTag  = document.querySelector('.hero-tag').textContent;

  localStorage.setItem(getStorageKey(), JSON.stringify(state));
  showToast(currentLang === 'ar' ? '\u2705 \u062A\u0645 \u062D\u0641\u0638 \u062E\u0637\u062A\u0643!' :
            currentLang === 'de' ? '\u2705 Plan gespeichert!' : '\u2705 Plan saved!');
}

function loadSavedState() {
  const state = JSON.parse(localStorage.getItem(getStorageKey()) || '{}');
  if (!state || Object.keys(state).length === 0) return;

  ['ar','de','en'].forEach(lang => {
    if (!state[lang]) return;
    ['overview','weekly','exercises','nutrition','marathon','budget'].forEach(tab => {
      const sec = document.getElementById('sec-' + tab);
      if (!sec) return;
      const langDiv = sec.querySelector('[data-lang="' + lang + '"]');
      if (langDiv && state[lang][tab]) langDiv.innerHTML = state[lang][tab];
    });
  });

  if (state.statsBar) document.querySelector('.stats-bar').innerHTML = state.statsBar;
  if (state.heroTag)  document.querySelector('.hero-tag').textContent = state.heroTag;

  // Reattach accordion handlers
  document.querySelectorAll('.meal-head').forEach(h => {
    h.onclick = function() { toggleMeal(this); };
  });
}

function resetAllEdits() {
  const labels = {
    ar: '\u0647\u0644 \u062A\u0631\u064A\u062F \u062D\u0630\u0641 \u062C\u0645\u064A\u0639 \u062A\u0639\u062F\u064A\u0644\u0627\u062A\u0643 \u0648\u0627\u0644\u0631\u062C\u0648\u0639 \u0644\u0644\u062E\u0637\u0629 \u0627\u0644\u0623\u0635\u0644\u064A\u0629\u061F',
    de: 'Alle \u00C4nderungen zur\u00FCcksetzen und zum Original zur\u00FCckkehren?',
    en: 'Reset all edits and return to the original plan?'
  };
  if (!confirm(labels[currentLang])) return;
  localStorage.removeItem(getStorageKey());
  location.reload();
}

// ─── TOAST ───────────────────────────────────────────────────
function showToast(msg) {
  let t = document.getElementById('edit-toast');
  if (!t) {
    t = document.createElement('div');
    t.id = 'edit-toast';
    document.body.appendChild(t);
  }
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2500);
}

// ─── INIT ────────────────────────────────────────────────────
window.addEventListener('load', () => {
  const langBtn = [...document.querySelectorAll('.lang-btn')].find(b => b.getAttribute('onclick')?.includes(`setLang('${currentLang}'`));
  setLang(currentLang, langBtn);
  loadSavedState();

  // Inject floating edit toolbar
  const toolbar = document.createElement('div');
  toolbar.id = 'edit-toolbar';
  toolbar.innerHTML = `
    <button id="edit-toggle-btn" onclick="toggleEditMode()">&#9999;&#65039; Edit Plan</button>
    <button id="tab-manager-panel-toggle" style="display:none;align-items:center;gap:.3rem;" onclick="TabManager.toggle(getPlanContext())">
      <span style="font-size:.9rem;">⊞</span> Tabs
    </button>
    <button id="reset-btn" onclick="resetAllEdits()">&#8617; Reset</button>
  `;
  document.body.appendChild(toolbar);
  updateToolbarLabels();

  // Progress bar entrance animations
  setTimeout(() => {
    document.querySelectorAll('.progress-fill').forEach(bar => {
      const w = bar.style.width;
      bar.style.width = '0';
      setTimeout(() => bar.style.width = w, 100);
    });
  }, 300);
});


(function () {
  'use strict';
 
  const PLAN_CONFIG = {
    START_DATE: '2026-05-01',
    // ─── PHASE LOCK TOGGLE ──────────────────────────────────────
    // Set PHASE_LOCK_ENABLED to false to unlock ALL phases for viewing.
    // You can also call: PhaseSystem.setLockEnabled(false) from the browser console.
    PHASE_LOCK_ENABLED: true,
    PHASES: [
      { id: 1, durationMonths: 3, label: { ar: 'المرحلة الأولى', de: 'Phase 1', en: 'Phase 1' }, name: { ar: 'إعادة التأهيل', de: 'Rehabilitation', en: 'Rehabilitation' } },
      { id: 2, durationMonths: 3, label: { ar: 'المرحلة الثانية', de: 'Phase 2', en: 'Phase 2' }, name: { ar: 'البناء + الجري', de: 'Aufbau + Laufen', en: 'Build + Run' } },
      { id: 3, durationMonths: 4, label: { ar: 'المرحلة الثالثة', de: 'Phase 3', en: 'Phase 3' }, name: { ar: 'التحضير للماراثون', de: 'Marathon-Vorbereitung', en: 'Marathon Prep' } },
      { id: 4, durationMonths: 2, label: { ar: 'المرحلة الرابعة', de: 'Phase 4', en: 'Phase 4' }, name: { ar: 'التحديد والسباق', de: 'Tapering & Rennen', en: 'Taper & Race' } },
    ],
  };
 
  const STORAGE_KEY_CHECKINS = 'fitnessPlan_checkIns';
 
  function todayStr() { return new Date().toISOString().slice(0, 10); }
 
  function addMonths(dateStr, months) {
    const d = new Date(dateStr);
    d.setMonth(d.getMonth() + months);
    return d.toISOString().slice(0, 10);
  }
 
  function computeActivePhase() {
    const now = todayStr();
    let cursor = PLAN_CONFIG.START_DATE;
    for (let i = 0; i < PLAN_CONFIG.PHASES.length; i++) {
      const phaseEnd = addMonths(cursor, PLAN_CONFIG.PHASES[i].durationMonths);
      if (now < phaseEnd) return i + 1;
      cursor = phaseEnd;
    }
    return PLAN_CONFIG.PHASES.length;
  }
 
  function loadCheckIns() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY_CHECKINS) || '{}'); }
    catch { return {}; }
  }
 
  function saveCheckIns(data) { localStorage.setItem(STORAGE_KEY_CHECKINS, JSON.stringify(data)); }
  function hasCheckedInToday() { return !!loadCheckIns()[todayStr()]; }
 
  function doCheckIn(type) {
    const data = loadCheckIns();
    data[todayStr()] = { type, timestamp: Date.now() };
    saveCheckIns(data);
  }
 
  function computeStreak() {
    const data = loadCheckIns();
    let streak = 0;
    const d = new Date();
    d.setDate(d.getDate() - 1);
    while (true) {
      const key = d.toISOString().slice(0, 10);
      const entry = data[key];
      if (!entry || entry.type === 'missed') break;
      streak++;
      d.setDate(d.getDate() - 1);
    }
    if (data[todayStr()] && data[todayStr()].type !== 'missed') streak++;
    return streak;
  }
 
  function weekStats() {
    const data = loadCheckIns();
    const now = new Date();
    const monday = new Date(now);
    monday.setDate(now.getDate() - ((now.getDay() + 6) % 7));
    let count = 0;
    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      const key = d.toISOString().slice(0, 10);
      const e = data[key];
      if (e && e.type !== 'missed') count++;
    }
    return count;
  }
 
  const T = {
    checkInTitle:    { ar: '✅ سجّل يوم اليوم', de: '✅ Heutigen Tag eintragen', en: '✅ Log Today' },
    alreadyChecked:  { ar: '🎉 سجّلت اليوم بالفعل!', de: '🎉 Heute bereits eingecheckt!', en: '🎉 Already checked in today!' },
    streak:          { ar: 'يوم متتالي 🔥', de: 'Tage in Folge 🔥', en: 'day streak 🔥' },
    weekDays:        { ar: 'أيام هذا الأسبوع', de: 'Tage diese Woche', en: 'days this week' },
    liveSyncLabel:   { ar: '🕒 الوقت الحالي:', de: '🕒 Aktuelle Uhrzeit:', en: '🕒 Current time:' },
    dailyReminder:   { ar: '🔔 تذكير يومي: سجّل التحديث اليومي لتبقى الخطة دقيقة.', de: '🔔 Tägliche Erinnerung: Trage dein Update heute ein, damit der Plan aktuell bleibt.', en: '🔔 Daily reminder: log your update today to keep the schedule accurate.' },
    dailyCheckLabel: { ar: 'تدقيق يومي', de: 'Tagescheck', en: 'Daily Check' },
    phaseLockedMsg:  { ar: 'تُفتح بعد إنهاء المرحلة الحالية', de: 'Wird nach der aktuellen Phase freigeschaltet', en: 'Unlocks after current phase is complete' },
    phaseActiveLabel:{ ar: 'المرحلة النشطة', de: 'Aktive Phase', en: 'Active Phase' },
    locked:          { ar: '🔒 مقفل', de: '🔒 Gesperrt', en: '🔒 Locked' },
    sessionTypes: {
      gym:    { ar: '🏋️ صالة', de: '🏋️ Gym', en: '🏋️ Gym' },
      cali:   { ar: '🤸 كاليستانيكس', de: '🤸 Calisthenics', en: '🤸 Calisthenics' },
      run:    { ar: '🏃 جري', de: '🏃 Laufen', en: '🏃 Run' },
      rest:   { ar: '😴 راحة', de: '😴 Ruhe', en: '😴 Rest' },
      missed: { ar: '❌ تخطيت', de: '❌ Verpasst', en: '❌ Missed' },
    },
  };
 
  function t(key, lang) { return (T[key] && T[key][lang]) || T[key]?.en || key; }

  function formatLiveTime(date, lang) {
    const options = {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    };
    return new Intl.DateTimeFormat(lang === 'ar' ? 'ar-EG' : lang === 'de' ? 'de-DE' : 'en-GB', options).format(date);
  }

  function tSessionType(type, lang) {
    return T.sessionTypes[type]?.[lang] || T.sessionTypes[type]?.en || type;
  }

  function markTodayDayCard() {
    const todayIndex = (new Date().getDay() + 6) % 7; // Mon=0 … Sun=6
    const checkedToday = hasCheckedInToday();
    const lang = currentLang || 'ar';
    const todayEntry = loadCheckIns()[todayStr()];
    const label = t('dailyCheckLabel', lang);

    document.querySelectorAll('.week-grid').forEach(grid => {
      Array.from(grid.children).forEach((dayCol, index) => {
        const isToday = index === todayIndex;
        dayCol.classList.toggle('today-day', isToday);

        // Remove any existing chip first (clean re-render)
        const existingChip = dayCol.querySelector('.daily-check-chip');
        if (existingChip) existingChip.remove();

        if (!isToday) return; // Only decorate today's column

        const chip = document.createElement('div');
        chip.className = 'daily-check-chip' + (checkedToday ? ' done' : '');

        if (checkedToday && todayEntry) {
          // Show a filled checkbox + the activity type
          chip.innerHTML = `<span class="ci-checkbox ci-checkbox--checked">✓</span><span class="ci-chip-label">${tSessionType(todayEntry.type, lang)}</span>`;
        } else {
          // Show an empty checkbox
          chip.innerHTML = `<span class="ci-checkbox">○</span><span class="ci-chip-label">${label}</span>`;
        }

        // Clicking the chip on today's column is a shortcut to the check-in panel
        chip.style.cursor = 'pointer';
        chip.title = checkedToday ? label : label;
        chip.addEventListener('click', () => {
          const panel = document.getElementById('checkin-panel');
          if (panel) panel.scrollIntoView({ behavior: 'smooth', block: 'center' });
        });

        dayCol.querySelector('.day-head')?.appendChild(chip);
      });
    });
  }

  // ─── PHASE LOCK ────────────────────────────────────────────
  function applyPhaseLock() {
    const activePhase = PLAN_CONFIG.PHASE_LOCK_ENABLED
      ? computeActivePhase()
      : PLAN_CONFIG.PHASES.length; // if disabled → treat all phases as active
    const sec = document.getElementById('sec-weekly');
    if (!sec) return;
 
    sec.querySelectorAll('[data-lang]').forEach(langDiv => {
      const sectionLang = langDiv.dataset.lang || currentLang || 'ar';
      const children = Array.from(langDiv.children);
      const phaseBlocks = [];
      let block = null;
      children.forEach(el => {
        if (el.classList.contains('sec-title')) {
          block = { elements: [el], phaseNum: phaseBlocks.length + 1 };
          phaseBlocks.push(block);
        } else if (block) {
          block.elements.push(el);
        }
      });
 
      phaseBlocks.forEach(pb => {
        // When lock is disabled, nothing is ever locked
        const isLocked = PLAN_CONFIG.PHASE_LOCK_ENABLED && pb.phaseNum > activePhase;
        pb.elements.forEach(el => {
          el.classList.toggle('phase-locked-el', isLocked);
        });
        const grid = pb.elements.find(e => e.classList && e.classList.contains('week-grid'));
        if (grid) {
          grid.style.position = 'relative';
          let overlay = grid.querySelector('.lock-overlay');
          if (isLocked) {
            if (!overlay) {
              overlay = document.createElement('div');
              overlay.className = 'lock-overlay';
              grid.appendChild(overlay);
            }
            overlay.innerHTML = `<div class="lock-content"><div class="lock-icon">🔒</div><div class="lock-text">${t('phaseLockedMsg', sectionLang)}</div><div class="lock-phase">Phase ${pb.phaseNum}</div></div>`;
          } else if (overlay) {
            overlay.remove();
          }
        }
      });
    });
 
    updatePhaseIndicator(activePhase, currentLang || 'ar');
  }
 
  function updatePhaseIndicator(activePhase, lang) {
    let el = document.getElementById('active-phase-stat');
    if (!el) {
      el = document.createElement('div');
      el.id = 'active-phase-stat';
      el.className = 'stat';
      const bar = document.querySelector('.stats-bar');
      if (bar) bar.appendChild(el);
    }
    el.innerHTML = `<div class="stat-val run">${activePhase}/${PLAN_CONFIG.PHASES.length}</div><div class="stat-lbl">${t('phaseActiveLabel', lang)}</div>`;
  }
 
  // ─── CHECK-IN PANEL ────────────────────────────────────────
  function renderCheckInPanel() {
    const lang = currentLang || 'ar';
    const checked = hasCheckedInToday();
    const streak = computeStreak();
    const days = weekStats();
    const todayEntry = loadCheckIns()[todayStr()];
    const types = ['gym', 'cali', 'run', 'rest', 'missed'];
 
    let panel = document.getElementById('checkin-panel');
    if (!panel) {
      panel = document.createElement('div');
      panel.id = 'checkin-panel';
      const statsBar = document.querySelector('.stats-bar');
      if (statsBar && statsBar.parentNode) statsBar.parentNode.insertBefore(panel, statsBar.nextSibling);
    }

    // Labels for the "change" button
    const changeLabels = { ar: '✏️ تغيير', de: '✏️ Ändern', en: '✏️ Change' };
    const changeLabel = changeLabels[lang] || changeLabels.en;

    panel.innerHTML = `
      <div class="checkin-inner">
        <div class="checkin-meta">
          <span><strong>${streak}</strong> ${t('streak', lang)}</span>
          <span><strong>${days}/7</strong> ${t('weekDays', lang)}</span>
        </div>
        <div class="checkin-sync">${t('liveSyncLabel', lang)} ${formatLiveTime(new Date(), lang)}</div>
        ${checked
          ? `<div class="checkin-done">
               ${t('alreadyChecked', lang)}
               <span class="ci-badge ci-${todayEntry?.type}">${tSessionType(todayEntry?.type, lang)}</span>
               <button class="ci-change-btn" id="ci-change-today">${changeLabel}</button>
             </div>`
          : `<div class="checkin-title">${t('checkInTitle', lang)}</div>
             <div class="checkin-buttons">${types.map(tp => `<button class="ci-btn ci-${tp}" data-type="${tp}">${tSessionType(tp, lang)}</button>`).join('')}</div>`
        }
      </div>`;
 
    // Attach check-in button handlers
    panel.querySelectorAll('.ci-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        doCheckIn(btn.dataset.type);
        renderCheckInPanel();
        markTodayDayCard();
        applyPhaseLock();
        const msgs = { ar: '✅ تم تسجيل يومك!', de: '✅ Tag eingetragen!', en: '✅ Day logged!' };
        showToast(msgs[lang] || msgs.en);
      });
    });

    // Attach "Change" button handler — resets today's entry so buttons re-appear
    const changeBtn = panel.querySelector('#ci-change-today');
    if (changeBtn) {
      changeBtn.addEventListener('click', () => {
        const data = loadCheckIns();
        delete data[todayStr()];
        saveCheckIns(data);
        renderCheckInPanel();
        markTodayDayCard();
      });
    }

    markTodayDayCard();
  }
 
  function maybePromptDailyCheckIn() {
    const lang = currentLang || 'ar';
    if (hasCheckedInToday()) return;
    const key = 'fitnessPlan_dailyPrompt_' + todayStr();
    if (localStorage.getItem(key) === 'shown') return;
    localStorage.setItem(key, 'shown');
    showToast(t('dailyReminder', lang));
  }

  // ─── HOOKS ─────────────────────────────────────────────────
  const _origSetLang = window.setLang;
  window.setLang = function(lang, btn) {
    if (_origSetLang) _origSetLang(lang, btn);
    setTimeout(() => { renderCheckInPanel(); markTodayDayCard(); applyPhaseLock(); }, 50);
  };
 
  const _origSetTab = window.setTab;
  window.setTab = function(tab) {
    if (_origSetTab) _origSetTab(tab);
    if (tab === 'weekly') setTimeout(applyPhaseLock, 50);
  };
 
  window.addEventListener('load', () => {
    setTimeout(() => {
      renderCheckInPanel();
      markTodayDayCard();
      applyPhaseLock();
      maybePromptDailyCheckIn();
    }, 250);
  });
 
  window.PhaseSystem = {
    getActivePhase: computeActivePhase,
    getStreak: computeStreak,
    getWeekStats: weekStats,
    getCheckIns: loadCheckIns,
    forceRefresh: () => { renderCheckInPanel(); applyPhaseLock(); },
    devSetDate: (dateStr) => { PLAN_CONFIG.START_DATE = dateStr; renderCheckInPanel(); applyPhaseLock(); },
    // ─── PHASE LOCK CONTROL ────────────────────────────────────
    // Call PhaseSystem.setLockEnabled(false) in the browser console to unlock all phases.
    // Call PhaseSystem.setLockEnabled(true) to re-enable the lock.
    setLockEnabled: (bool) => {
      PLAN_CONFIG.PHASE_LOCK_ENABLED = !!bool;
      applyPhaseLock();
      console.log(`Phase lock ${bool ? 'ENABLED 🔒' : 'DISABLED 🔓'}`);
    },
  };
 
})();

function injectBiometricBanner(name, age, height, weight, bmi) {
    const bodyContainer = document.querySelector('.container') || document.body;
    
    const banner = document.createElement('div');
    banner.style.cssText = "background: #1e293b; border: 1px solid #334155; padding: 15px; border-radius: 8px; margin-bottom: 20px; display: flex; gap: 20px; font-size: 0.95rem; color: #f8fafc;";
    banner.innerHTML = `
        <div><strong>Active Plan:</strong> ${name}</div>
        <div><strong>Age:</strong> ${age} yrs</div>
        <div><strong>Height:</strong> ${height} cm</div>
        <div><strong>Weight:</strong> ${weight} kg</div>
        <div><strong>Calculated BMI:</strong> <span style="color: #3b82f6; font-weight: bold;">${bmi}</span></div>
        <a href="index.html" style="margin-left: auto; color: #94a3b8; text-decoration: none;">&larr; Back to Menu</a>
    `; // Changed href target from menu.html to index.html
    
    bodyContainer.insertBefore(banner, bodyContainer.firstChild);
}

// Parse all current data out of the URL string on load
function getPlanContext() {
    const urlParams = new URLSearchParams(window.location.search);
    const planId = urlParams.get('planId') || 'default';
    let savedPlan = null;
    if (planId !== 'default') {
      try {
        const plans = JSON.parse(localStorage.getItem('fitnessPlannerPlans') || '[]');
        savedPlan = plans.find(p => p.id === planId) || null;
      } catch (_) {}
    }
    return {
        planId,
        name: savedPlan?.name || urlParams.get('name') || 'My Plan',
        age: savedPlan?.age ?? urlParams.get('age') ?? '--',
        height: savedPlan?.height ?? urlParams.get('height') ?? '--',
        weight: savedPlan?.weight ?? urlParams.get('weight') ?? '--',
        bmi: savedPlan?.bmi ?? urlParams.get('bmi') ?? '--',
        customStats: Array.isArray(savedPlan?.customStats) ? savedPlan.customStats : [],
        // Exercises are compressed and encoded inside a single string parameter 'data'
        rawExercises: urlParams.get('data') || ''
    };
}

// Decodes the compressed URL data parameter into an array of exercise objects
function loadExercisesFromUrl() {
    const context = getPlanContext();
    if (!context.rawExercises) return [];
    
    try {
        // Base64 decode + JSON parse to unpack the exercise array safely
        return JSON.parse(atob(context.rawExercises));
    } catch (e) {
        console.error("Error parsing exercise context from URL structure:", e);
        return [];
    }
}

// Encodes the exercise array and updates the browser address bar state
function updateUrlWithExercises(exercisesArray) {
    const context = getPlanContext();
    const encodedData = btoa(JSON.stringify(exercisesArray));
    
    // Reconstruct the URL string maintaining all biometrics + the new database payload
    const newUrl = `workspace.html?planId=${context.planId}&name=${encodeURIComponent(context.name)}&age=${context.age}&height=${context.height}&weight=${context.weight}&bmi=${context.bmi}&data=${encodedData}`;
    
    // Update the browser history state without forcing a hard page refresh
    window.history.replaceState({ path: newUrl }, '', newUrl);
}

// Unified Submit Event Handler to run when adding a new exercise
function onAddExerciseFormSubmit(event) {
    event.preventDefault();
    
    // Extract current input data values from your HTML inputs
    const newExercise = {
        id: 'ex_' + Date.now(),
        name: document.getElementById('exerciseNameInput').value,
        sets: document.getElementById('setsInput').value,
        reps: document.getElementById('repsInput').value
    };
    
    // 1. Fetch current array stack out of the URL parameters
    const currentExercises = loadExercisesFromUrl();
    
    // 2. Append the newly created exercise object
    currentExercises.push(newExercise);
    
    // 3. Serialize and save back to the browser URL string state
    updateUrlWithExercises(currentExercises);
    
    // 4. Render directly to the empty canvas UI interface
    renderExerciseToUI(newExercise); 
    
    // Clear out input fields for subsequent additions
    document.getElementById('exerciseNameInput').value = '';
}




// ============================================================
// INDIVIDUAL PLAN BUILDER — per-plan storage + blank skeleton
// ============================================================
(function () {
  'use strict';

  // ─── Eigener Storage-Key pro Plan (Default-Plan bleibt auf dem alten Key) ───
  window.getStorageKey = function () {
    const ctx = getPlanContext();
    return ctx.planId === 'default' ? 'fitnessState' : 'fitnessState_' + ctx.planId;
  };

  function hasSavedPlan() {
    return !!localStorage.getItem(getStorageKey());
  }

  // ─── Demo-Inhalt entfernen, nur Gerüst behalten ─────────────────────────────
  function stripToSkeleton() {
    // Overview: Phasen-Karten + Tipps leeren, .timeline bleibt für "+ Add Phase"
    document.querySelectorAll('#sec-overview [data-lang]').forEach(langDiv => {
      langDiv.querySelectorAll('.timeline .phase').forEach(el => el.remove());
      langDiv.querySelectorAll('.tip').forEach(el => el.remove());
    });

    // Weekly: nur den ersten Phasenblock (sec-title + week-grid) behalten, Sessions leeren
    document.querySelectorAll('#sec-weekly [data-lang]').forEach(langDiv => {
      const blocks = [];
      let current = null;
      Array.from(langDiv.children).forEach(el => {
        if (el.classList.contains('sec-title')) { current = [el]; blocks.push(current); }
        else if (current) current.push(el);
      });
      blocks.forEach((block, i) => {
        if (i === 0) {
          const grid = block.find(e => e.classList.contains('week-grid'));
          if (grid) grid.querySelectorAll('.session').forEach(s => s.remove());
        } else {
          block.forEach(el => el.remove());
        }
      });
    });

    // Exercises: alles weg, ein leerer Starter-Muskelgruppenblock kommt rein
    document.querySelectorAll('#sec-exercises [data-lang]').forEach(langDiv => {
      langDiv.querySelectorAll('.tip, .checklist, .sec-title, .sec-sub, .muscle-group-header, .ex-grid')
        .forEach(el => el.remove());
      const header = document.createElement('div');
      header.className = 'muscle-group-header gym-header';
      header.textContent = currentLang === 'ar' ? '💪 مجموعة عضلية جديدة' : currentLang === 'de' ? '💪 Neue Muskelgruppe' : '💪 New Muscle Group';
      const grid = document.createElement('div');
      grid.className = 'ex-grid';
      langDiv.appendChild(header);
      langDiv.appendChild(grid);
    });

    // Nutrition: Meal-Days + Tipps + sec-sub weg (sec-title bleibt, aber generisch)
    document.querySelectorAll('#sec-nutrition [data-lang]').forEach(langDiv => {
      langDiv.querySelectorAll('.meal-day, .tip, .sec-sub').forEach(el => el.remove());
      // Update generic title
      const title = langDiv.querySelector('.sec-title');
      const lang = langDiv.dataset.lang;
      if (title) title.textContent = lang === 'ar' ? 'خطة التغذية' : lang === 'de' ? 'Ernährungsplan' : 'Nutrition Plan';
    });

    // Marathon: Phasen + Tipps weg, Checklist geleert (Container bleibt)
    document.querySelectorAll('#sec-marathon [data-lang]').forEach(langDiv => {
      langDiv.querySelectorAll('.mt-item, .tip').forEach(el => el.remove());
      langDiv.querySelectorAll('.checklist').forEach(list => { list.innerHTML = ''; });
    });

    // Budget: Items + Tipps + sec-sub + Gym-Checklists weg, Vorschlags-Buttons bleiben
    document.querySelectorAll('#sec-budget [data-lang]').forEach(langDiv => {
      langDiv.querySelectorAll('.budget-item, .tip, .sec-sub, .checklist').forEach(el => el.remove());
      // Remove all sec-titles except the first one (keep the main Budget title)
      const titles = langDiv.querySelectorAll('.sec-title');
      titles.forEach((t, i) => { if (i > 0) t.remove(); });
    });
  }

  // ─── Fehlende "+"-Funktionen für den leeren Start ───────────────────────────
  function addTipItem(container) {
    const tip = document.createElement('div');
    tip.className = 'tip';
    tip.style.position = 'relative';
    tip.innerHTML = `
      <div class="tip-icon">💡</div>
      <div class="tip-text editable-text" contenteditable="true" spellcheck="false"><strong>Title:</strong> Your tip text...</div>
    `;
    addDeleteBtn(tip);
    container.insertBefore(tip, container.querySelector('.add-tip-btn'));
  }

  function addMuscleGroupSection(langDiv) {
    const header = document.createElement('div');
    header.className = 'muscle-group-header gym-header editable-text';
    header.setAttribute('contenteditable', 'true');
    header.setAttribute('spellcheck', 'false');
    header.textContent = currentLang === 'ar' ? '💪 مجموعة عضلية جديدة' : currentLang === 'de' ? '💪 Neue Muskelgruppe' : '💪 New Muscle Group';

    const grid = document.createElement('div');
    grid.className = 'ex-grid';
    const cardBtn = document.createElement('button');
    cardBtn.className = 'add-card-btn';
    cardBtn.textContent = currentLang === 'ar' ? '+ إضافة تمرين' : currentLang === 'de' ? '+ Übung hinzufügen' : '+ Add Exercise';
    cardBtn.onclick = () => addExCard(grid);
    grid.appendChild(cardBtn);

    const addBtn = langDiv.querySelector('.add-musclegroup-btn');
    langDiv.insertBefore(header, addBtn);
    langDiv.insertBefore(grid, addBtn);
  }

  function addBlankPlanButtons() {
    document.querySelectorAll('#sec-overview [data-lang], #sec-marathon [data-lang]').forEach(langDiv => {
      if (langDiv.querySelector('.add-tip-btn')) return;
      const btn = document.createElement('button');
      btn.className = 'add-tip-btn edit-action-btn';
      btn.textContent = currentLang === 'ar' ? '+ إضافة نصيحة' : currentLang === 'de' ? '+ Tipp hinzufügen' : '+ Add Tip';
      btn.onclick = () => addTipItem(langDiv);
      langDiv.appendChild(btn);
    });

    document.querySelectorAll('#sec-exercises [data-lang]').forEach(langDiv => {
      if (langDiv.querySelector('.add-musclegroup-btn')) return;
      const btn = document.createElement('button');
      btn.className = 'add-musclegroup-btn edit-action-btn';
      btn.textContent = currentLang === 'ar' ? '+ مجموعة عضلية' : currentLang === 'de' ? '+ Muskelgruppe' : '+ Add Muscle Group';
      btn.onclick = () => addMuscleGroupSection(langDiv);
      langDiv.appendChild(btn);
    });
  }

  // Hook in den bestehenden Edit-Toggle (gleiches Muster wie PhaseSystem oben)
  const _origToggle = window.toggleEditMode;
  window.toggleEditMode = function () {
    _origToggle();
    if (editMode) addBlankPlanButtons();
  };

  // ─── Biometrie-Anzeige (Name, Gewicht, BMI, Größe) ──────────────────────────
  function applyPlanBiometrics(ctx) {
    const nameLabel = document.getElementById('currentActivePlanName');
    if (nameLabel) nameLabel.textContent = ctx.name;
    if (ctx.planId === 'default') return; // default plan keeps all hardcoded values

    const heroSub = document.getElementById('hero-sub');
    if (heroSub) heroSub.textContent = ({ar: ctx.name + ' — خطة مخصصة', de: ctx.name + ' — Benutzerdefinierter Plan', en: ctx.name + ' — Custom Plan'})[currentLang] || (ctx.name + ' — Custom Plan');

    // For custom plans: only show weight, bmi, height — hide marathon-specific stats
    const statWeight = document.querySelector('[data-stat="weight"]');
    const statBmi    = document.querySelector('[data-stat="bmi"]');
    const statHeight = document.querySelector('[data-stat="height"]');

    if (statWeight) statWeight.querySelector('.stat-val').textContent = ctx.weight !== '--' ? ctx.weight : '--';
    if (statBmi)    statBmi.querySelector('.stat-val').textContent    = ctx.bmi    !== '--' ? ctx.bmi    : '--';
    if (statHeight) statHeight.querySelector('.stat-val').textContent = ctx.height !== '--' ? ctx.height : '--';

    // Hide marathon-specific stats that don't apply to a generic custom plan
    ['months', 'target', 'marathon'].forEach(key => {
      const el = document.querySelector(`[data-stat="${key}"]`);
      if (el) el.style.display = 'none';
    });

    // Restore custom statistic fields created in the plan builder.
    document.querySelectorAll('.custom-plan-stat').forEach(el => el.remove());
    const statsBar = document.querySelector('.stats-bar');
    (ctx.customStats || []).forEach((stat, index) => {
      if (!statsBar || !stat?.label) return;
      const box = document.createElement('div');
      box.className = 'stat custom-plan-stat';
      box.dataset.customStatIndex = index;
      const value = document.createElement('div');
      value.className = 'stat-val cal';
      value.textContent = String(stat.value ?? '--');
      const label = document.createElement('div');
      label.className = 'stat-lbl';
      label.textContent = String(stat.label);
      box.appendChild(value);
      box.appendChild(label);
      statsBar.appendChild(box);
    });

    // Hide Marathon tab for custom plans (marathon is a default-plan feature)
    const marathonTab = document.getElementById('tab-marathon');
    const marathonSec = document.getElementById('sec-marathon');
    if (marathonTab) marathonTab.style.display = 'none';
    if (marathonSec) marathonSec.style.display = 'none';
  }

  // ─── Init ────────────────────────────────────────────────────────────────
  document.addEventListener('DOMContentLoaded', () => {
    const ctx = getPlanContext();
    applyPlanBiometrics(ctx);
    if (ctx.planId !== 'default' && !hasSavedPlan()) {
      stripToSkeleton();
    }
    // Initialize tab management system
    TabManager.init(ctx);
  });
})();

// ============================================================
// TAB MANAGEMENT SYSTEM — add, rename, remove tabs dynamically
// ============================================================
const TabManager = (function() {
  'use strict';

  const STORAGE_KEY_TABS = () => {
    const ctx = getPlanContext();
    return ctx.planId === 'default' ? 'fitnessTabs_default' : 'fitnessTabs_' + ctx.planId;
  };

  // Built-in tab definitions (never deletable for default plan)
  const BUILTIN_TABS = ['overview', 'weekly', 'exercises', 'nutrition', 'marathon', 'budget'];

  // Labels for built-in tabs (trilingual)
  const BUILTIN_LABELS = {
    overview:   { ar: 'نظرة عامة',       de: 'Überblick',        en: 'Overview' },
    weekly:     { ar: 'الجدول الأسبوعي', de: 'Wochenplan',       en: 'Weekly Schedule' },
    exercises:  { ar: 'التمارين',         de: 'Übungen',          en: 'Exercises' },
    nutrition:  { ar: 'التغذية',          de: 'Ernährung',        en: 'Nutrition' },
    marathon:   { ar: 'الماراثون',        de: 'Marathon',         en: 'Marathon' },
    budget:     { ar: 'الميزانية',        de: 'Budget',           en: 'Budget' },
  };

  let customTabs = []; // array of { id, labels: {ar,de,en}, visible: true }
  let hiddenBuiltins = []; // array of built-in tab ids that are hidden

  function loadTabState() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY_TABS()) || '{}');
      hiddenBuiltins = saved.hiddenBuiltins || [];
      customTabs = saved.customTabs || [];
    } catch(e) {
      hiddenBuiltins = [];
      customTabs = [];
    }
  }

  function saveTabState() {
    localStorage.setItem(STORAGE_KEY_TABS(), JSON.stringify({ hiddenBuiltins, customTabs }));
  }

  function applyTabVisibility(ctx) {
    BUILTIN_TABS.forEach(id => {
      const tab = document.getElementById('tab-' + id);
      const sec = document.getElementById('sec-' + id);
      if (!tab) return;
      // Marathon is already hidden for custom plans in applyPlanBiometrics
      if (id === 'marathon' && ctx.planId !== 'default') return;
      const shouldHide = hiddenBuiltins.includes(id);
      tab.style.display = shouldHide ? 'none' : '';
    });
  }

  function buildTabManagementUI(ctx) {
    // Only show tab manager inside edit mode — injected into toolbar area
    let panel = document.getElementById('tab-manager-panel');
    if (panel) return; // already built

    panel = document.createElement('div');
    panel.id = 'tab-manager-panel';
    panel.style.cssText = `
      position: fixed; bottom: 5.5rem; left: 2rem;
      background: var(--surface2, #1a1a24);
      border: 1px solid var(--border, #2a2a3a);
      border-radius: 6px; padding: 1rem; z-index: 9999;
      min-width: 260px; display: none;
      box-shadow: 0 8px 32px rgba(0,0,0,0.5);
    `;

    const title = document.createElement('div');
    title.style.cssText = 'font-family:"IBM Plex Mono",monospace;font-size:.65rem;letter-spacing:3px;color:var(--muted,#888);text-transform:uppercase;margin-bottom:.75rem;';
    title.textContent = currentLang === 'ar' ? 'إدارة التبويبات' : currentLang === 'de' ? 'TABS VERWALTEN' : 'MANAGE TABS';
    panel.appendChild(title);

    // Checklist of built-in tabs to toggle visibility
    BUILTIN_TABS.forEach(id => {
      if (id === 'marathon' && ctx.planId !== 'default') return; // custom plan: marathon already hidden
      const row = document.createElement('div');
      row.style.cssText = 'display:flex;align-items:center;gap:.5rem;padding:.3rem 0;border-bottom:1px solid rgba(255,255,255,.04);';

      const chk = document.createElement('input');
      chk.type = 'checkbox';
      chk.checked = !hiddenBuiltins.includes(id);
      chk.style.cssText = 'accent-color:var(--cal,#e8ff3c);cursor:pointer;width:14px;height:14px;';
      chk.onchange = () => {
        if (!chk.checked) {
          if (!hiddenBuiltins.includes(id)) hiddenBuiltins.push(id);
          // If hiding current tab, switch to first visible
          if (currentTab === id) {
            const firstVisible = BUILTIN_TABS.find(t => !hiddenBuiltins.includes(t) && document.getElementById('tab-' + t));
            if (firstVisible) setTab(firstVisible);
          }
        } else {
          hiddenBuiltins = hiddenBuiltins.filter(t => t !== id);
        }
        saveTabState();
        applyTabVisibility(ctx);
      };

      const lbl = document.createElement('label');
      const labels = BUILTIN_LABELS[id];
      lbl.textContent = labels ? labels[currentLang] || labels.en : id;
      lbl.style.cssText = 'font-size:.8rem;color:var(--text,#f0f0f0);cursor:pointer;flex:1;';
      lbl.onclick = () => { chk.checked = !chk.checked; chk.onchange(); };

      row.appendChild(chk);
      row.appendChild(lbl);
      panel.appendChild(row);
    });

    // Add custom tab section
    const addSection = document.createElement('div');
    addSection.style.cssText = 'margin-top:.75rem;';

    const addInput = document.createElement('input');
    addInput.type = 'text';
    addInput.placeholder = currentLang === 'ar' ? 'اسم التبويب الجديد...' : currentLang === 'de' ? 'Neuer Tab-Name...' : 'New tab name...';
    addInput.style.cssText = `
      width:100%;padding:.45rem .6rem;
      background:var(--bg,#0a0a0f);border:1px solid var(--border,#2a2a3a);
      color:#fff;border-radius:4px;font-family:'Cairo',sans-serif;font-size:.82rem;
      margin-bottom:.4rem;box-sizing:border-box;
    `;

    const addBtn = document.createElement('button');
    addBtn.textContent = currentLang === 'ar' ? '+ إضافة تبويب' : currentLang === 'de' ? '+ Tab hinzufügen' : '+ Add Tab';
    addBtn.style.cssText = `
      width:100%;padding:.45rem;background:rgba(60,255,180,.1);
      border:1px dashed rgba(60,255,180,.3);color:var(--gym,#3cffb4);
      border-radius:4px;cursor:pointer;font-size:.78rem;
      font-family:'IBM Plex Mono',monospace;letter-spacing:1px;
    `;
    addBtn.onclick = () => {
      const name = addInput.value.trim();
      if (!name) return;
      addCustomTab(name, ctx);
      addInput.value = '';
      // Rebuild panel to show new tab in list
      panel.remove();
      document.getElementById('tab-manager-panel-toggle')?.click();
      document.getElementById('tab-manager-panel-toggle')?.click();
    };

    addSection.appendChild(addInput);
    addSection.appendChild(addBtn);
    panel.appendChild(addSection);

    // Custom tabs list (with remove buttons)
    customTabs.forEach(ct => {
      const row = document.createElement('div');
      row.style.cssText = 'display:flex;align-items:center;gap:.4rem;padding:.25rem 0;margin-top:.2rem;';
      const lbl = document.createElement('span');
      lbl.textContent = '✦ ' + (ct.labels[currentLang] || ct.labels.en);
      lbl.style.cssText = 'font-size:.78rem;color:var(--cal,#e8ff3c);flex:1;';
      const del = document.createElement('button');
      del.textContent = '×';
      del.style.cssText = 'background:rgba(255,107,60,.12);border:1px solid rgba(255,107,60,.2);color:var(--run,#ff6b3c);border-radius:50%;width:18px;height:18px;cursor:pointer;font-size:.7rem;line-height:1;padding:0;display:flex;align-items:center;justify-content:center;';
      del.onclick = () => {
        removeCustomTab(ct.id);
        row.remove();
      };
      row.appendChild(lbl);
      row.appendChild(del);
      panel.appendChild(row);
    });

    document.body.appendChild(panel);
  }

  function addCustomTab(name, ctx) {
    const id = 'custom_' + Date.now();
    const ct = { id, labels: { ar: name, de: name, en: name } };
    customTabs.push(ct);
    saveTabState();

    // Create tab button
    const tabsEl = document.querySelector('.tabs');
    if (tabsEl) {
      const btn = document.createElement('button');
      btn.className = 'tab';
      btn.id = 'tab-' + id;
      btn.onclick = () => setTab(id);
      btn.innerHTML = `<span data-lang-inline="ar" class="${currentLang==='ar'?'show':''}">${name}</span>
        <span data-lang-inline="de" class="${currentLang==='de'?'show':''}">${name}</span>
        <span data-lang-inline="en" class="${currentLang==='en'?'show':''}">${name}</span>`;
      tabsEl.appendChild(btn);
    }

    // Create section container
    const mainContent = document.querySelector('.section.active')?.parentElement;
    if (mainContent) {
      const sec = document.createElement('div');
      sec.className = 'section';
      sec.id = 'sec-' + id;
      sec.innerHTML = `
        <div class="content">
          <div class="show" data-lang="ar"><div class="sec-title">${name}</div></div>
          <div data-lang="de"><div class="sec-title">${name}</div></div>
          <div data-lang="en"><div class="sec-title">${name}</div></div>
        </div>`;
      mainContent.appendChild(sec);
    }

    // If in edit mode, add the blank buttons to the new section
    if (editMode) {
      document.querySelectorAll(`#sec-${id} [data-lang]`).forEach(langDiv => {
        if (!langDiv.querySelector('.add-mealday-btn')) {
          const btn = document.createElement('button');
          btn.className = 'add-mealday-btn edit-action-btn';
          btn.textContent = '+ Add Day Plan';
          btn.onclick = () => addMealDay(langDiv);
          langDiv.appendChild(btn);
        }
        if (!langDiv.querySelector('.add-tip-btn')) {
          const b2 = document.createElement('button');
          b2.className = 'add-tip-btn edit-action-btn';
          b2.textContent = '+ Add Tip';
          b2.onclick = () => addTipItem(langDiv);
          langDiv.appendChild(b2);
        }
      });
    }
  }

  function removeCustomTab(id) {
    customTabs = customTabs.filter(ct => ct.id !== id);
    saveTabState();
    document.getElementById('tab-' + id)?.remove();
    document.getElementById('sec-' + id)?.remove();
    if (currentTab === id) setTab('overview');
  }

  function addTipItem(container) {
    const tip = document.createElement('div');
    tip.className = 'tip';
    tip.style.position = 'relative';
    tip.innerHTML = `<div class="tip-icon">💡</div><div class="tip-text editable-text" contenteditable="true" spellcheck="false"><strong>Title:</strong> Your tip text...</div>`;
    if (typeof addDeleteBtn === 'function') addDeleteBtn(tip);
    const anchor = container.querySelector('.add-tip-btn');
    if (anchor) container.insertBefore(tip, anchor); else container.appendChild(tip);
  }

  function init(ctx) {
    loadTabState();
    applyTabVisibility(ctx);

    // Restore custom tabs from storage
    customTabs.forEach(ct => addCustomTab(ct.labels.en || ct.labels.ar || 'Tab', ctx));

    // Hook edit mode toggle to show/hide tab manager toggle button
    const _origToggle = window.toggleEditMode;
    window.toggleEditMode = function() {
      _origToggle();
      const toggleBtn = document.getElementById('tab-manager-panel-toggle');
      if (toggleBtn) toggleBtn.style.display = editMode ? 'flex' : 'none';
      const panel = document.getElementById('tab-manager-panel');
      if (panel && !editMode) panel.style.display = 'none';
      if (editMode) buildTabManagementUI(ctx);
    };
  }

  // Called from edit toolbar via a "Tabs" button injected at load
  function toggle(ctx) {
    buildTabManagementUI(ctx);
    const panel = document.getElementById('tab-manager-panel');
    if (panel) panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
  }

  return { init, toggle, loadTabState };
})();
/* ============================================================
   FITNESS 2.0 FEATURE ENGINE
   - Training tracker
   - Exercise library + media
   - Rest timer
   - Web Bluetooth heart-rate integration
   - Ollama Qwen3 Coach
   ============================================================ */
(function () {
  'use strict';

  const planScope = () => String((typeof getPlanContext === 'function' ? getPlanContext().planId : 'default') || 'default').replace(/[^a-zA-Z0-9_-]/g, '_');
  const STORAGE = {
    logs: () => 'fitness_training_logs_v3_' + planScope(),
    library: () => 'fitness_exercise_library_v3_' + planScope(),
    media: () => 'fitness_exercise_media_v3_' + planScope(),
    chat: () => 'fitness_ollama_chat_v3_' + planScope(),
    ollamaUrl: () => 'fitness_ollama_url_v3_' + planScope(),
    ollamaModel: () => 'fitness_ollama_model_v3_' + planScope()
  };
  const I18N = {
    ar:{tracker:'متتبع التمرين',timer:'المؤقت',library:'مكتبة التمارين',media:'صور/فيديو التمارين',watch:'ساعة/سوار ذكي',coach:'مدرب GLM-5.2',reset:'إعادة ضبط اللوحة الشخصية',title:'🏋️ التدريب 2.0',desc:'سجّل المجموعات والتكرارات والوزن وRIR لكل تمرين، أضف الصور والفيديو، واستخدم المؤقت. بيانات كل خطة منفصلة.',search:'ابحث عن تمرين أو مجموعة عضلية',all:'الكل',addExercise:'+ إضافة تمرين',track:'تتبع',mediaBtn:'وسائط',noMedia:'🎯 لا توجد وسائط',save:'💾 حفظ',remove:'حذف',addSet:'＋ مجموعة',completed:'مجموعات مكتملة',volume:'الحجم',reps:'التكرارات',weight:'الوزن كغ',rir:'RIR',done:'تم',set:'المجموعة',custom:'مخصص',send:'إرسال',coachPlaceholder:'اسأل مدرب اللياقة …',url:'رابط Ollama',model:'النموذج',resetConfirm:'حذف بيانات التدريب والوسائط والتمارين المخصصة لهذه الخطة فقط؟',resetDone:'تمت إعادة ضبط بيانات هذه الخطة فقط.',watchReady:'جاهز للاتصال بجهاز قياس نبض عبر Bluetooth.',watchUnsupported:'Web Bluetooth غير مدعوم في هذا المتصفح.',connect:'🔗 اتصال الجهاز',hr:'❤️ معدل نبض القلب'},
    de:{tracker:'Training-Tracker',timer:'Timer',library:'Übungsbibliothek',media:'Übungsbilder / Videos',watch:'Smartwatch / Fitnessarmband',coach:'Qwen3 Coach',reset:'Persönliches Panel zurücksetzen',title:'🏋️ Training 2.0',desc:'Sätze, Wiederholungen, Gewicht und RIR erfassen, Bilder/Videos hinterlegen und den Timer nutzen. Daten werden pro Plan getrennt gespeichert.',search:'Übung oder Muskelgruppe suchen',all:'Alle',addExercise:'+ Eigene Übung',track:'Tracken',mediaBtn:'Medien',noMedia:'🎯 Keine Medien',save:'💾 Speichern',remove:'Entfernen',addSet:'＋ Satz',completed:'Sätze abgeschlossen',volume:'Volumen',reps:'Wdh.',weight:'Gewicht kg',rir:'RIR',done:'Fertig',set:'Satz',custom:'Benutzerdefiniert',send:'Senden',coachPlaceholder:'Frag deinen Fitness-Coach …',url:'Ollama-URL',model:'Modell',resetConfirm:'Trainingsdaten, Medien und eigene Übungen nur für diesen Plan löschen?',resetDone:'Daten dieses Plans wurden zurückgesetzt.',watchReady:'Bereit für ein Bluetooth-Herzfrequenzgerät.',watchUnsupported:'Web Bluetooth wird in diesem Browser nicht unterstützt.',connect:'🔗 Gerät verbinden',hr:'❤️ Herzfrequenz'},
    en:{tracker:'Training Tracker',timer:'Timer',library:'Exercise Library',media:'Exercise Media',watch:'Smartwatch / Band',coach:'Qwen3 Coach',reset:'Reset Personal Panel',title:'🏋️ Training 2.0',desc:'Track sets, repetitions, weight and RIR, attach exercise media and use the rest timer. Data is isolated per plan.',search:'Search exercise or muscle group',all:'All',addExercise:'+ Custom Exercise',track:'Track',mediaBtn:'Media',noMedia:'🎯 No media yet',save:'💾 Save',remove:'Remove',addSet:'＋ Set',completed:'sets completed',volume:'Volume',reps:'Reps',weight:'Weight kg',rir:'RIR',done:'Done',set:'Set',custom:'Custom',send:'Send',coachPlaceholder:'Ask your fitness coach …',url:'Ollama URL',model:'Model',resetConfirm:'Delete training data, media and custom exercises for this plan only?',resetDone:'This plan’s data was reset.',watchReady:'Ready for a Bluetooth heart-rate device.',watchUnsupported:'Web Bluetooth is not supported in this browser.',connect:'🔗 Connect device',hr:'❤️ Heart rate'}
  };
  const t = k => (I18N[currentLang] || I18N.en)[k] || I18N.en[k] || k;
const EXERCISE_I18N = {
    'Barbell Curl': ['Langhantel-Curls', 'بايسبس بالبار'],
    'Incline Dumbbell Curl': ['Schrägbank-Kurzhantelcurls', 'بايسبس بالدمبل على بنش مائل'],
    'Hammer Curl': ['Hammercurls', 'هامر كيرل'],
    'Preacher Curl': ['Preacher-Curls', 'بايسبس على البنش الواعظ'],
    'Cable Curl': ['Kabelcurls', 'بايسبس بالكابل'],
    'Reverse Curl': ['Reverse Curls', 'بايسبس قبضة عكسية'],
    'Bayesian Cable Curl': ['Bayesian Cable Curl', 'بايسبس كابل بايزي'],
    'Concentration Curl': ['Konzentrationscurls', 'بايسبس تركيز'],
    'Rope Triceps Pushdown': ['Trizepsdrücken am Seil', 'ضغط ترايسبس بالحبل'],
    'Overhead Cable Extension': ['Trizepsstrecken über Kopf am Kabel', 'تمديد ترايسبس فوق الرأس بالكابل'],
    'Skull Crusher': ['French Press / Skull Crusher', 'سكَل كراشر'],
    'Close-Grip Bench Press': ['Enges Bankdrücken', 'بنش برس قبضة ضيقة'],
    'Single-Arm Cable Extension': ['Einarmiges Trizepsstrecken am Kabel', 'تمديد ترايسبس بالكابل بذراع واحدة'],
    'Dips': ['Dips', 'ديبس'],
    'Diamond Push-Up': ['Diamant-Liegestütze', 'ضغط دايموند'],
    'Chin-Up': ['Klimmzug im Untergriff', 'عقلة قبضة سفلية'],
    'Face Pull': ['Face Pulls', 'سحب الوجه'],
    'Cable Lateral Raise': ['Kabel-Seitheben', 'رفرفة جانبية بالكابل'],
    'Leg Press': ['Beinpresse', 'ضغط الأرجل'],
    'Romanian Deadlift': ['Rumänisches Kreuzheben', 'ديدليفت روماني'],
    'Bulgarian Split Squat': ['Bulgarian Split Squat', 'سكوات بلغاري'],
    'Hip Thrust': ['Hip Thrust', 'هيب ثرست'],
    'Standing Calf Raise': ['Wadenheben im Stehen', 'رفع السمانة واقفاً'],
    'Pull-Up': ['Klimmzug im Obergriff', 'عقلة قبضة علوية'],
    'Push-Up': ['Liegestütze', 'ضغط'],
    'Incline Bench Press': ['Schrägbankdrücken', 'بنش مائل'],
    'Lat Pulldown': ['Latzug', 'سحب أمامي'],
    'Seated Cable Row': ['Sitzendes Kabelrudern', 'تجديف بالكابل جالساً'],
    'Plank': ['Plank', 'بلانك'],
    'Hanging Knee Raise': ['Hängendes Knieheben', 'رفع الركبتين معلقاً'],
    'Dumbbell Fly': ['Kurzhantel-Flys', 'فلاي بالدمبل'],
    'Machine Chest Press': ['Brustpresse', 'ضغط الصدر على الجهاز'],
    'Pec Deck': ['Pec Deck', 'بيك ديك'],
    'Deficit Push-Up': ['Deficit-Liegestütze', 'ضغط بمدى عميق'],
    'Ring Push-Up': ['Ring-Liegestütze', 'ضغط بالحلقات'],
    'Neutral-Grip Pull-Up': ['Neutralgriff-Klimmzug', 'عقلة قبضة محايدة'],
    'Close-Grip Lat Pulldown': ['Enger Latzug', 'سحب أمامي قبضة ضيقة'],
    'Straight-Arm Pulldown': ['Pullover am Kabel mit gestreckten Armen', 'سحب بالكابل بذراعين مستقيمين'],
    'Barbell Row': ['Langhantelrudern', 'تجديف بالبار'],
    'Chest-Supported Row': ['Brustgestütztes Rudern', 'تجديف مع دعم الصدر'],
    'Single-Arm Dumbbell Row': ['Einarmiges Kurzhantelrudern', 'تجديف دمبل بذراع واحدة'],
    'T-Bar Row': ['T-Bar-Rudern', 'تجديف T-Bar'],
    'Inverted Row': ['Inverted Row / Körperzug', 'تجديف مقلوب'],
    'Overhead Barbell Press': ['Langhantel-Schulterdrücken', 'ضغط كتف بالبار فوق الرأس'],
    'Seated Dumbbell Shoulder Press': ['Sitzendes Kurzhantel-Schulterdrücken', 'ضغط كتف بالدمبل جالساً'],
    'Arnold Press': ['Arnold Press', 'أرنولد برس'],
    'Machine Shoulder Press': ['Schulterpresse', 'ضغط الكتف على الجهاز'],
    'Dumbbell Lateral Raise': ['Kurzhantel-Seitheben', 'رفرفة جانبية بالدمبل'],
    'Reverse Pec Deck': ['Reverse Pec Deck', 'بيك ديك عكسي'],
    'Pike Push-Up': ['Pike-Liegestütze', 'ضغط بايك'],
    'EZ-Bar Curl': ['SZ-Curls', 'بايسبس بالبار EZ'],
    'Dumbbell Curl': ['Kurzhantelcurls', 'بايسبس بالدمبل'],
    'Cross-Body Hammer Curl': ['Cross-Body Hammercurls', 'هامر كيرل عبر الجسم'],
    'Spider Curl': ['Spider Curls', 'سبايدر كيرل'],
    'Rope Cable Curl': ['Kabelcurls mit Seil', 'بايسبس كابل بالحبل'],
    'Zottman Curl': ['Zottman Curls', 'زوتمن كيرل'],
    'Straight-Bar Pushdown': ['Trizepsdrücken mit gerader Stange', 'ضغط ترايسبس بالبار المستقيم'],
    'Single-Arm Cable Pushdown': ['Einarmiges Trizepsdrücken am Kabel', 'ضغط ترايسبس بالكابل بذراع واحدة'],
    'Dumbbell Overhead Extension': ['Trizepsstrecken über Kopf mit Kurzhantel', 'تمديد ترايسبس بالدمبل فوق الرأس'],
    'JM Press': ['JM Press', 'جي إم برس'],
    'Bench Dips': ['Bank-Dips', 'ديبس على البنش'],
    'Bodyweight Triceps Extension': ['Trizepsstrecken mit Körpergewicht', 'تمديد ترايسبس بوزن الجسم'],
    'Back Squat': ['Kniebeugen mit Langhantel', 'سكوات بالبار'],
    'Front Squat': ['Frontkniebeugen', 'فرونت سكوات'],
    'Hack Squat': ['Hackenschmidt-Kniebeuge', 'هاك سكوات'],
    'Leg Extension': ['Beinstrecker', 'تمديد الأرجل'],
    'Walking Lunges': ['Ausfallschritte im Gehen', 'اندفاع أثناء المشي'],
    'Reverse Lunges': ['Rückwärts-Ausfallschritte', 'اندفاع خلفي'],
    'Step-Up': ['Step-Ups', 'صعود على منصة'],
    'Goblet Squat': ['Goblet Squat', 'غوبلت سكوات'],
    'Pistol Squat': ['Pistol Squat', 'سكوات مسدس'],
    'Conventional Deadlift': ['Klassisches Kreuzheben', 'ديدليفت تقليدي'],
    'Sumo Deadlift': ['Sumo-Kreuzheben', 'ديدليفت سومو'],
    'Good Morning': ['Good Mornings', 'غود مورنينغ'],
    'Lying Leg Curl': ['Liegender Beinbeuger', 'ثني الأرجل مستلقياً'],
    'Seated Leg Curl': ['Sitzender Beinbeuger', 'ثني الأرجل جالساً'],
    'Nordic Hamstring Curl': ['Nordic Hamstring Curl', 'نوردك هامسترينغ'],
    'Barbell Glute Bridge': ['Glute Bridge mit Langhantel', 'جسر الأرداف بالبار'],
    'Cable Pull-Through': ['Cable Pull-Through', 'سحب الكابل بين الساقين'],
    'Seated Calf Raise': ['Wadenheben im Sitzen', 'رفع السمانة جالساً'],
    'Leg Press Calf Raise': ['Wadenheben an der Beinpresse', 'رفع السمانة على جهاز الأرجل'],
    'Single-Leg Calf Raise': ['Einbeiniges Wadenheben', 'رفع السمانة برجل واحدة'],
    'Tibialis Raise': ['Tibialis Raise / Schienbeinheben', 'رفع عضلة الساق الأمامية'],
    'Cable Crunch': ['Kabel-Crunch', 'كرنش بالكابل'],
    'Machine Crunch': ['Crunch-Maschine', 'كرنش على الجهاز'],
    'Ab Wheel Rollout': ['Ab-Wheel-Rollout', 'رولر البطن'],
    'Hanging Leg Raise': ['Hängendes Beinheben', 'رفع الساقين معلقاً'],
    'Reverse Crunch': ['Reverse Crunch', 'كرنش عكسي'],
    'Bicycle Crunch': ['Fahrrad-Crunch', 'كرنش الدراجة'],
    'Side Plank': ['Seitstütz', 'بلانك جانبي'],
    'Cable Wood Chop': ['Kabel-Holzhacker', 'لف الكابل قطرياً'],
    'Pallof Press': ['Pallof Press', 'بالوف برس'],
    'Dead Bug': ['Dead Bug', 'ديد باغ'],
    'Treadmill Walk': ['Laufband-Gehen', 'مشي على جهاز المشي'],
    'Treadmill Run': ['Laufband-Laufen', 'جري على جهاز المشي'],
    'Incline Treadmill Walk': ['Steigendes Laufband-Gehen', 'مشي على جهاز المشي المائل'],
    'Stationary Bike': ['Ergometer / Heimtrainer', 'دراجة ثابتة'],
    'Rowing Machine': ['Ruderergometer', 'جهاز التجديف'],
    'Elliptical': ['Crosstrainer', 'إليبتكال'],
    'Stair Climber': ['Treppensteiger', 'جهاز صعود الدرج'],
    'Jump Rope': ['Seilspringen', 'نط الحبل'],
    'Burpee': ['Burpees', 'بيربي'],
    'Mountain Climber': ['Mountain Climbers', 'متسلق الجبل'],
    'Kettlebell Swing': ['Kettlebell Swings', 'مرجحة الكيتل بيل'],
    'Farmer’s Carry': ['Farmer’s Walk', 'مشي المزارع']
};
  const exerciseName = name => EXERCISE_I18N[name]?.[currentLang==='de'?0:currentLang==='ar'?1:undefined] || name;
  const muscleLabel = m => { const d={de:{Chest:'Brust',Back:'Rücken','Back / Biceps':'Rücken / Bizeps',Shoulders:'Schultern','Rear Delts':'Hintere Schulter',Biceps:'Bizeps','Biceps / Forearms':'Bizeps / Unterarme',Triceps:'Trizeps',Quads:'Quadrizeps','Quads / Glutes':'Quadrizeps / Gesäß',Glutes:'Gesäß','Glutes / Hamstrings':'Gesäß / Beinbeuger',Hamstrings:'Beinbeuger','Hamstrings / Glutes':'Beinbeuger / Gesäß','Hamstrings / Back':'Beinbeuger / Rücken',Calves:'Waden','Calves / Shins':'Waden / Schienbein',Core:'Core',Obliques:'Seitliche Bauchmuskeln',Cardio:'Cardio','Full Body':'Ganzkörper','Core / Cardio':'Core / Cardio'},ar:{Chest:'الصدر',Back:'الظهر','Back / Biceps':'الظهر / البايسبس',Shoulders:'الأكتاف','Rear Delts':'الكتف الخلفي',Biceps:'البايسبس','Biceps / Forearms':'البايسبس / الساعد',Triceps:'الترايسبس',Quads:'الفخذ الأمامي','Quads / Glutes':'الفخذ الأمامي / الأرداف',Glutes:'الأرداف','Glutes / Hamstrings':'الأرداف / أوتار الركبة',Hamstrings:'أوتار الركبة','Hamstrings / Glutes':'أوتار الركبة / الأرداف','Hamstrings / Back':'أوتار الركبة / الظهر',Calves:'السمانة','Calves / Shins':'السمانة / الساق',Core:'البطن',Obliques:'عضلات البطن الجانبية',Cardio:'كارديو','Full Body':'الجسم كامل','Core / Cardio':'البطن / كارديو'}}; return d[currentLang]?.[m] || m; };
  const typeLabel = x => currentLang==='de' ? ({Gym:'Gym',Calisthenics:'Calisthenics',Bodyweight:'Körpergewicht',Cardio:'Cardio'}[x]||x) : currentLang==='ar' ? ({Gym:'صالة',Calisthenics:'كاليستانيكس',Bodyweight:'وزن الجسم',Cardio:'كارديو'}[x]||x) : x;

  let timer = { seconds: 90, remaining: 90, running: false, id: null };
  let connectedDevice = null;
  let currentMediaExercise = '';

  const seedExercises = [
    ['Barbell Curl','Biceps','Gym','3 × 8-12'],['Incline Dumbbell Curl','Biceps','Gym','3 × 10-12'],
    ['Hammer Curl','Biceps','Gym','3 × 10-15'],['Preacher Curl','Biceps','Gym','3 × 10-12'],
    ['Cable Curl','Biceps','Gym','3 × 12-15'],['Reverse Curl','Biceps','Gym','3 × 10-15'],
    ['Bayesian Cable Curl','Biceps','Gym','3 × 10-15'],['Concentration Curl','Biceps','Gym','3 × 10-12'],
    ['Rope Triceps Pushdown','Triceps','Gym','3 × 10-15'],['Overhead Cable Extension','Triceps','Gym','3 × 10-15'],
    ['Skull Crusher','Triceps','Gym','3 × 8-12'],['Close-Grip Bench Press','Triceps','Gym','3 × 6-10'],
    ['Single-Arm Cable Extension','Triceps','Gym','3 × 10-15'],['Dips','Triceps','Calisthenics','3 × 6-15'],
    ['Diamond Push-Up','Triceps','Calisthenics','3 × 8-20'],['Chin-Up','Biceps / Back','Calisthenics','3 × 6-12'],
    ['Face Pull','Rear Delts','Gym','3 × 12-20'],['Cable Lateral Raise','Shoulders','Gym','3 × 12-20'],
    ['Leg Press','Quads','Gym','3 × 8-12'],['Romanian Deadlift','Hamstrings','Gym','3 × 6-10'],
    ['Bulgarian Split Squat','Quads / Glutes','Gym','3 × 8-12'],['Hip Thrust','Glutes','Gym','3 × 8-12'],
    ['Standing Calf Raise','Calves','Gym','4 × 10-15'],['Pull-Up','Back','Calisthenics','4 × 5-12'],
    ['Push-Up','Chest','Calisthenics','3 × 10-25'],['Incline Bench Press','Chest','Gym','3 × 8-12'],
    ['Lat Pulldown','Back','Gym','3 × 8-12'],['Seated Cable Row','Back','Gym','3 × 8-12'],
    ['Plank','Core','Calisthenics','3 × 30-60 sec'],['Hanging Knee Raise','Core','Calisthenics','3 × 8-15'],
    ['Dumbbell Fly','Chest','Gym','3 × 10-15'],['Machine Chest Press','Chest','Gym','3 × 8-12'],['Pec Deck','Chest','Gym','3 × 10-15'],['Deficit Push-Up','Chest','Calisthenics','3 × 8-15'],['Ring Push-Up','Chest','Calisthenics','3 × 8-15'],
    ['Neutral-Grip Pull-Up','Back','Calisthenics','3 × 6-12'],['Close-Grip Lat Pulldown','Back','Gym','3 × 8-12'],['Straight-Arm Pulldown','Back','Gym','3 × 10-15'],['Barbell Row','Back','Gym','3 × 6-10'],['Chest-Supported Row','Back','Gym','3 × 8-12'],['Single-Arm Dumbbell Row','Back','Gym','3 × 8-12'],['T-Bar Row','Back','Gym','3 × 8-12'],['Inverted Row','Back','Calisthenics','3 × 8-15'],
    ['Overhead Barbell Press','Shoulders','Gym','3 × 6-10'],['Seated Dumbbell Shoulder Press','Shoulders','Gym','3 × 8-12'],['Arnold Press','Shoulders','Gym','3 × 8-12'],['Machine Shoulder Press','Shoulders','Gym','3 × 8-12'],['Dumbbell Lateral Raise','Shoulders','Gym','3 × 12-20'],['Reverse Pec Deck','Rear Delts','Gym','3 × 12-20'],['Pike Push-Up','Shoulders','Calisthenics','3 × 8-15'],
    ['EZ-Bar Curl','Biceps','Gym','3 × 8-12'],['Dumbbell Curl','Biceps','Gym','3 × 8-12'],['Cross-Body Hammer Curl','Biceps','Gym','3 × 10-15'],['Spider Curl','Biceps','Gym','3 × 10-15'],['Rope Cable Curl','Biceps','Gym','3 × 10-15'],['Zottman Curl','Biceps / Forearms','Gym','3 × 10-12'],
    ['Straight-Bar Pushdown','Triceps','Gym','3 × 10-15'],['Single-Arm Cable Pushdown','Triceps','Gym','3 × 10-15'],['Dumbbell Overhead Extension','Triceps','Gym','3 × 10-15'],['JM Press','Triceps','Gym','3 × 8-12'],['Bench Dips','Triceps','Calisthenics','3 × 10-20'],['Bodyweight Triceps Extension','Triceps','Calisthenics','3 × 8-15'],
    ['Back Squat','Quads / Glutes','Gym','3 × 5-8'],['Front Squat','Quads','Gym','3 × 5-8'],['Hack Squat','Quads','Gym','3 × 8-12'],['Leg Extension','Quads','Gym','3 × 10-15'],['Walking Lunges','Quads / Glutes','Gym','3 × 10 each leg'],['Reverse Lunges','Quads / Glutes','Gym','3 × 8-12 each leg'],['Step-Up','Quads / Glutes','Gym','3 × 8-12'],['Goblet Squat','Quads','Gym','3 × 10-15'],['Pistol Squat','Quads / Glutes','Calisthenics','3 × 5-10'],
    ['Conventional Deadlift','Hamstrings / Back','Gym','3 × 3-6'],['Sumo Deadlift','Glutes / Hamstrings','Gym','3 × 5-8'],['Good Morning','Hamstrings / Glutes','Gym','3 × 8-12'],['Lying Leg Curl','Hamstrings','Gym','3 × 10-15'],['Seated Leg Curl','Hamstrings','Gym','3 × 10-15'],['Nordic Hamstring Curl','Hamstrings','Calisthenics','3 × 4-10'],['Barbell Glute Bridge','Glutes','Gym','3 × 10-15'],['Cable Pull-Through','Glutes','Gym','3 × 10-15'],
    ['Seated Calf Raise','Calves','Gym','4 × 10-20'],['Leg Press Calf Raise','Calves','Gym','4 × 10-20'],['Single-Leg Calf Raise','Calves','Bodyweight','3 × 12-20'],['Tibialis Raise','Calves / Shins','Bodyweight','3 × 15-25'],
    ['Cable Crunch','Core','Gym','3 × 10-15'],['Machine Crunch','Core','Gym','3 × 10-15'],['Ab Wheel Rollout','Core','Calisthenics','3 × 6-15'],['Hanging Leg Raise','Core','Calisthenics','3 × 8-15'],['Reverse Crunch','Core','Bodyweight','3 × 10-20'],['Bicycle Crunch','Core','Bodyweight','3 × 15-30'],['Side Plank','Obliques','Bodyweight','3 × 30-60 sec'],['Cable Wood Chop','Obliques','Gym','3 × 10-15'],['Pallof Press','Core','Gym','3 × 10-15'],['Dead Bug','Core','Bodyweight','3 × 8-15'],
    ['Treadmill Walk','Cardio','Cardio','20-45 min'],['Treadmill Run','Cardio','Cardio','20-45 min'],['Incline Treadmill Walk','Cardio','Cardio','20-40 min'],['Stationary Bike','Cardio','Cardio','20-45 min'],['Rowing Machine','Cardio','Cardio','15-30 min'],['Elliptical','Cardio','Cardio','20-45 min'],['Stair Climber','Cardio','Cardio','10-25 min'],['Jump Rope','Cardio','Cardio','10-20 min'],['Burpee','Full Body','Calisthenics','3 × 10-20'],['Mountain Climber','Core / Cardio','Calisthenics','3 × 20-40'],['Kettlebell Swing','Full Body','Gym','3 × 12-20'],['Farmer’s Carry','Full Body','Gym','3 × 30-60 sec']
  ].map((x, i) => ({ id: 'seed-' + i, name:x[0], muscle:x[1], type:x[2], target:x[3] }));

  function read(key, fallback) {
    try { return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback)); }
    catch (_) { return fallback; }
  }
  function write(key, value) { localStorage.setItem(key, JSON.stringify(value)); }
  function allExercises() {
    const custom = read(STORAGE.library(), []);

    // IMPORTANT: only read exercise cards from the currently selected language.
    // The old selector collected cards from all three hidden language blocks,
    // which caused mixed Arabic/German/English exercises in the library.
    const activeExercisesRoot = document.querySelector(`#sec-exercises [data-lang="${currentLang}"]`);
    const staticCards = [...(activeExercisesRoot?.querySelectorAll('.ex-card .ex-name') || [])].map((el, i) => {
      const card = el.closest('.ex-card');
      return {
        id:'page-' + currentLang + '-' + i,
        name:el.textContent.trim(),
        muscle:card?.querySelector('.ex-type')?.textContent.trim() || 'General',
        type:'Plan',
        target:card?.querySelector('.set-badge')?.textContent.trim() || '',
        language: currentLang
      };
    });

    // Custom exercises are language-scoped. Legacy entries without a language
    // remain visible so existing user data is not lost.
    const languageCustom = custom.filter(e => !e.language || e.language === currentLang);

    const map = new Map();
    [...seedExercises, ...staticCards, ...languageCustom].forEach(e => {
      if (e.name) map.set(e.name.toLowerCase(), e);
    });
    return [...map.values()].map(e => ({...e, displayName: exerciseName(e.name), displayMuscle: muscleLabel(e.muscle)}));
  }
  function escapeHtml(s) { return String(s ?? '').replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c])); }
  function openModal(title, html) {
    document.getElementById('feature-modal-title').textContent = title;
    document.getElementById('feature-modal-body').innerHTML = html;
    document.getElementById('fitness-feature-modal').classList.add('open');
  }
  function closeModal() { document.getElementById('fitness-feature-modal')?.classList.remove('open'); }

  function openTracker() {
    const exercises = allExercises();
    const logs = read(STORAGE.logs(), {});
    const options = exercises.map(e => `<option value="${escapeHtml(e.name)}">${escapeHtml(e.displayName)} · ${escapeHtml(e.displayMuscle)}</option>`).join('');
    openModal('📊 '+t('tracker'), `
      <div class="tracker-toolbar">
        <select id="tracker-exercise">${options}</select>
        <input id="tracker-date" type="date" value="${new Date().toISOString().slice(0,10)}">
        <button class="primary-btn" onclick="FitnessFeatures.addSet()">${t('addSet')}</button>
        <button class="secondary-btn" onclick="FitnessFeatures.saveTracker()">${t('save')}</button>
      </div>
      <div class="tracker-table-wrap"><table class="tracker-table"><thead><tr><th>${t('set')}</th><th>${t('reps')}</th><th>${t('weight')}</th><th>${t('rir')}</th><th>${t('done')}</th><th></th></tr></thead><tbody id="tracker-rows"></tbody></table></div>
      <div id="tracker-summary" class="feature-panel" style="margin-top:1rem"></div>
    `);
    const first = exercises[0]?.name || '';
    document.getElementById('tracker-exercise').value = first;
    renderRows(logs[getTrackerKey()] || [{reps:10,weight:0,rir:2,done:false}]);
    document.getElementById('tracker-exercise').addEventListener('change', () => renderRows(logs[getTrackerKey()] || [{reps:10,weight:0,rir:2,done:false}]));
    document.getElementById('tracker-date').addEventListener('change', () => renderRows(logs[getTrackerKey()] || [{reps:10,weight:0,rir:2,done:false}]));
  }
  function getTrackerKey() { return (document.getElementById('tracker-date')?.value || '') + '|' + (document.getElementById('tracker-exercise')?.value || ''); }
  function renderRows(rows) {
    const body = document.getElementById('tracker-rows'); if (!body) return;
    body.innerHTML = rows.map((r,i) => `<tr data-index="${i}"><td>${i+1}</td><td><input class="tr-reps" type="number" min="0" value="${r.reps ?? 0}"></td><td><input class="tr-weight" type="number" min="0" step="0.5" value="${r.weight ?? 0}"></td><td><input class="tr-rir" type="number" min="0" max="10" value="${r.rir ?? 0}"></td><td><input class="done" type="checkbox" ${r.done ? 'checked' : ''}></td><td><button class="mini-btn" onclick="FitnessFeatures.removeSet(${i})">✕</button></td></tr>`).join('');
    updateSummary();
    body.querySelectorAll('input').forEach(i => i.addEventListener('input', updateSummary));
  }
  function getCurrentRows() { return [...document.querySelectorAll('#tracker-rows tr')].map(tr => ({ reps:+tr.querySelector('.tr-reps').value||0, weight:+tr.querySelector('.tr-weight').value||0, rir:+tr.querySelector('.tr-rir').value||0, done:tr.querySelector('.done').checked })); }
  function updateSummary() { const rows=getCurrentRows(); const volume=rows.reduce((s,r)=>s+r.reps*r.weight,0); const done=rows.filter(r=>r.done).length; const el=document.getElementById('tracker-summary'); if(el) el.innerHTML=`<strong>${done}/${rows.length} ${t('completed')}</strong> · Volumen: <strong>${volume.toFixed(1)} kg</strong>`; }
  function addSet(){ const rows=getCurrentRows(); rows.push({reps:10,weight:rows.at(-1)?.weight||0,rir:2,done:false}); renderRows(rows); }
  function removeSet(i){ const rows=getCurrentRows(); rows.splice(i,1); renderRows(rows.length?rows:[{reps:10,weight:0,rir:2,done:false}]); }
  function saveTracker(){ const logs=read(STORAGE.logs(),{}); logs[getTrackerKey()]=getCurrentRows(); write(STORAGE.logs(),logs); showToast('✅ '+(currentLang==='ar'?'تم حفظ التدريب':currentLang==='de'?'Training gespeichert':'Training saved')); }

  function openTimer() {
    openModal('⏱️ '+t('timer'), `<div class="timer-display" id="timer-display">01:30</div><div class="timer-presets">${[30,60,90,120,180].map(s=>`<button onclick="FitnessFeatures.setTimer(${s})">${s}s</button>`).join('')}<button onclick="FitnessFeatures.customTimer()">${t('custom')}</button></div><div class="timer-controls"><button class="primary-btn" onclick="FitnessFeatures.toggleTimer()">▶ ${currentLang==='ar'?'بدء / إيقاف مؤقت':currentLang==='de'?'Start / Pause':'Start / Pause'}</button><button class="secondary-btn" onclick="FitnessFeatures.resetTimer()">↻ ${currentLang==='ar'?'إعادة':currentLang==='de'?'Reset':'Reset'}</button></div>`);
    updateTimerDisplay();
  }
  function setTimer(seconds){ timer.seconds=seconds; timer.remaining=seconds; timer.running=false; clearInterval(timer.id); updateTimerDisplay(); }
  function customTimer(){ const v=prompt(currentLang==='ar'?'الثواني:':currentLang==='de'?'Timer in Sekunden:':'Timer in seconds:', timer.seconds); if(v && +v>0) setTimer(+v); }
  function toggleTimer(){ if(timer.running){timer.running=false;clearInterval(timer.id);return;} timer.running=true; timer.id=setInterval(()=>{timer.remaining--;updateTimerDisplay();if(timer.remaining<=0){clearInterval(timer.id);timer.running=false;try{navigator.vibrate?.([200,100,200]);}catch(_){}}},1000); }
  function resetTimer(){setTimer(timer.seconds);}
  function updateTimerDisplay(){ const el=document.getElementById('timer-display'); if(!el)return; const m=Math.floor(timer.remaining/60),s=timer.remaining%60;el.textContent=String(m).padStart(2,'0')+':'+String(s).padStart(2,'0'); }

  function openLibrary(){
    const list=allExercises(), media=read(STORAGE.media(),{});
    openModal('📚 '+t('library'), `<div class="tracker-toolbar"><input id="library-search" placeholder="${escapeHtml(t('search'))}"><select id="library-filter"><option value="all">${t('all')}</option><option value="Biceps">${currentLang==='ar'?'بايسبس':currentLang==='de'?'Bizeps':'Biceps'}</option><option value="Triceps">${currentLang==='ar'?'ترايسبس':currentLang==='de'?'Trizeps':'Triceps'}</option><option value="Chest">${currentLang==='ar'?'الصدر':currentLang==='de'?'Brust':'Chest'}</option><option value="Back">${currentLang==='ar'?'الظهر':currentLang==='de'?'Rücken':'Back'}</option><option value="Shoulders">${currentLang==='ar'?'الأكتاف':currentLang==='de'?'Schultern':'Shoulders'}</option><option value="Legs">${currentLang==='ar'?'أرجل':currentLang==='de'?'Beine':'Legs'}</option><option value="Core">${currentLang==='ar'?'بطن':currentLang==='de'?'Core':'Core'}</option><option value="Cardio">Cardio</option></select><button class="primary-btn" onclick="FitnessFeatures.addCustomExercise()">${t('addExercise')}</button></div><div class="library-count" id="library-count"></div><div id="library-grid" class="library-grid"></div>`);
    const render=()=>{ const q=(document.getElementById('library-search').value||'').toLowerCase(),f=document.getElementById('library-filter').value; const filtered=list.filter(e=>(!q||`${e.name} ${e.displayName} ${e.muscle} ${e.displayMuscle}`.toLowerCase().includes(q))&&(f==='all'||e.muscle.toLowerCase().includes(f.toLowerCase()))); document.getElementById('library-count').textContent=`${filtered.length} / ${list.length} ${currentLang==='ar'?'تمرين':currentLang==='de'?'Übungen':'exercises'}`; document.getElementById('library-grid').innerHTML=filtered.map(e=>{const m=media[e.name]||{};return `<div class="library-card"><div class="library-media">${m.data?((m.type||'').startsWith('video')?`<video src="${m.data}" controls></video>`:`<img src="${m.data}" alt="${escapeHtml(e.displayName)}">`):m.url?((m.type||'').includes('video')?`<video src="${escapeHtml(m.url)}" controls></video>`:`<img src="${escapeHtml(m.url)}" alt="${escapeHtml(e.displayName)}">`):t('noMedia')}</div><div class="library-card-body"><h4>${escapeHtml(e.displayName)}</h4><div class="library-meta">${escapeHtml(e.displayMuscle)} · ${escapeHtml(typeLabel(e.type))} · ${escapeHtml(e.target)}</div><div class="library-actions"><button class="mini-btn" onclick="FitnessFeatures.trackExercise('${escapeHtml(e.name).replace(/'/g,"\\'")}')">${t('track')}</button><button class="mini-btn" onclick="FitnessFeatures.editMedia('${escapeHtml(e.name).replace(/'/g,"\\'")}')">${t('mediaBtn')}</button></div></div></div>`}).join(''); };
    document.getElementById('library-search').oninput=render;document.getElementById('library-filter').onchange=render;render();
  }
  function trackExercise(name){closeModal();setTimeout(()=>{openTracker();const s=document.getElementById('tracker-exercise');if(s){s.value=name;s.dispatchEvent(new Event('change'));}},50);}
  function addCustomExercise(){
    openModal('＋ '+t('addExercise'), `<div class="form-grid"><label>${currentLang==='ar'?'الاسم':currentLang==='de'?'Name':'Name'}<input id="new-ex-name"></label><label>${currentLang==='ar'?'مجموعة عضلية':currentLang==='de'?'Muskelgruppe':'Muscle group'}<input id="new-ex-muscle" placeholder="Biceps"></label><label>${currentLang==='ar'?'النوع':currentLang==='de'?'Typ':'Type'}<select id="new-ex-type"><option>Gym</option><option>Calisthenics</option><option>Cardio</option></select></label><label>${currentLang==='ar'?'النطاق':currentLang==='de'?'Zielbereich':'Target'}<input id="new-ex-target" value="3 × 10-12"></label><div class="form-full"><button class="primary-btn" onclick="FitnessFeatures.saveCustomExercise()">${t('save')}</button></div></div>`);
  }
  function saveCustomExercise(){const name=document.getElementById('new-ex-name').value.trim();if(!name)return;const list=read(STORAGE.library(),[]);list.push({id:'custom-'+Date.now(),name,muscle:document.getElementById('new-ex-muscle').value||'General',type:document.getElementById('new-ex-type').value,target:document.getElementById('new-ex-target').value||'',language:currentLang});write(STORAGE.library(),list);showToast('✅ '+(currentLang==='ar'?'تمت إضافة التمرين':currentLang==='de'?'Übung hinzugefügt':'Exercise added'));openLibrary();}

  function openMediaPicker(exercise){
    const name=exercise || document.querySelector('.ex-card .ex-name')?.textContent.trim() || allExercises()[0]?.name || '';
    currentMediaExercise=name; const m=read(STORAGE.media(),{})[name]||{};
    openModal('🎥 '+t('media'), `<div class="form-grid"><label class="form-full">Übung<input id="media-exercise" value="${escapeHtml(name)}"></label><label class="form-full">Bild- oder Video-URL<input id="media-url" value="${escapeHtml(m.url||'')}" placeholder="https://…"></label><label class="form-full">Oder lokale Datei<input id="media-file" type="file" accept="image/*,video/*"></label><div class="form-full"><div id="media-preview" class="media-preview"></div></div><div class="form-full"><button class="primary-btn" onclick="FitnessFeatures.saveMedia()">${t('save')}</button><button class="secondary-btn" onclick="FitnessFeatures.removeMedia()">${t('remove')}</button></div></div>`);
    document.getElementById('media-file').onchange=e=>previewFile(e.target.files[0]); previewMedia(m);
  }
  function previewFile(file){if(!file)return;const r=new FileReader();r.onload=()=>previewMedia({data:r.result,type:file.type});r.readAsDataURL(file);}
  function previewMedia(m){const p=document.getElementById('media-preview');if(!p||!m)return;p.innerHTML=m.data?((m.type||'').startsWith('video')?`<video src="${m.data}" controls></video>`:`<img src="${m.data}" alt="preview">`):m.url?((m.type||'').includes('video')?`<video src="${escapeHtml(m.url)}" controls></video>`:`<img src="${escapeHtml(m.url)}" alt="preview">`):'';}
  function editMedia(name){openMediaPicker(name);}
  function saveMedia(){const name=document.getElementById('media-exercise').value.trim();const url=document.getElementById('media-url').value.trim();const file=document.getElementById('media-file').files[0];const media=read(STORAGE.media(),{});const finish=(m)=>{media[name]=m;write(STORAGE.media(),media);showToast('✅ '+(currentLang==='ar'?'تم حفظ الوسائط':currentLang==='de'?'Medien gespeichert':'Media saved'));openLibrary();};if(file){const r=new FileReader();r.onload=()=>finish({data:r.result,type:file.type});r.readAsDataURL(file);}else finish(url?{url,type:url.match(/\.(mp4|webm|mov)(\?|$)/i)?'video':'image'}:{});}
  function removeMedia(){const name=document.getElementById('media-exercise').value.trim();const media=read(STORAGE.media(),{});delete media[name];write(STORAGE.media(),media);showToast(t('remove'));closeModal();}

  async function connectHeartRate(){
    if(!navigator.bluetooth){openModal('⌚ '+t('watch'), `<div class="device-status"><span class="status-dot"></span><span>${t('watchUnsupported')}</span></div>`);return;}
    openModal('⌚ '+t('watch'), `<div class="device-status" id="device-status"><span class="status-dot"></span><span>${t('watchReady')}</span></div><div style="margin-top:1rem"><button class="primary-btn" onclick="FitnessFeatures.pairHeartRate()">${t('connect')}</button></div><div id="hr-live" class="feature-panel" style="margin-top:1rem">${t('hr')}: — bpm</div>`);
  }
  async function pairHeartRate(){
    try{
      connectedDevice=await navigator.bluetooth.requestDevice({filters:[{services:['heart_rate']}]});
      const server=await connectedDevice.gatt.connect();const service=await server.getPrimaryService('heart_rate');const ch=await service.getCharacteristic('heart_rate_measurement');await ch.startNotifications();ch.addEventListener('characteristicvaluechanged',e=>{const v=e.target.value;const flags=v.getUint8(0);const hr=(flags&1)?v.getUint16(1,true):v.getUint8(1);const el=document.getElementById('hr-live');if(el)el.innerHTML=`❤️ Herzfrequenz: <strong>${hr} bpm</strong>`;});
      document.querySelector('#device-status .status-dot')?.classList.add('connected');document.querySelector('#device-status span:last-child').textContent='Verbunden: '+(connectedDevice.name||'Herzfrequenzgerät');
    }catch(err){showToast('⚠️ Bluetooth-Verbindung abgebrochen oder nicht verfügbar');}
  }

  function openChat(){
    const chat=read(STORAGE.chat(),[]);
    openModal('🤖 '+t('coach'), `<div class="chat-config"><input id="ollama-url" value="${escapeHtml(localStorage.getItem(STORAGE.ollamaUrl())||'http://localhost:11434')}" placeholder="${t('url')}"><input id="ollama-model" value="${escapeHtml(localStorage.getItem(STORAGE.ollamaModel())||'qwen3:8b')}" placeholder="${t('model')}"></div><div class="chat-messages" id="chat-messages">${chat.map(m=>`<div class="chat-msg ${m.role==='user'?'user':'bot'}">${escapeHtml(m.content)}</div>`).join('')}</div><div class="chat-input"><textarea id="chat-input" placeholder="${t('coachPlaceholder')}"></textarea><button class="primary-btn" onclick="FitnessFeatures.sendChat()">${t('send')}</button></div><p style="color:var(--muted);font-size:.72rem;margin-top:.5rem">Ollama muss erreichbar sein. Standard: localhost:11434 · Modell: qwen3:8b.</p>`);
    const box=document.getElementById('chat-messages');if(box)box.scrollTop=box.scrollHeight;
  }
  async function sendChat(){
    const input=document.getElementById('chat-input'), msg=input?.value.trim();if(!msg)return;
    const url=(document.getElementById('ollama-url').value||'http://localhost:11434').replace(/\/$/,'');const model=document.getElementById('ollama-model').value||'qwen3:8b';localStorage.setItem(STORAGE.ollamaUrl(),url);localStorage.setItem(STORAGE.ollamaModel(),model);
    const history=read(STORAGE.chat(),[]);history.push({role:'user',content:msg});write(STORAGE.chat(),history);openChat();
    const box=document.getElementById('chat-messages');box.insertAdjacentHTML('beforeend','<div class="chat-msg bot">⏳ Qwen3 denkt …</div>');box.scrollTop=box.scrollHeight;
    try{
      const res=await fetch(url+'/api/chat',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({model,stream:false,messages:[{role:'system',content:'You are a concise fitness coach inside a workout tracker. Give practical training guidance, exercise substitutions, progression ideas, and logging advice. Do not diagnose injuries or provide medical treatment.'},...history.slice(-12)]})});
      if(!res.ok)throw new Error('HTTP '+res.status);const data=await res.json();const answer=data.message?.content||'Keine Antwort erhalten.';const updated=read(STORAGE.chat(),[]);updated.push({role:'assistant',content:answer});write(STORAGE.chat(),updated);openChat();
    }catch(err){const box2=document.getElementById('chat-messages');const last=box2?.lastElementChild;if(last)last.textContent='⚠️ Ollama konnte nicht erreicht werden. Prüfe URL, CORS und ob das Modell verfügbar ist.';}
  }


  function refreshLanguage(){
    document.querySelectorAll('[data-feature]').forEach(btn=>{const label=btn.querySelector('.feature-label');const key=btn.dataset.feature;if(label&&t(key))label.textContent=t(key);});
    // If the library is currently open, immediately rebuild it in the new language.
    if(document.getElementById('fitness-feature-modal')?.classList.contains('open') && document.getElementById('library-grid')) openLibrary();
    document.querySelectorAll('.exercise-media-btn').forEach(b=>b.textContent='🎥 '+(currentLang==='ar'?'وسائط':currentLang==='de'?'Medien':'Media'));
    const title=document.getElementById('training-feature-title'); if(title) title.textContent=t('title');
    const desc=document.getElementById('training-feature-description'); if(desc) desc.textContent=t('desc');
    const sw=document.querySelector('[data-switch-label]'); if(sw) sw.textContent=currentLang==='ar'?'تبديل / إضافة خطط مخصصة':currentLang==='de'?'Eigene Pläne wechseln / hinzufügen':'Switch / Add Custom Plans';
    const pl=document.querySelector('[data-active-profile-label]'); if(pl) pl.textContent=currentLang==='ar'?'الملف التدريبي النشط:':currentLang==='de'?'Aktives Trainingsprofil:':'Active Session Profile:';
    const labels={ar:{weight:'الوزن الحالي كغ',bmi:'مؤشر كتلة الجسم',months:'أشهر حتى الماراثون',target:'الوزن المستهدف كغ',height:'الطول سم',marathon:'الماراثون كم'},de:{weight:'AKTUELLES KG',bmi:'BMI',months:'MONATE BIS MARATHON',target:'ZIELGEWICHT KG',height:'GRÖSSE CM',marathon:'MARATHON KM'},en:{weight:'KG CURRENT',bmi:'BMI',months:'MONTHS TO MARATHON',target:'KG TARGET',height:'CM HEIGHT',marathon:'KM MARATHON'}}[currentLang] || {};
    Object.keys(labels).forEach(k=>{const el=document.querySelector(`[data-stat-label="${k}"]`);if(el)el.textContent=labels[k];});
  }
  function resetPersonalData(){
    if(!confirm(t('resetConfirm'))) return;
    [STORAGE.logs(),STORAGE.library(),STORAGE.media(),STORAGE.chat(),STORAGE.ollamaUrl(),STORAGE.ollamaModel()].forEach(k=>localStorage.removeItem(k));
    showToast('↻ '+t('resetDone')); closeModal();
  }
  window.FitnessFeatures={openTracker,addSet,removeSet,saveTracker,openTimer,setTimer,customTimer,toggleTimer,resetTimer,openLibrary,trackExercise,addCustomExercise,saveCustomExercise,openMediaPicker,editMedia,saveMedia,removeMedia,connectHeartRate,pairHeartRate,openChat,sendChat,closeModal,resetPersonalData,refreshLanguage};

  // Modal UX: close when clicking the backdrop (outside the dialog) or pressing Escape.
  document.addEventListener('click', e => {
    const modal = document.getElementById('fitness-feature-modal');
    const dialog = modal?.querySelector('.feature-dialog');
    if (modal?.classList.contains('open') && e.target === modal && !dialog?.contains(e.target)) closeModal();
  });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && document.getElementById('fitness-feature-modal')?.classList.contains('open')) closeModal();
  });

  window.addEventListener('load',()=>{
    // Add a media button to every existing exercise card.
    document.querySelectorAll('.ex-card').forEach(card=>{
      if(card.querySelector('.exercise-media-btn'))return;
      const name=card.querySelector('.ex-name')?.textContent.trim();if(!name)return;
      const b=document.createElement('button');b.className='mini-btn exercise-media-btn';b.type='button';b.textContent='🎥 '+(currentLang==='ar'?'وسائط':currentLang==='de'?'Medien':'Media');b.onclick=()=>openMediaPicker(name);b.style.marginTop='.7rem';card.appendChild(b);
    });
  });
})();
