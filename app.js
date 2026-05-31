/* ============================================================
   DELYAR FITNESS PLAN — UNIVERSAL EDIT ENGINE v3.0
   Every element in every tab is user-editable.
   All changes persist via localStorage.
   ============================================================ */

'use strict';

let currentLang = 'ar';
let currentTab  = 'overview';
let editMode    = false;
const STORE_KEY = 'delyar_plan_v3';

/* ── helpers ──────────────────────────────────────────────── */
const $  = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];
const save = () => localStorage.setItem(STORE_KEY, JSON.stringify(collectState()));
const t = (ar, de, en) => ({ ar, de, en })[currentLang] ?? ar;

/* ── Language ─────────────────────────────────────────────── */
function setLang(lang, btn) {
  currentLang = lang;
  $$('.lang-btn').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');
  $$('[data-lang]').forEach(el =>
    el.classList.toggle('show', el.dataset.lang === lang));
  $$('[data-lang-inline]').forEach(el =>
    el.classList.toggle('show', el.dataset.langInline === lang));
  const subs = {
    ar: 'خطتك الكاملة | الصالة + كاليستانيكس + ماراتون',
    de: 'Dein kompletter Plan | Gym + Calisthenics + Marathon',
    en: 'Your complete plan | Gym + Calisthenics + Marathon'
  };
  const heroSub = document.getElementById('hero-sub');
  if (heroSub) heroSub.textContent = subs[lang];
  document.documentElement.dir  = lang === 'ar' ? 'rtl' : 'ltr';
  document.documentElement.lang = lang;
  updateEditModeUI();
  save();
}

/* ── Tabs ─────────────────────────────────────────────────── */
function setTab(tab) {
  currentTab = tab;
  $$('.section').forEach(s => s.classList.remove('active'));
  $$('.tab').forEach(t => t.classList.remove('active'));
  const sec = document.getElementById('sec-' + tab);
  const tabBtn = document.getElementById('tab-' + tab);
  if (sec)    sec.classList.add('active');
  if (tabBtn) tabBtn.classList.add('active');
  save();
}

/* ── Meal accordion ───────────────────────────────────────── */
function toggleMeal(head) {
  const body = head.nextElementSibling;
  const open = body.classList.toggle('open');
  head.classList.toggle('open-head', open);
}

/* ══════════════════════════════════════════════════════════
   UNIVERSAL EDIT ENGINE
   ══════════════════════════════════════════════════════════ */

/* List of CSS selectors whose textContent is editable */
const EDITABLE_SELECTORS = [
  /* Hero */
  '.hero-tag',
  'h1',
  '#hero-sub',
  /* Stats */
  '.stat-val',
  /* Section titles & subtitles */
  '.sec-title',
  '.sec-sub',
  /* Phase cards */
  '.phase h3',
  '.phase p',
  '.phase-label',
  /* Tip boxes */
  '.tip-text',
  /* Week grid sessions */
  '.session',
  /* Exercise cards */
  '.ex-name',
  '.ex-detail',
  '.ex-type',
  '.set-badge',
  /* Meal plan */
  '.meal-name',
  '.meal-desc',
  '.meal-time',
  '.meal-kcal',
  '.kcal-badge',
  /* Marathon timeline */
  '.mt-month',
  '.mt-focus',
  '.mt-detail',
  '.mt-km',
  /* Budget */
  '.budget-cat',
  '.budget-val-text',
  '.budget-desc',
  /* Muscle group headers */
  '.muscle-group-header',
  /* Checklist items */
  '.checklist li',
  /* Footer */
  'footer',
];

/* Elements that should NOT be editable (buttons / UI chrome) */
const SKIP_CLASSES = [
  'lang-btn','tab','remove-budget-btn','budget-add-btn',
  'budget-save-btn','suggestion-btn','edit-mode-btn','edit-delete-btn'
];

function isSkippable(el) {
  if (!el) return true;
  if (['BUTTON','INPUT','TEXTAREA','SELECT'].includes(el.tagName)) return true;
  return SKIP_CLASSES.some(c => el.classList.contains(c));
}

/* ── Toggle edit mode ─────────────────────────────────────── */
function toggleEditMode() {
  editMode = !editMode;
  updateEditModeUI();
  if (!editMode) save();
}

