let currentLang = 'ar';
let currentTab = 'overview';

// SPRACHSTEUERUNG
function setLang(lang, btn) {
  currentLang = lang;
  document.querySelectorAll('.lang-btn').forEach(b => b.classList.remove('active'));
  if(btn) btn.classList.add('active');
  
  // Sprachblöcke anzeigen/verbergen
  document.querySelectorAll('[data-lang]').forEach(el => {
    el.classList.toggle('show', el.dataset.lang === lang);
  });
  document.querySelectorAll('[data-lang-inline]').forEach(el => {
    el.classList.toggle('show', el.dataset.langInline === lang);
  });
  
  // Hero-Untertitel dynamisch anpassen
  const subs = {
    ar: 'خطتك الكاملة | الصالة + كاليستانيكس + ماراتون', 
    de: 'Dein kompletter Plan | Gym + Calisthenics + Marathon', 
    en: 'Your complete plan | Gym + Calisthenics + Marathon'
  };
  document.getElementById('hero-sub').textContent = subs[lang];
  
  // Textrichtung des Dokuments anpassen (RTL für Arabisch, LTR für andere)
  document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
  document.documentElement.lang = lang;
}

// TAB-WECHSEL
function setTab(tab) {
  currentTab = tab;
  document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  document.getElementById('sec-' + tab).classList.add('active');
  document.getElementById('tab-' + tab).classList.add('active');
}

// AKKORDION FÜR ERNÄHRUNGS-MAHLZEITEN
function toggleMeal(head) {
  const body = head.nextElementSibling;
  const isOpen = body.classList.contains('open');
  body.classList.toggle('open', !isOpen);
  head.classList.toggle('open-head', !isOpen);
}

// BUDGET EDITIER-MODUS (IN-LINE EDIT)
function editBudget(el) {
  const valSpan = el.parentElement;
  const currentVal = el.textContent;
  if (valSpan.querySelector('.budget-edit-input')) return; // Bereits im Edit-Modus
  
  const input = document.createElement('input');
  input.className = 'budget-edit-input';
  input.type = 'text';
  input.value = currentVal;
  input.onblur = () => saveBudgetValue(input, el, currentVal);
  input.onkeypress = (e) => {
    if (e.key === 'Enter') saveBudgetValue(input, el, currentVal);
  };
  
  el.style.display = 'none';
  valSpan.insertBefore(input, el.nextSibling);
  input.focus();
  input.select();
}

function saveBudgetValue(input, el, oldVal) {
  el.textContent = input.value || oldVal;
  input.remove();
  el.style.display = 'inline-block';
}

// VORSCHLÄGE ANZEIGEN
function showSuggestions(lang, btn) {
  const suggestionsDiv = document.getElementById('suggestions-' + lang);
  suggestionsDiv.style.display = suggestionsDiv.style.display === 'none' ? 'grid' : 'none';
}

// NEUEN BUDGET-EINTRAG HINZUFÜGEN
function addBudgetItem(lang, cat, val, desc) {
  const grid = document.getElementById('budget-grid-' + lang);
  const item = document.createElement('div');
  item.className = 'budget-item editable';
  const removeText = lang === 'ar' ? 'حذف' : lang === 'de' ? 'Löschen' : 'Remove';
  
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

// LOCALSTORAGE PERSISTENZ FÜR BUDGET DATA
function saveBudgetChanges() {
  const budgetData = {};
  ['ar', 'de', 'en'].forEach(lang => {
    const items = document.querySelectorAll('#budget-grid-' + lang + ' .budget-item');
    budgetData[lang] = Array.from(items).map(item => ({
      cat: item.querySelector('.budget-cat').textContent,
      val: item.querySelector('.budget-val-text').textContent,
      desc: item.querySelector('.budget-desc').textContent
    }));
  });
  localStorage.setItem('budgetData', JSON.stringify(budgetData));
  
  // Sprachabhängiges Alert-Feedback
  alert(currentLang === 'ar' ? '✅ تم حفظ التغييرات!' : currentLang === 'de' ? '✅ Änderungen gespeichert!' : '✅ Changes saved!');
}

function loadBudgetChanges() {
  const saved = localStorage.getItem('budgetData');
  if (!saved) return;
  const budgetData = JSON.parse(saved);
  
  ['ar', 'de', 'en'].forEach(lang => {
    if (!budgetData[lang]) return;
    const grid = document.getElementById('budget-grid-' + lang);
    grid.innerHTML = '';
    budgetData[lang].forEach(item => {
      const div = document.createElement('div');
      div.className = 'budget-item editable';
      const removeBtn = lang === 'ar' ? 'حذف' : lang === 'de' ? 'Löschen' : 'Remove';
      div.innerHTML = `
        <div class="budget-cat">${item.cat}</div>
        <div class="budget-val">
          <span class="budget-val-text" onclick="editBudget(this)">${item.val}</span>
          <button class="remove-budget-btn" onclick="removeBudgetItem(this)">${removeBtn}</button>
        </div>
        <div class="budget-desc">${item.desc}</div>
      `;
      grid.appendChild(div);
    });
  });
}

// INITIALISIERUNG BEIM LADEN DER SEITE
window.addEventListener('load', () => {
  loadBudgetChanges();
  // Animiert die Ladebalken im Overview-Tab sanft beim Start
  setTimeout(() => {
    document.querySelectorAll('.progress-fill').forEach(bar => {
      const w = bar.style.width;
      bar.style.width = '0';
      setTimeout(() => bar.style.width = w, 100);
    });
  }, 300);
});