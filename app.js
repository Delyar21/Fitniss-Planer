// ============================================================
// FITNESS MASTER PLAN — COMPLETE EDIT ENGINE v2.0
// ============================================================

let currentLang = 'ar';
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
  const subs = {
    ar: 'خطتك الكاملة | الصالة + كاليستانيكس + ماراتون',
    de: 'Dein kompletter Plan | Gym + Calisthenics + Marathon',
    en: 'Your complete plan | Gym + Calisthenics + Marathon'
  };
  document.getElementById('hero-sub').textContent = subs[lang];
  document.documentElement.dir  = lang === 'ar' ? 'rtl' : 'ltr';
  document.documentElement.lang = lang;

  // Update toolbar labels on lang change
  updateToolbarLabels();
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
  document.querySelectorAll('.progress-fill').forEach(bar => {
    if (bar.querySelector('.prog-slider')) return;
    const slider = document.createElement('input');
    slider.type  = 'range';
    slider.min   = '0'; slider.max = '100';
    slider.value = parseInt(bar.style.width) || 50;
    slider.className = 'prog-slider';
    slider.oninput = () => { bar.style.width = slider.value + '%'; };
    bar.appendChild(slider);
  });

  // 4. Add "Add Card" buttons to ex-grids
  document.querySelectorAll('.ex-grid').forEach(grid => {
    if (grid.querySelector('.add-card-btn')) return;
    const btn = document.createElement('button');
    btn.className = 'add-card-btn';
    btn.textContent = '+ Add Exercise';
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
    '.add-meal-btn,.add-mt-btn,.add-checklist-btn,.delete-li-btn,.prog-slider,' +
    '.edit-action-btn,.add-phase-btn,.add-mealday-btn'
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
    <div class="ex-type gym editable-text" contenteditable="true" spellcheck="false">Gym · Muscle</div>
    <div class="ex-name editable-text" contenteditable="true" spellcheck="false">Exercise Name</div>
    <div class="ex-detail editable-text" contenteditable="true" spellcheck="false">Description, technique and cues...</div>
    <div class="ex-sets">
      <span class="set-badge gym editable-text" contenteditable="true" spellcheck="false">3 × 10</span>
      <span class="set-badge gym editable-text" contenteditable="true" spellcheck="false">60 sec rest</span>
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
  // add slider to new bar
  const bar = phase.querySelector('.progress-fill');
  const slider = document.createElement('input');
  slider.type = 'range'; slider.min = '0'; slider.max = '100'; slider.value = 50;
  slider.className = 'prog-slider';
  slider.oninput = () => { bar.style.width = slider.value + '%'; };
  bar.appendChild(slider);
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

  localStorage.setItem('fitnessState', JSON.stringify(state));
  showToast(currentLang === 'ar' ? '\u2705 \u062A\u0645 \u062D\u0641\u0638 \u062E\u0637\u062A\u0643!' :
            currentLang === 'de' ? '\u2705 Plan gespeichert!' : '\u2705 Plan saved!');
}

function loadSavedState() {
  const state = JSON.parse(localStorage.getItem('fitnessState') || '{}');
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
  localStorage.removeItem('fitnessState');
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
  loadSavedState();

  // Inject floating edit toolbar
  const toolbar = document.createElement('div');
  toolbar.id = 'edit-toolbar';
  toolbar.innerHTML = `
    <button id="edit-toggle-btn" onclick="toggleEditMode()">&#9999;&#65039; Edit Plan</button>
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