function updateEditModeUI() {
  const btn = document.getElementById('edit-mode-btn');
  if (!btn) return;
  if (editMode) {
    btn.textContent = t('✅ حفظ التعديلات','✅ Änderungen speichern','✅ Save changes');
    btn.classList.add('active');
    document.body.classList.add('edit-active');
    attachEditListeners();
  } else {
    btn.textContent = t('✏️ تعديل الخطة','✏️ Plan bearbeiten','✏️ Edit plan');
    btn.classList.remove('active');
    document.body.classList.remove('edit-active');
    removeEditListeners();
    showSaveToast();
  }
}

/* ── Attach / remove click listeners ─────────────────────── */
function attachEditListeners() {
  EDITABLE_SELECTORS.forEach(sel => {
    $$(sel).forEach(el => {
      if (isSkippable(el)) return;
      if (!el.dataset.editBound) {
        el.addEventListener('click', onEditableClick);
        el.dataset.editBound = '1';
      }
      el.classList.add('editable-hover');
    });
  });
  /* Also allow adding/removing items in every repeater section */
  enableSectionControls(true);
}

function removeEditListeners() {
  $$('[data-edit-bound]').forEach(el => {
    el.removeEventListener('click', onEditableClick);
    delete el.dataset.editBound;
    el.classList.remove('editable-hover');
  });
  enableSectionControls(false);
}

/* ── Inline text editor ───────────────────────────────────── */
function onEditableClick(e) {
  if (!editMode) return;
  const el = e.currentTarget;
  if (el.querySelector('input,textarea')) return; // already open
  e.stopPropagation();

  const originalHTML = el.innerHTML;
  const originalText = el.innerText;
  const multiLine    = originalText.length > 60 || originalText.includes('\n');

  el.dataset.originalHtml = originalHTML;
  el.classList.add('editing-now');

  /* build input */
  const input = multiLine
    ? Object.assign(document.createElement('textarea'), { rows: 3 })
    : document.createElement('input');
  input.className   = 'inline-edit-input';
  input.value       = originalText;
  input.dir         = currentLang === 'ar' ? 'rtl' : 'ltr';

  /* confirm / cancel buttons */
  const wrap = document.createElement('span');
  wrap.className = 'inline-edit-wrap';

  const ok = document.createElement('button');
  ok.textContent = '✓';
  ok.className   = 'inline-edit-ok';
  ok.title       = 'Confirm';

  const cancel = document.createElement('button');
  cancel.textContent = '✕';
  cancel.className   = 'inline-edit-cancel';
  cancel.title       = 'Cancel';

  ok.addEventListener('click', e2 => { e2.stopPropagation(); commitEdit(el, input.value); });
  cancel.addEventListener('click', e2 => { e2.stopPropagation(); cancelEdit(el); });

  input.addEventListener('keydown', e2 => {
    if (!multiLine && e2.key === 'Enter') { e2.preventDefault(); commitEdit(el, input.value); }
    if (e2.key === 'Escape') cancelEdit(el);
  });

  wrap.appendChild(input);
  wrap.appendChild(ok);
  wrap.appendChild(cancel);

  el.innerHTML = '';
  el.appendChild(wrap);
  input.focus();
  input.select();
}

function commitEdit(el, value) {
  el.innerHTML = value.replace(/\n/g, '<br>');
  el.classList.remove('editing-now');
  delete el.dataset.originalHtml;
  save();
}

function cancelEdit(el) {
  el.innerHTML = el.dataset.originalHtml || el.innerHTML;
  el.classList.remove('editing-now');
  delete el.dataset.originalHtml;
}

/* ══════════════════════════════════════════════════════════
   SECTION-LEVEL CONTROLS  (add / remove whole cards / items)
   ══════════════════════════════════════════════════════════ */

function enableSectionControls(on) {
  /* Phase cards */
  $$('.phase').forEach(el => toggleDeleteBtn(el, on, deletePhase));
  /* Exercise cards */
  $$('.ex-card').forEach(el => toggleDeleteBtn(el, on, deleteExCard));
  /* Week sessions */
  $$('.session').forEach(el => toggleDeleteBtn(el, on, el => el.remove()));
  /* Meal items */
  $$('.meal-item').forEach(el => toggleDeleteBtn(el, on, el => el.remove()));
  /* Marathon items */
  $$('.mt-item').forEach(el => toggleDeleteBtn(el, on, el => el.remove()));
  /* Checklist items */
  $$('.checklist li').forEach(el => toggleDeleteBtn(el, on, el => el.remove()));
  /* Tip boxes */
  $$('.tip').forEach(el => toggleDeleteBtn(el, on, el => el.remove()));

  /* Add-buttons for sections */
  $$('.section-add-btn').forEach(btn => {
    btn.style.display = on ? 'inline-flex' : 'none';
  });
}

function toggleDeleteBtn(el, show, handler) {
  let btn = el.querySelector(':scope > .edit-delete-btn');
  if (show) {
    if (!btn) {
      btn = document.createElement('button');
      btn.className   = 'edit-delete-btn';
      btn.textContent = '✕';
      btn.title       = 'Remove';
      btn.addEventListener('click', e => { e.stopPropagation(); handler(el); save(); });
      el.appendChild(btn);
    }
    btn.style.display = 'flex';
  } else {
    if (btn) btn.style.display = 'none';
  }
}

function deletePhase(el) {
  if ($$('.phase').length > 1) el.remove();
}
function deleteExCard(el) { el.remove(); }

/* ── Add new exercise card ────────────────────────────────── */
function addExerciseCard(gridEl, type) {
  const isGym  = type === 'gym';
  const typeLabel = isGym
    ? t('صالة · جديد','Gym · Neu','Gym · New')
    : t('كاليستانيكس · جديد','Calisthenics · Neu','Calisthenics · New');
  const card = document.createElement('div');
  card.className = 'ex-card';
  card.innerHTML = `
    <div class="ex-type ${type}">${typeLabel}</div>
    <div class="ex-name">${t('اسم التمرين','Übungsname','Exercise name')}</div>
    <div class="ex-detail">${t('وصف التمرين والتقنية','Übungsbeschreibung','Exercise description')}</div>
    <div class="ex-sets">
      <span class="set-badge ${type}">3 × 10</span>
      <span class="set-badge ${type}">${t('راحة 90 ثا','90 Sek Pause','90 sec rest')}</span>
    </div>`;
  gridEl.appendChild(card);
  /* attach delete btn since edit mode is on */
  toggleDeleteBtn(card, true, deleteExCard);
  /* attach click listeners to new elements */
  EDITABLE_SELECTORS.forEach(sel => {
    $$(sel, card).forEach(el => {
      if (isSkippable(el) || el.dataset.editBound) return;
      el.addEventListener('click', onEditableClick);
      el.dataset.editBound = '1';
      el.classList.add('editable-hover');
    });
  });
  save();
}

/* ── Add new week session ─────────────────────────────────── */
function addSession(dayBodyEl, type) {
  const labels = {
    gym:  t('🏋️ صالة\nتمرين جديد','🏋️ Gym\nNeue Einheit','🏋️ Gym\nNew session'),
    cali: t('🤸 كاليستانيكس\nتمرين جديد','🤸 Calisthenics\nNeue Einheit','🤸 Calisthenics\nNew session'),
    run:  t('🏃 جري\nمسافة جديدة','🏃 Laufen\nNeue Strecke','🏃 Running\nNew distance'),
    rest: t('😴 راحة','😴 Ruhe','😴 Rest'),
  };
  const span = document.createElement('span');
  span.className = `session ${type}`;
  span.innerHTML = (labels[type] || '').replace(/\n/g, '<br>');
  dayBodyEl.appendChild(span);
  toggleDeleteBtn(span, true, el => el.remove());
  /* make clickable */
  if (!span.dataset.editBound) {
    span.addEventListener('click', onEditableClick);
    span.dataset.editBound = '1';
    span.classList.add('editable-hover');
  }
  save();
}

/* ── Add new tip ──────────────────────────────────────────── */
function addTip(containerEl) {
  const tip = document.createElement('div');
  tip.className = 'tip';
  tip.innerHTML = `<div class="tip-icon">💡</div>
    <div class="tip-text"><strong>${t('عنوان','Titel','Title')}:</strong> ${t('النص هنا','Text hier','Text here')}</div>`;
  containerEl.appendChild(tip);
  toggleDeleteBtn(tip, true, el => el.remove());
  EDITABLE_SELECTORS.forEach(sel => {
    $$(sel, tip).forEach(el => {
      if (isSkippable(el) || el.dataset.editBound) return;
      el.addEventListener('click', onEditableClick);
      el.dataset.editBound = '1';
      el.classList.add('editable-hover');
    });
  });
  save();
}

/* ── Add new marathon item ────────────────────────────────── */
function addMarathonItem(timelineEl) {
  const item = document.createElement('div');
  item.className = 'mt-item';
  item.innerHTML = `
    <div class="mt-month">${t('الشهر / Monat / Month','Monat / Month','Month')}</div>
    <div class="mt-focus">${t('الهدف','Ziel','Goal')}</div>
    <div class="mt-detail">${t('التفاصيل هنا','Details hier','Details here')}</div>
    <div class="mt-km">0 km</div>`;
  timelineEl.appendChild(item);
  toggleDeleteBtn(item, true, el => el.remove());
  EDITABLE_SELECTORS.forEach(sel => {
    $$(sel, item).forEach(el => {
      if (isSkippable(el) || el.dataset.editBound) return;
      el.addEventListener('click', onEditableClick);
      el.dataset.editBound = '1';
      el.classList.add('editable-hover');
    });
  });
  save();
}

/* ── Add new meal item ────────────────────────────────────── */
function addMealItem(mealBodyEl) {
  const item = document.createElement('div');
  item.className = 'meal-item';
  item.innerHTML = `
    <div class="meal-time">00:00 · ${t('وقت','Zeit','Time')}</div>
    <div class="meal-name">${t('اسم الوجبة','Mahlzeitenname','Meal name')}</div>
    <div class="meal-desc">${t('وصف الوجبة','Beschreibung','Description')}</div>
    <div class="kcal-badge">~0 kcal</div>`;
  mealBodyEl.classList.add('open');
  mealBodyEl.appendChild(item);
  toggleDeleteBtn(item, true, el => el.remove());
  EDITABLE_SELECTORS.forEach(sel => {
    $$(sel, item).forEach(el => {
      if (isSkippable(el) || el.dataset.editBound) return;
      el.addEventListener('click', onEditableClick);
      el.dataset.editBound = '1';
      el.classList.add('editable-hover');
    });
  });
  save();
}

/* ── Add new checklist item ───────────────────────────────── */
function addChecklistItem(listEl) {
  const li = document.createElement('li');
  li.innerHTML = `<strong>${t('عنصر جديد','Neuer Punkt','New item')}:</strong> ${t('التفاصيل','Details','Details')}`;
  listEl.appendChild(li);
  toggleDeleteBtn(li, true, el => el.remove());
  if (!li.dataset.editBound) {
    li.addEventListener('click', onEditableClick);
    li.dataset.editBound = '1';
    li.classList.add('editable-hover');
  }
  save();
}

/* ── Add new phase card ───────────────────────────────────── */
function addPhase(timelineEl) {
  const num = $$('.phase', timelineEl).length + 1;
  const colors = ['--gym','--cal','--run','--food'];
  const cls    = ['p1','p2','p3','p4'];
  const idx    = Math.min(num - 1, 3);
  const div = document.createElement('div');
  div.className = `phase ${cls[idx]}`;
  div.innerHTML = `
    <div class="phase-num">0${num}</div>
    <div class="phase-label">${t('المرحلة','Phase','Phase')} ${num}</div>
    <h3>${t('عنوان المرحلة','Phasentitel','Phase title')}</h3>
    <p>${t('وصف المرحلة والتواريخ','Phasenbeschreibung','Phase description & dates')}</p>
    <div class="progress-bar"><div class="progress-fill" style="width:50%;background:var(${colors[idx]})"></div></div>`;
  timelineEl.appendChild(div);
  toggleDeleteBtn(div, true, deletePhase);
  EDITABLE_SELECTORS.forEach(sel => {
    $$(sel, div).forEach(el => {
      if (isSkippable(el) || el.dataset.editBound) return;
      el.addEventListener('click', onEditableClick);
      el.dataset.editBound = '1';
      el.classList.add('editable-hover');
    });
  });
  save();
}

/* ══════════════════════════════════════════════════════════
   INJECT ADD-BUTTONS into every section
   ══════════════════════════════════════════════════════════ */

function injectAddButtons() {

  /* ── Overview: add phase + add tip ── */
  $$('.timeline').forEach(tl => {
    if (tl.dataset.addInjected) return;
    tl.dataset.addInjected = '1';
    const btn = mkAddBtn(
      t('+ مرحلة','+ Phase','+ Phase'),
      () => addPhase(tl)
    );
    tl.parentElement.insertBefore(btn, tl.nextSibling);
  });

  /* Tip containers per [data-lang] block — add tip button after last tip */
  $$('[data-lang] .tip:last-of-type').forEach(tip => {
    const container = tip.parentElement;
    if (container.dataset.tipAddInjected) return;
    container.dataset.tipAddInjected = '1';
    const btn = mkAddBtn(
      t('+ نصيحة جديدة','+ Tipp hinzufügen','+ Add tip'),
      () => addTip(container)
    );
    container.insertBefore(btn, tip.nextSibling);
  });

  /* ── Weekly: add session per day-body ── */
  $$('.day-body').forEach(db => {
    if (db.dataset.addInjected) return;
    db.dataset.addInjected = '1';
    const mini = document.createElement('div');
    mini.className = 'day-add-btns';
    ['gym','cali','run','rest'].forEach(type => {
      const b = document.createElement('button');
      b.className = 'mini-add-btn';
      b.textContent = { gym:'🏋️', cali:'🤸', run:'🏃', rest:'😴' }[type];
      b.title = type;
      b.addEventListener('click', e => { e.stopPropagation(); addSession(db, type); });
      mini.appendChild(b);
    });
    db.appendChild(mini);
  });

  /* ── Exercises: add gym / cali card per ex-grid ── */
  $$('.ex-grid').forEach(grid => {
    if (grid.dataset.addInjected) return;
    grid.dataset.addInjected = '1';
    const wrap = document.createElement('div');
    wrap.className = 'ex-add-wrap';

    const bgym = mkAddBtn(t('+ صالة','+ Gym','+ Gym'), () => addExerciseCard(grid, 'gym'));
    bgym.classList.add('gym-add');
    const bcal = mkAddBtn(t('+ كاليستانيكس','+ Calisthenics','+ Calisthenics'), () => addExerciseCard(grid, 'cali'));
    bcal.classList.add('cali-add');

    wrap.appendChild(bgym);
    wrap.appendChild(bcal);
    grid.parentElement.insertBefore(wrap, grid.nextSibling);
  });

  /* ── Nutrition: add meal item per meal-body ── */
  $$('.meal-body').forEach(mb => {
    if (mb.dataset.addInjected) return;
    mb.dataset.addInjected = '1';
    const btn = mkAddBtn(
      t('+ وجبة','+ Mahlzeit','+ Meal'),
      () => addMealItem(mb)
    );
    mb.parentElement.appendChild(btn);
  });

  /* ── Nutrition: add checklist item ── */
  $$('.checklist').forEach(cl => {
    if (cl.dataset.addInjected) return;
    cl.dataset.addInjected = '1';
    const btn = mkAddBtn(
      t('+ عنصر','+ Eintrag','+ Item'),
      () => addChecklistItem(cl)
    );
    cl.parentElement.insertBefore(btn, cl.nextSibling);
  });

  /* ── Marathon: add item ── */
  $$('.marathon-timeline').forEach(mt => {
    if (mt.dataset.addInjected) return;
    mt.dataset.addInjected = '1';
    const btn = mkAddBtn(
      t('+ إضافة مرحلة','+ Etappe hinzufügen','+ Add stage'),
      () => addMarathonItem(mt)
    );
    mt.parentElement.insertBefore(btn, mt.nextSibling);
  });
}

function mkAddBtn(label, handler) {
  const btn = document.createElement('button');
  btn.className   = 'section-add-btn';
  btn.textContent = label;
  btn.style.display = 'none'; // hidden until edit mode
  btn.addEventListener('click', e => { e.stopPropagation(); handler(); });
  return btn;
}

/* ══════════════════════════════════════════════════════════
   PERSIST & RESTORE STATE
   ══════════════════════════════════════════════════════════ */

/* Collect: walk every editable element, record innerText keyed by a path */
function collectState() {
  const state = { lang: currentLang, tab: currentTab, texts: {} };
  EDITABLE_SELECTORS.forEach(sel => {
    $$(sel).forEach((el, i) => {
      if (isSkippable(el)) return;
      const key = `${sel}::${i}`;
      state.texts[key] = el.innerHTML;
    });
  });
  /* budget grid */
  ['ar','de','en'].forEach(lang => {
    const grid = document.getElementById('budget-grid-' + lang);
    if (!grid) return;
    state['budget_' + lang] = Array.from(grid.querySelectorAll('.budget-item')).map(item => ({
      cat:  item.querySelector('.budget-cat')      ?.innerHTML || '',
      val:  item.querySelector('.budget-val-text') ?.innerHTML || '',
      desc: item.querySelector('.budget-desc')     ?.innerHTML || '',
    }));
  });
  return state;
}

function restoreState(state) {
  if (!state) return;
  if (state.texts) {
    EDITABLE_SELECTORS.forEach(sel => {
      $$(sel).forEach((el, i) => {
        if (isSkippable(el)) return;
        const key = `${sel}::${i}`;
        if (state.texts[key] !== undefined) el.innerHTML = state.texts[key];
      });
    });
  }
  /* budget */
  ['ar','de','en'].forEach(lang => {
    const key  = 'budget_' + lang;
    const grid = document.getElementById('budget-grid-' + lang);
    if (!state[key] || !grid) return;
    /* remove current editable items and re-render saved ones */
    $$('.budget-item.editable', grid).forEach(el => el.remove());
    state[key].forEach(item => {
      const removeText = lang === 'ar' ? 'حذف' : lang === 'de' ? 'Löschen' : 'Remove';
      const div = document.createElement('div');
      div.className = 'budget-item editable';
      div.innerHTML = `
        <div class="budget-cat">${item.cat}</div>
        <div class="budget-val">
          <span class="budget-val-text" onclick="editBudget(this)">${item.val}</span>
          <button class="remove-budget-btn" onclick="removeBudgetItem(this)">${removeText}</button>
        </div>
        <div class="budget-desc">${item.desc}</div>`;
      grid.appendChild(div);
    });
  });
  /* re-activate language / tab */
  if (state.lang) {
    const btn = document.querySelector(`.lang-btn[onclick*="'${state.lang}'"]`);
    setLang(state.lang, btn);
  }
  if (state.tab) setTab(state.tab);
}

/* ── Stats bar quick-edit (always visible) ────────────────── */
function initStatsEdit() {
  $$('.stat-val').forEach(el => {
    el.style.cursor = 'pointer';
    el.title = t('انقر للتعديل','Klicken zum Bearbeiten','Click to edit');
    el.addEventListener('dblclick', () => {
      const orig = el.textContent;
      const inp = document.createElement('input');
      inp.className = 'stat-edit-input';
      inp.value = orig;
      inp.addEventListener('keydown', e => {
        if (e.key === 'Enter') { el.textContent = inp.value || orig; el.innerHTML = el.textContent; inp.remove(); save(); }
        if (e.key === 'Escape') { inp.remove(); }
      });
      inp.addEventListener('blur', () => { el.textContent = inp.value || orig; inp.remove(); save(); });
      el.textContent = '';
      el.appendChild(inp);
      inp.focus(); inp.select();
    });
  });
}

/* ══════════════════════════════════════════════════════════
   LEGACY BUDGET FUNCTIONS (kept for backward compat.)
   ══════════════════════════════════════════════════════════ */

function editBudget(el) {
  const valSpan = el.parentElement;
  if (valSpan.querySelector('.budget-edit-input')) return;
  const currentVal = el.textContent;
  const input = document.createElement('input');
  input.className = 'budget-edit-input';
  input.type  = 'text';
  input.value = currentVal;
  input.onblur    = () => saveBudgetValue(input, el, currentVal);
  input.onkeydown = e => {
    if (e.key === 'Enter')  saveBudgetValue(input, el, currentVal);
    if (e.key === 'Escape') { input.remove(); el.style.display = 'inline-block'; }
  };
  el.style.display = 'none';
  valSpan.insertBefore(input, el.nextSibling);
  input.focus(); input.select();
}

function saveBudgetValue(input, el, oldVal) {
  el.textContent = input.value || oldVal;
  input.remove();
  el.style.display = 'inline-block';
  save();
}

function showSuggestions(lang) {
  const div = document.getElementById('suggestions-' + lang);
  if (div) div.style.display = div.style.display === 'none' ? 'grid' : 'none';
}

function addBudgetItem(lang, cat, val, desc) {
  const grid = document.getElementById('budget-grid-' + lang);
  if (!grid) return;
  const removeText = lang === 'ar' ? 'حذف' : lang === 'de' ? 'Löschen' : 'Remove';
  const item = document.createElement('div');
  item.className = 'budget-item editable';
  item.innerHTML = `
    <div class="budget-cat">${cat}</div>
    <div class="budget-val">
      <span class="budget-val-text" onclick="editBudget(this)">${val}</span>
      <button class="remove-budget-btn" onclick="removeBudgetItem(this)">${removeText}</button>
    </div>
    <div class="budget-desc">${desc}</div>`;
  grid.appendChild(item);
  const sugg = document.getElementById('suggestions-' + lang);
  if (sugg) sugg.style.display = 'none';
  save();
}

function removeBudgetItem(btn) { btn.closest('.budget-item').remove(); save(); }

function saveBudgetChanges() {
  save();
  showSaveToast();
}

/* ── Toast notification ───────────────────────────────────── */
function showSaveToast() {
  let toast = document.getElementById('save-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'save-toast';
    document.body.appendChild(toast);
  }
  toast.textContent = t('✅ تم الحفظ!','✅ Gespeichert!','✅ Saved!');
  toast.classList.add('show');
  clearTimeout(toast._t);
  toast._t = setTimeout(() => toast.classList.remove('show'), 2200);
}

/* ── Reset to default ─────────────────────────────────────── */
function resetPlan() {
  const msg = t(
    'هل تريد حذف جميع التعديلات والعودة للخطة الأصلية؟',
    'Alle Änderungen löschen und zum Original zurückkehren?',
    'Delete all edits and restore the original plan?'
  );
  if (!confirm(msg)) return;
  localStorage.removeItem(STORE_KEY);
  location.reload();
}

/* ── Edit mode toolbar (injected into lang-bar) ───────────── */
function injectEditToolbar() {
  const bar = document.querySelector('.lang-bar');
  if (!bar || document.getElementById('edit-mode-btn')) return;

  const sep = document.createElement('div');
  sep.className = 'toolbar-sep';

  const editBtn = document.createElement('button');
  editBtn.id        = 'edit-mode-btn';
  editBtn.className = 'edit-mode-btn';
  editBtn.textContent = t('✏️ تعديل الخطة','✏️ Plan bearbeiten','✏️ Edit plan');
  editBtn.addEventListener('click', toggleEditMode);

  const resetBtn = document.createElement('button');
  resetBtn.className   = 'edit-mode-btn reset-btn';
  resetBtn.textContent = t('↺ إعادة تعيين','↺ Zurücksetzen','↺ Reset');
  resetBtn.addEventListener('click', resetPlan);

  bar.appendChild(sep);
  bar.appendChild(editBtn);
  bar.appendChild(resetBtn);
}

/* ══════════════════════════════════════════════════════════
   BOOT
   ══════════════════════════════════════════════════════════ */

window.addEventListener('load', () => {
  injectEditToolbar();
  injectAddButtons();
  initStatsEdit();

  /* restore saved state */
  const raw = localStorage.getItem(STORE_KEY);
  if (raw) {
    try { restoreState(JSON.parse(raw)); }
    catch(e) { console.warn('Restore failed', e); }
  }

  /* progress bar animation */
  setTimeout(() => {
    $$('.progress-fill').forEach(bar => {
      const w = bar.style.width;
      bar.style.width = '0';
      setTimeout(() => bar.style.width = w, 100);
    });
  }, 300);
});