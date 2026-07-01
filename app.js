// ============================================================
// App de estudos CLF-C02 — lógica geral
// ============================================================

const FLASH_STORAGE_KEY = 'clfc02_progress_v1';
const EXAM_STATS_KEY = 'clfc02_exam_stats_v1';
const COURSE_STORAGE_KEY = 'clfc02_course_progress_v1';

// ---------- Utilitários compartilhados ----------
function loadJSON(key, fallback){
  try{
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  }catch(e){ return fallback; }
}
function saveJSON(key, value){
  localStorage.setItem(key, JSON.stringify(value));
}
function shuffleArray(arr){
  const a = arr.slice();
  for(let i = a.length - 1; i > 0; i--){
    const j = Math.floor(Math.random() * (i+1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ---------- Navegação por abas ----------
document.getElementById('tabs').addEventListener('click', (e)=>{
  const btn = e.target.closest('.tab-btn');
  if(!btn) return;
  [...document.querySelectorAll('.tab-btn')].forEach(b=>b.classList.remove('active'));
  btn.classList.add('active');
  const view = btn.dataset.view;
  [...document.querySelectorAll('.view')].forEach(v=>v.classList.remove('active'));
  document.getElementById('view-' + view).classList.add('active');
  if(view === 'weak') renderWeakAreas();
  if(view === 'glossary' && !glossaryRendered) renderGlossary(GLOSSARY);
  if(view === 'cheatsheet' && !cheatsheetRendered) renderCheatsheet();
});

// ---------- Barra de peso (header) ----------
function buildWeightBar(){
  const bar = document.getElementById('weightBar');
  const legend = document.getElementById('weightLegend');
  bar.innerHTML = '';
  legend.innerHTML = '';
  Object.entries(DOMAINS).forEach(([id, dom])=>{
    const seg = document.createElement('div');
    seg.className = 'weight-seg';
    seg.style.width = dom.weight + '%';
    seg.style.background = dom.color;
    seg.id = 'seg-' + id;
    bar.appendChild(seg);

    const item = document.createElement('div');
    item.className = 'weight-legend-item';
    item.innerHTML = `<span class="dot" style="background:${dom.color}"></span>D${id} · ${dom.short} (${dom.weight}%)`;
    legend.appendChild(item);
  });
  updateWeightBarFill();
}
function updateWeightBarFill(){
  const progress = loadJSON(FLASH_STORAGE_KEY, {});
  Object.entries(DOMAINS).forEach(([id, dom])=>{
    const domCards = CARDS.filter(c => c.d === Number(id));
    const known = domCards.filter(c => progress[c.id] === 'known').length;
    const pct = domCards.length ? Math.round((known / domCards.length) * 100) : 0;
    const seg = document.getElementById('seg-' + id);
    if(seg){
      let fill = seg.querySelector('.weight-seg-fill');
      if(!fill){
        fill = document.createElement('div');
        fill.className = 'weight-seg-fill';
        seg.appendChild(fill);
      }
      fill.style.width = pct + '%';
    }
  });
}

// ============================================================
// FLASHCARDS
// ============================================================
let fcState = {
  filter: 'all',
  deck: [],
  pos: 0,
  flipped: false,
  progress: loadJSON(FLASH_STORAGE_KEY, {})
};

function cardsByDomain(d){ return CARDS.filter(c => c.d === d); }

function buildChips(){
  const chips = document.getElementById('chips');
  chips.innerHTML = '';
  const allChip = document.createElement('button');
  allChip.className = 'chip active';
  allChip.textContent = `Todos (${CARDS.length})`;
  allChip.dataset.filter = 'all';
  chips.appendChild(allChip);

  Object.entries(DOMAINS).forEach(([id, dom])=>{
    const n = cardsByDomain(Number(id)).length;
    const chip = document.createElement('button');
    chip.className = 'chip';
    chip.textContent = `D${id} (${n})`;
    chip.dataset.filter = id;
    chips.appendChild(chip);
  });

  chips.addEventListener('click', (e)=>{
    const btn = e.target.closest('.chip');
    if(!btn) return;
    [...chips.children].forEach(c=>c.classList.remove('active'));
    btn.classList.add('active');
    fcState.filter = btn.dataset.filter === 'all' ? 'all' : Number(btn.dataset.filter);
    rebuildDeck();
  });
}

function rebuildDeck(){
  const source = fcState.filter === 'all' ? CARDS : cardsByDomain(fcState.filter);
  fcState.deck = source.map(c => c.id);
  fcState.pos = 0;
  fcState.flipped = false;
  renderCard();
}
function shuffleDeck(){
  fcState.deck = shuffleArray(fcState.deck);
  fcState.pos = 0;
  fcState.flipped = false;
  renderCard();
}
function currentCard(){
  const id = fcState.deck[fcState.pos];
  return CARDS.find(c => c.id === id);
}
function renderCard(){
  const card = currentCard();
  if(!card) return;
  document.getElementById('frontText').textContent = card.q;
  document.getElementById('backText').textContent = card.a;
  document.getElementById('counter').textContent = `Card ${fcState.pos+1} de ${fcState.deck.length}`;
  const tag = document.getElementById('domainTag');
  tag.textContent = `D${card.d} · ${DOMAINS[card.d].short}`;
  tag.style.color = DOMAINS[card.d].color;
  document.getElementById('card').classList.toggle('flipped', fcState.flipped);
  renderFlashStats();
}
function flipCard(){
  fcState.flipped = !fcState.flipped;
  document.getElementById('card').classList.toggle('flipped', fcState.flipped);
}
function nextCard(){
  fcState.pos = (fcState.pos + 1) % fcState.deck.length;
  fcState.flipped = false;
  renderCard();
}
function prevCard(){
  fcState.pos = (fcState.pos - 1 + fcState.deck.length) % fcState.deck.length;
  fcState.flipped = false;
  renderCard();
}
function markCard(status){
  const card = currentCard();
  fcState.progress[card.id] = status;
  saveJSON(FLASH_STORAGE_KEY, fcState.progress);
  nextCard();
  updateWeightBarFill();
  scheduleSync();
}
function renderFlashStats(){
  const grid = document.getElementById('statsGrid');
  grid.innerHTML = '';
  const totalKnown = Object.values(fcState.progress).filter(v=>v==='known').length;
  const totalSeen = Object.keys(fcState.progress).length;

  const overall = document.createElement('div');
  overall.className = 'stat-box';
  overall.innerHTML = `<div class="label">No geral</div><div class="value">${totalKnown}/${CARDS.length} já sei</div>`;
  grid.appendChild(overall);

  const seen = document.createElement('div');
  seen.className = 'stat-box';
  seen.innerHTML = `<div class="label">Cards revisados</div><div class="value">${totalSeen}/${CARDS.length}</div>`;
  grid.appendChild(seen);
}
function resetFlashProgress(){
  if(!confirm('Isso vai apagar o progresso dos flashcards. Confirmar?')) return;
  fcState.progress = {};
  saveJSON(FLASH_STORAGE_KEY, fcState.progress);
  renderFlashStats();
  updateWeightBarFill();
  scheduleSync();
}

document.getElementById('card').addEventListener('click', flipCard);
document.getElementById('flipBtn').addEventListener('click', flipCard);
document.getElementById('nextBtn').addEventListener('click', nextCard);
document.getElementById('prevBtn').addEventListener('click', prevCard);
document.getElementById('shuffleBtn').addEventListener('click', shuffleDeck);
document.getElementById('knowBtn').addEventListener('click', ()=>markCard('known'));
document.getElementById('reviewBtn').addEventListener('click', ()=>markCard('review'));
document.getElementById('resetBtn').addEventListener('click', resetFlashProgress);

document.addEventListener('keydown', (e)=>{
  if(!document.getElementById('view-flashcards').classList.contains('active')) return;
  if(e.code === 'Space'){ e.preventDefault(); flipCard(); }
  if(e.code === 'ArrowRight'){ nextCard(); }
  if(e.code === 'ArrowLeft'){ prevCard(); }
  if(e.code === 'KeyK'){ markCard('known'); }
  if(e.code === 'KeyR'){ markCard('review'); }
});

// ============================================================
// FLASHCARDS DO CURSO RE/START (módulos, não domínios de prova)
// ============================================================
let ccState = {
  filter: 'all',
  deck: [],
  pos: 0,
  flipped: false,
  progress: loadJSON(COURSE_STORAGE_KEY, {})
};

function courseCardsByModule(m){ return COURSE_CARDS.filter(c => c.m === m); }

function buildCourseChips(){
  const chips = document.getElementById('courseChips');
  chips.innerHTML = '';
  const allChip = document.createElement('button');
  allChip.className = 'chip active';
  allChip.textContent = `Todos (${COURSE_CARDS.length})`;
  allChip.dataset.filter = 'all';
  chips.appendChild(allChip);

  Object.entries(COURSE_MODULES).forEach(([id, mod])=>{
    const n = courseCardsByModule(Number(id)).length;
    const chip = document.createElement('button');
    chip.className = 'chip';
    chip.textContent = `M${id} (${n})`;
    chip.title = mod.name;
    chip.dataset.filter = id;
    chips.appendChild(chip);
  });

  chips.addEventListener('click', (e)=>{
    const btn = e.target.closest('.chip');
    if(!btn) return;
    [...chips.children].forEach(c=>c.classList.remove('active'));
    btn.classList.add('active');
    ccState.filter = btn.dataset.filter === 'all' ? 'all' : Number(btn.dataset.filter);
    rebuildCourseDeck();
  });
}

function rebuildCourseDeck(){
  const source = ccState.filter === 'all' ? COURSE_CARDS : courseCardsByModule(ccState.filter);
  ccState.deck = source.map(c => c.id);
  ccState.pos = 0;
  ccState.flipped = false;
  renderCourseCard();
}
function shuffleCourseDeck(){
  ccState.deck = shuffleArray(ccState.deck);
  ccState.pos = 0;
  ccState.flipped = false;
  renderCourseCard();
}
function currentCourseCard(){
  const id = ccState.deck[ccState.pos];
  return COURSE_CARDS.find(c => c.id === id);
}
function renderCourseCard(){
  const card = currentCourseCard();
  if(!card) return;
  document.getElementById('courseFrontText').textContent = card.q;
  document.getElementById('courseBackText').textContent = card.a;
  document.getElementById('courseCounter').textContent = `Card ${ccState.pos+1} de ${ccState.deck.length}`;
  const tag = document.getElementById('courseModuleTag');
  tag.textContent = `M${card.m} · ${COURSE_MODULES[card.m].name}`;
  tag.style.color = COURSE_MODULES[card.m].color;
  document.getElementById('courseCard').classList.toggle('flipped', ccState.flipped);
  renderCourseStats();
}
function flipCourseCard(){
  ccState.flipped = !ccState.flipped;
  document.getElementById('courseCard').classList.toggle('flipped', ccState.flipped);
}
function nextCourseCard(){
  ccState.pos = (ccState.pos + 1) % ccState.deck.length;
  ccState.flipped = false;
  renderCourseCard();
}
function prevCourseCard(){
  ccState.pos = (ccState.pos - 1 + ccState.deck.length) % ccState.deck.length;
  ccState.flipped = false;
  renderCourseCard();
}
function markCourseCard(status){
  const card = currentCourseCard();
  ccState.progress[card.id] = status;
  saveJSON(COURSE_STORAGE_KEY, ccState.progress);
  nextCourseCard();
  scheduleSync();
}
function renderCourseStats(){
  const grid = document.getElementById('courseStatsGrid');
  grid.innerHTML = '';
  const totalKnown = Object.values(ccState.progress).filter(v=>v==='known').length;
  const totalSeen = Object.keys(ccState.progress).length;

  const overall = document.createElement('div');
  overall.className = 'stat-box';
  overall.innerHTML = `<div class="label">No geral</div><div class="value">${totalKnown}/${COURSE_CARDS.length} já sei</div>`;
  grid.appendChild(overall);

  const seen = document.createElement('div');
  seen.className = 'stat-box';
  seen.innerHTML = `<div class="label">Cards revisados</div><div class="value">${totalSeen}/${COURSE_CARDS.length}</div>`;
  grid.appendChild(seen);
}
function resetCourseProgress(){
  if(!confirm('Isso vai apagar o progresso dos flashcards do curso. Confirmar?')) return;
  ccState.progress = {};
  saveJSON(COURSE_STORAGE_KEY, ccState.progress);
  renderCourseStats();
  scheduleSync();
}

document.getElementById('courseCard').addEventListener('click', flipCourseCard);
document.getElementById('courseFlipBtn').addEventListener('click', flipCourseCard);
document.getElementById('courseNextBtn').addEventListener('click', nextCourseCard);
document.getElementById('coursePrevBtn').addEventListener('click', prevCourseCard);
document.getElementById('courseShuffleBtn').addEventListener('click', shuffleCourseDeck);
document.getElementById('courseKnowBtn').addEventListener('click', ()=>markCourseCard('known'));
document.getElementById('courseReviewBtn').addEventListener('click', ()=>markCourseCard('review'));
document.getElementById('courseResetBtn').addEventListener('click', resetCourseProgress);

document.addEventListener('keydown', (e)=>{
  if(!document.getElementById('view-course').classList.contains('active')) return;
  if(e.code === 'Space'){ e.preventDefault(); flipCourseCard(); }
  if(e.code === 'ArrowRight'){ nextCourseCard(); }
  if(e.code === 'ArrowLeft'){ prevCourseCard(); }
  if(e.code === 'KeyK'){ markCourseCard('known'); }
  if(e.code === 'KeyR'){ markCourseCard('review'); }
});

// ============================================================
// SIMULADO
// ============================================================
const FULL_EXAM_COUNTS = {1:16, 2:19, 3:22, 4:8}; // soma 65, proporcional ao peso real
const FULL_EXAM_TIME_SEC = 90 * 60;
const DOMAIN_PRACTICE_MAX = 20;

let examState = null; // criado ao iniciar um simulado
let examDomainChoice = 1;

function buildExamDomainChips(){
  const wrap = document.getElementById('examDomainChips');
  wrap.innerHTML = '';
  Object.entries(DOMAINS).forEach(([id, dom], idx)=>{
    const n = Math.min(DOMAIN_PRACTICE_MAX, EXAM_QUESTIONS.filter(q=>q.d===Number(id)).length);
    const chip = document.createElement('button');
    chip.className = 'chip' + (idx===0 ? ' active' : '');
    chip.textContent = `D${id} (${n})`;
    chip.dataset.domain = id;
    wrap.appendChild(chip);
  });
  wrap.addEventListener('click', (e)=>{
    const btn = e.target.closest('.chip');
    if(!btn) return;
    [...wrap.children].forEach(c=>c.classList.remove('active'));
    btn.classList.add('active');
    examDomainChoice = Number(btn.dataset.domain);
  });
}

function buildFullExamQuestions(){
  let questions = [];
  Object.entries(FULL_EXAM_COUNTS).forEach(([d, count])=>{
    const pool = shuffleArray(EXAM_QUESTIONS.filter(q => q.d === Number(d)));
    questions = questions.concat(pool.slice(0, count));
  });
  return shuffleArray(questions).map(shuffleQuestionOptions);
}
function buildDomainExamQuestions(domain){
  const pool = shuffleArray(EXAM_QUESTIONS.filter(q => q.d === domain));
  return pool.slice(0, DOMAIN_PRACTICE_MAX).map(shuffleQuestionOptions);
}
function shuffleQuestionOptions(q){
  const order = shuffleArray(q.options.map((_, i) => i)); // nova ordem -> índice original
  const newOptions = order.map(i => q.options[i]);
  const newCorrect = order
    .map((origIdx, newIdx) => q.correct.includes(origIdx) ? newIdx : -1)
    .filter(i => i !== -1);
  return { ...q, options: newOptions, correct: newCorrect };
}

function startExam(mode, domain){
  const questions = mode === 'full' ? buildFullExamQuestions() : buildDomainExamQuestions(domain);
  examState = {
    mode, domain,
    questions,
    pos: 0,
    answers: {},      // qid -> array de índices selecionados
    confirmed: {},     // qid -> true depois de confirmado
    timeLeft: mode === 'full' ? FULL_EXAM_TIME_SEC : null,
    timerId: null,
    finished: false
  };
  document.getElementById('examSetup').style.display = 'none';
  document.getElementById('examResult').style.display = 'none';
  document.getElementById('examRunning').style.display = 'block';

  if(mode === 'full'){
    document.getElementById('examTimer').style.display = 'inline';
    examState.timerId = setInterval(tickExamTimer, 1000);
  } else {
    document.getElementById('examTimer').style.display = 'none';
  }
  renderExamQuestion();
}

function tickExamTimer(){
  examState.timeLeft--;
  const timerEl = document.getElementById('examTimer');
  const m = Math.floor(examState.timeLeft / 60);
  const s = examState.timeLeft % 60;
  timerEl.textContent = `${m}:${String(s).padStart(2,'0')} restantes`;
  timerEl.classList.toggle('low', examState.timeLeft <= 300);
  if(examState.timeLeft <= 0){
    clearInterval(examState.timerId);
    finishExam();
  }
}

function currentExamQuestion(){
  return examState.questions[examState.pos];
}

function renderExamQuestion(){
  const q = currentExamQuestion();
  const total = examState.questions.length;
  document.getElementById('examCounter').textContent = `Questão ${examState.pos+1} de ${total}`;
  document.getElementById('examProgressFill').style.width = (((examState.pos+1)/total)*100) + '%';
  document.getElementById('examDomainTag').textContent = `D${q.d} · ${DOMAINS[q.d].short}`;
  document.getElementById('examDomainTag').style.color = DOMAINS[q.d].color;
  document.getElementById('examTypeTag').textContent = q.type === 'multi' ? 'Múltipla resposta' : 'Escolha única';
  document.getElementById('examQText').textContent = q.q;
  document.getElementById('examMultiHint').style.display = q.type === 'multi' ? 'block' : 'none';

  const optionsWrap = document.getElementById('examOptions');
  optionsWrap.innerHTML = '';
  const selected = examState.answers[q.id] || [];
  const confirmed = !!examState.confirmed[q.id];

  q.options.forEach((opt, i)=>{
    const div = document.createElement('div');
    div.className = 'option';
    if(selected.includes(i)) div.classList.add('selected');
    if(confirmed){
      if(q.correct.includes(i)) div.classList.add('correct');
      else if(selected.includes(i)) div.classList.add('incorrect');
    }
    const input = document.createElement('input');
    input.type = q.type === 'multi' ? 'checkbox' : 'radio';
    input.name = 'opt';
    input.checked = selected.includes(i);
    input.disabled = confirmed;
    const span = document.createElement('span');
    span.textContent = opt;
    div.appendChild(input);
    div.appendChild(span);
    if(!confirmed){
      div.addEventListener('click', ()=> toggleOption(q, i));
    }
    optionsWrap.appendChild(div);
  });

  const explainEl = document.getElementById('examExplain');
  if(confirmed){
    const wasCorrect = arraysEqualAsSets(selected, q.correct);
    explainEl.innerHTML = `<b>${wasCorrect ? 'Certo ✓' : 'Errado ✗'}</b> — ${q.explain}`;
    explainEl.classList.add('show');
  } else {
    explainEl.classList.remove('show');
    explainEl.innerHTML = '';
  }

  const nextBtn = document.getElementById('examNextBtn');
  if(!confirmed){
    nextBtn.textContent = 'Confirmar';
  } else if(examState.pos === total - 1){
    nextBtn.textContent = 'Ver resultado';
  } else {
    nextBtn.textContent = 'Próxima questão →';
  }
  document.getElementById('examPrevBtn').disabled = examState.pos === 0;
}

function toggleOption(q, i){
  if(examState.confirmed[q.id]) return;
  let sel = examState.answers[q.id] || [];
  if(q.type === 'multi'){
    sel = sel.includes(i) ? sel.filter(x=>x!==i) : [...sel, i];
  } else {
    sel = [i];
  }
  examState.answers[q.id] = sel;
  renderExamQuestion();
}

function arraysEqualAsSets(a, b){
  if(a.length !== b.length) return false;
  const sa = [...a].sort(); const sb = [...b].sort();
  return sa.every((v,i)=>v===sb[i]);
}

document.getElementById('examNextBtn').addEventListener('click', ()=>{
  const q = currentExamQuestion();
  if(!examState.confirmed[q.id]){
    if(!examState.answers[q.id] || examState.answers[q.id].length === 0) return; // exige seleção
    examState.confirmed[q.id] = true;
    renderExamQuestion();
    return;
  }
  if(examState.pos < examState.questions.length - 1){
    examState.pos++;
    renderExamQuestion();
  } else {
    finishExam();
  }
});
document.getElementById('examPrevBtn').addEventListener('click', ()=>{
  if(examState.pos > 0){
    examState.pos--;
    renderExamQuestion();
  }
});

function finishExam(){
  if(examState.timerId) clearInterval(examState.timerId);
  examState.finished = true;

  const domainStats = {1:{correct:0,total:0},2:{correct:0,total:0},3:{correct:0,total:0},4:{correct:0,total:0}};
  let correctCount = 0;
  examState.questions.forEach(q=>{
    const sel = examState.answers[q.id] || [];
    const isCorrect = examState.confirmed[q.id] && arraysEqualAsSets(sel, q.correct);
    domainStats[q.d].total++;
    if(isCorrect){ domainStats[q.d].correct++; correctCount++; }
  });
  const total = examState.questions.length;
  const pct = total ? Math.round((correctCount/total)*100) : 0;
  const scaled = Math.round(100 + (correctCount/total)*900);
  const passed = scaled >= 700;

  renderExamResult(correctCount, total, pct, scaled, passed, domainStats);

  const stats = loadJSON(EXAM_STATS_KEY, {1:{correct:0,total:0},2:{correct:0,total:0},3:{correct:0,total:0},4:{correct:0,total:0}});
  Object.keys(domainStats).forEach(d=>{
    stats[d].correct += domainStats[d].correct;
    stats[d].total += domainStats[d].total;
  });
  saveJSON(EXAM_STATS_KEY, stats);
  scheduleSync();
}

function renderExamResult(correctCount, total, pct, scaled, passed, domainStats){
  document.getElementById('examRunning').style.display = 'none';
  const resultEl = document.getElementById('examResult');
  resultEl.style.display = 'block';

  let domainsHtml = '';
  Object.entries(DOMAINS).forEach(([id, dom])=>{
    const s = domainStats[id];
    if(s.total === 0) return;
    const dPct = Math.round((s.correct/s.total)*100);
    domainsHtml += `<div class="result-domain-row">
      <span style="color:${dom.color}">D${id} · ${dom.short}</span>
      <span>${s.correct}/${s.total} (${dPct}%)</span>
    </div>`;
  });

  resultEl.innerHTML = `
    <div class="result-score">
      <div class="big ${passed ? 'pass' : 'fail'}">${scaled}</div>
      <div style="color:var(--text-secondary); font-size:13px; margin-top:6px;">de 100–1000 · mínimo pra passar: 700</div>
      <div style="margin-top:14px; font-family:var(--font-display); font-weight:700; font-size:18px;" class="${passed ? 'pass' : 'fail'}">
        ${passed ? 'Aprovado ✓' : 'Reprovado'} · ${correctCount}/${total} certas (${pct}%)
      </div>
    </div>
    <div class="setup-card">
      <h3>Desempenho por domínio</h3>
      ${domainsHtml}
    </div>
    <div class="controls" style="margin-top:18px;">
      <button class="btn-nav btn-primary" id="newExamBtn">Fazer outro simulado</button>
    </div>
  `;
  document.getElementById('newExamBtn').addEventListener('click', resetExamSetup);
}

function resetExamSetup(){
  examState = null;
  document.getElementById('examResult').style.display = 'none';
  document.getElementById('examRunning').style.display = 'none';
  document.getElementById('examSetup').style.display = 'flex';
}

document.getElementById('startFullExam').addEventListener('click', ()=> startExam('full', null));
document.getElementById('startDomainExam').addEventListener('click', ()=> startExam('domain', examDomainChoice));

// ============================================================
// GLOSSÁRIO
// ============================================================
let glossaryRendered = false;
function renderGlossary(list){
  glossaryRendered = true;
  const wrap = document.getElementById('glossaryList');
  wrap.innerHTML = '';
  if(list.length === 0){
    wrap.innerHTML = '<div class="empty-state">Nenhum termo encontrado.</div>';
    return;
  }
  list.forEach(item=>{
    const div = document.createElement('div');
    div.className = 'glossary-item';
    div.innerHTML = `<div class="term">${item.term}</div><div class="def">${item.def}</div>`;
    wrap.appendChild(div);
  });
}
document.getElementById('glossarySearch').addEventListener('input', (e)=>{
  const term = e.target.value.toLowerCase().trim();
  const filtered = !term ? GLOSSARY : GLOSSARY.filter(g =>
    g.term.toLowerCase().includes(term) || g.def.toLowerCase().includes(term)
  );
  renderGlossary(filtered);
});

// ============================================================
// RESUMO / CHEAT SHEET
// ============================================================
let cheatsheetRendered = false;
function renderCheatsheet(){
  cheatsheetRendered = true;
  const wrap = document.getElementById('cheatsheetContent');
  let html = '';
  Object.entries(DOMAINS).forEach(([id, dom])=>{
    const items = CHEATSHEET[id] || [];
    html += `<div class="cheat-domain">
      <h3 style="color:${dom.color}">D${id} · ${dom.name} (${dom.weight}%)</h3>
      <ul>${items.map(i=>`<li>${i}</li>`).join('')}</ul>
    </div>`;
  });
  html += `<div class="cheat-domain">
    <h3>Dicas pro dia da prova</h3>
    <ul>${(CHEATSHEET.tips || []).map(i=>`<li>${i}</li>`).join('')}</ul>
  </div>`;
  wrap.innerHTML = html;
}

// ============================================================
// PONTOS FRACOS
// ============================================================
function renderWeakAreas(){
  const wrap = document.getElementById('weakContent');
  const flashProgress = loadJSON(FLASH_STORAGE_KEY, {});
  const examStats = loadJSON(EXAM_STATS_KEY, {1:{correct:0,total:0},2:{correct:0,total:0},3:{correct:0,total:0},4:{correct:0,total:0}});

  const hasFlashData = Object.keys(flashProgress).length > 0;
  const hasExamData = Object.values(examStats).some(s => s.total > 0);

  if(!hasFlashData && !hasExamData){
    wrap.innerHTML = `<div class="empty-state">Ainda não há dados suficientes.<br>Estude alguns flashcards ou faça um simulado pra ver aqui onde focar.</div>`;
    return;
  }

  const rows = Object.entries(DOMAINS).map(([id, dom])=>{
    const domCards = CARDS.filter(c => c.d === Number(id));
    const known = domCards.filter(c => flashProgress[c.id] === 'known').length;
    const flashPct = domCards.length ? (known / domCards.length) * 100 : null;

    const eStats = examStats[id];
    const examPct = eStats.total > 0 ? (eStats.correct / eStats.total) * 100 : null;

    let combined;
    if(flashPct !== null && examPct !== null) combined = (flashPct + examPct) / 2;
    else if(flashPct !== null) combined = flashPct;
    else if(examPct !== null) combined = examPct;
    else combined = null;

    return {id, dom, flashPct, examPct, combined};
  }).filter(r => r.combined !== null)
    .sort((a,b) => a.combined - b.combined);

  let html = '';
  rows.forEach(r=>{
    const pct = Math.round(r.combined);
    const color = pct < 50 ? 'var(--accent-coral)' : pct < 75 ? 'var(--accent-amber)' : 'var(--accent-teal)';
    let note;
    if(pct < 50) note = `Ainda está fraco aqui — vale revisar os flashcards desse domínio e fazer uma prática focada no simulado.`;
    else if(pct < 75) note = `Caminho intermediário — revise os cards marcados como "revisar de novo" nesse domínio.`;
    else note = `Domínio bem dominado. Bom pra fazer revisões espaçadas, não precisa de foco extra agora.`;

    const parts = [];
    if(r.flashPct !== null) parts.push(`Flashcards: ${Math.round(r.flashPct)}%`);
    if(r.examPct !== null) parts.push(`Simulados: ${Math.round(r.examPct)}%`);

    html += `<div class="weak-row">
      <div class="weak-row-head">
        <span class="name" style="color:${r.dom.color}">D${r.id} · ${r.dom.short}</span>
        <span class="pct" style="color:${color}">${pct}%</span>
      </div>
      <div class="weak-bar"><div class="weak-bar-fill" style="width:${pct}%; background:${color};"></div></div>
      <div class="weak-note">${parts.join(' · ')}<br>${note}</div>
    </div>`;
  });

  const missing = Object.entries(DOMAINS).filter(([id])=> !rows.find(r=>r.id===id));
  if(missing.length){
    html += `<div class="empty-state">Ainda sem dados pra: ${missing.map(([id,d])=>`D${id} (${d.short})`).join(', ')}.</div>`;
  }

  wrap.innerHTML = html;
}

// ============================================================
// AUTENTICAÇÃO E SINCRONIZAÇÃO (Supabase)
// ============================================================
let supabaseClient = null;
let currentUser = null;
let pushTimer = null;

function emptyExamStats(){
  return {1:{correct:0,total:0},2:{correct:0,total:0},3:{correct:0,total:0},4:{correct:0,total:0}};
}

function isSupabaseConfigured(){
  return typeof SUPABASE_URL === 'string' && SUPABASE_URL && !SUPABASE_URL.includes('YOUR-PROJECT')
      && typeof SUPABASE_ANON_KEY === 'string' && SUPABASE_ANON_KEY && !SUPABASE_ANON_KEY.includes('YOUR-ANON');
}

async function initAuth(){
  const statusEl = document.getElementById('authStatus');
  if(!isSupabaseConfigured()){
    statusEl.textContent = 'Progresso salvo só neste navegador (configure o Supabase pra exigir login — veja SETUP.md)';
    hideLoginGate(); // sem Supabase configurado, não dá pra exigir login — libera o uso
    return;
  }
  if(typeof window.supabase === 'undefined'){
    statusEl.textContent = 'Não foi possível carregar o login (sem conexão?). Tente recarregar a página.';
    showLoginGate(true); // mostra o gate com um aviso de erro, mas sem opção de login funcional
    return;
  }
  try{
    supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    statusEl.textContent = '';

    supabaseClient.auth.onAuthStateChange((_event, session)=>{
      handleAuthChange(session);
    });

    const { data: { session } } = await supabaseClient.auth.getSession();
    handleAuthChange(session);
  }catch(e){
    console.error('Erro ao iniciar Supabase:', e);
    statusEl.textContent = 'Erro ao conectar com o login. Tente recarregar a página.';
    showLoginGate(true);
  }
}

async function handleAuthChange(session){
  currentUser = session ? session.user : null;
  document.getElementById('authLoggedOut').style.display = currentUser ? 'none' : 'flex';
  document.getElementById('authLoggedIn').style.display = currentUser ? 'flex' : 'none';
  if(currentUser){
    document.getElementById('authEmail').textContent = currentUser.email || 'Conectado';
    hideLoginGate();
    if(window.location.hash){
      history.replaceState(null, '', window.location.pathname + window.location.search);
    }
    await syncOnLogin();
  } else {
    showLoginGate();
  }
}

async function syncOnLogin(){
  const statusEl = document.getElementById('authStatus');
  statusEl.textContent = 'Sincronizando...';
  try{
    const { data, error } = await supabaseClient
      .from('user_progress')
      .select('flashcards, exam_stats, course_progress')
      .eq('user_id', currentUser.id)
      .maybeSingle();
    if(error) throw error;

    if(data){
      // já existe progresso na nuvem (de outro dispositivo) -> a nuvem manda
      fcState.progress = data.flashcards || {};
      saveJSON(FLASH_STORAGE_KEY, fcState.progress);
      saveJSON(EXAM_STATS_KEY, data.exam_stats || emptyExamStats());
      ccState.progress = data.course_progress || {};
      saveJSON(COURSE_STORAGE_KEY, ccState.progress);
      rebuildDeck();
      rebuildCourseDeck();
      updateWeightBarFill();
    } else {
      // primeiro login neste navegador: envia o progresso local pra nuvem
      await pushProgressNow();
    }
    statusEl.textContent = 'Sincronizado ✓';
    setTimeout(()=>{ if(statusEl.textContent === 'Sincronizado ✓') statusEl.textContent = ''; }, 2500);
  }catch(e){
    console.error('Erro ao sincronizar:', e);
    statusEl.textContent = 'Erro ao sincronizar — seu progresso continua salvo neste navegador.';
  }
}

function scheduleSync(){
  if(!currentUser || !supabaseClient) return;
  clearTimeout(pushTimer);
  pushTimer = setTimeout(pushProgressNow, 800);
}

async function pushProgressNow(){
  if(!currentUser || !supabaseClient) return;
  try{
    await supabaseClient.from('user_progress').upsert({
      user_id: currentUser.id,
      flashcards: fcState.progress,
      exam_stats: loadJSON(EXAM_STATS_KEY, emptyExamStats()),
      course_progress: ccState.progress,
      updated_at: new Date().toISOString()
    });
  }catch(e){
    console.error('Erro ao salvar na nuvem:', e);
  }
}

function friendlyAuthError(error){
  if(!error) return '';
  const msg = (error.message || '').toLowerCase();
  if(msg.includes('provider is not enabled') || error.code === 'validation_failed'){
    return 'Login com Google ainda não foi configurado neste projeto.';
  }
  if(msg.includes('invalid login credentials')){
    return 'E-mail ou senha incorretos.';
  }
  if(msg.includes('already registered') || msg.includes('already exists') || msg.includes('user already')){
    return 'Esse e-mail já tem conta — clica em "Entrar" em vez de "Criar conta".';
  }
  if(msg.includes('password should be at least') || msg.includes('password is too short')){
    return 'A senha precisa ter pelo menos 6 caracteres.';
  }
  if(msg.includes('unable to validate email') || msg.includes('invalid email')){
    return 'Esse e-mail não parece válido.';
  }
  if(msg.includes('email not confirmed')){
    return 'Confirme seu e-mail antes de entrar (confira a caixa de entrada, inclusive spam).';
  }
  if(msg.includes('rate limit')){
    return 'Muitas tentativas seguidas — espera alguns minutos antes de tentar de novo.';
  }
  return 'Não deu certo agora. Confira os dados e tenta de novo.';
}

async function attemptGoogleLogin(){
  if(!supabaseClient) return;
  const cleanUrl = window.location.origin + window.location.pathname;
  const { error } = await supabaseClient.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: cleanUrl }
  });
  if(error){
    const msg = friendlyAuthError(error);
    document.getElementById('authStatus').textContent = msg;
    const gateStatus = document.getElementById('gateStatus');
    if(gateStatus) gateStatus.textContent = msg;
  }
}

async function attemptSignIn(emailId, passId, btnId, statusId){
  if(!supabaseClient) return;
  const email = document.getElementById(emailId).value.trim();
  const password = document.getElementById(passId).value;
  if(!email || !password) return;
  const btn = document.getElementById(btnId);
  const statusEl = document.getElementById(statusId);
  const originalText = btn.textContent;
  btn.disabled = true;
  btn.textContent = 'Entrando...';
  const { error } = await supabaseClient.auth.signInWithPassword({ email, password });
  btn.disabled = false;
  btn.textContent = originalText;
  statusEl.textContent = error ? friendlyAuthError(error) : '';
}

async function attemptSignUp(emailId, passId, btnId, statusId){
  if(!supabaseClient) return;
  const email = document.getElementById(emailId).value.trim();
  const password = document.getElementById(passId).value;
  if(!email || !password) return;
  const btn = document.getElementById(btnId);
  const statusEl = document.getElementById(statusId);
  const originalText = btn.textContent;
  btn.disabled = true;
  btn.textContent = 'Criando...';
  const { data, error } = await supabaseClient.auth.signUp({ email, password });
  btn.disabled = false;
  btn.textContent = originalText;
  if(error){
    statusEl.textContent = friendlyAuthError(error);
    return;
  }
  if(data.session){
    statusEl.textContent = ''; // já logou direto (confirmação de e-mail desativada)
  } else {
    statusEl.textContent = 'Conta criada! Confira seu e-mail pra confirmar antes de entrar.';
  }
}

document.getElementById('googleLoginBtn').addEventListener('click', attemptGoogleLogin);
document.getElementById('signInBtn').addEventListener('click', ()=> attemptSignIn('authEmailInput', 'authPasswordInput', 'signInBtn', 'authStatus'));
document.getElementById('signUpBtn').addEventListener('click', ()=> attemptSignUp('authEmailInput', 'authPasswordInput', 'signUpBtn', 'authStatus'));
document.getElementById('logoutBtn').addEventListener('click', ()=>{
  if(!supabaseClient) return;
  supabaseClient.auth.signOut();
});

// ============================================================
// GATE DE LOGIN — obrigatório: a pessoa só usa o app depois de logar
// ============================================================
function showLoginGate(loadError){
  const title = document.getElementById('gateTitle');
  const desc = document.getElementById('gateDesc');
  const options = document.getElementById('gateLoginOptions');
  if(loadError){
    title.textContent = 'Não foi possível carregar o login';
    desc.textContent = 'Recarregue a página pra tentar de novo.';
    options.style.display = 'none';
  } else {
    title.textContent = 'Crie sua conta gratuita pra estudar';
    desc.textContent = 'Entra com Google, ou cria uma conta com e-mail e senha. Seu progresso fica salvo e sincroniza em qualquer dispositivo.';
    options.style.display = 'flex';
  }
  document.getElementById('gateStatus').textContent = '';
  document.getElementById('loginGateModal').style.display = 'flex';
  // pausa o cronômetro do simulado completo enquanto o gate está visível
  if(examState && examState.mode === 'full' && !examState.finished && examState.timerId){
    clearInterval(examState.timerId);
    examState.timerId = null;
    examTimerPausedByGate = true;
  }
}
function hideLoginGate(){
  document.getElementById('loginGateModal').style.display = 'none';
  if(examTimerPausedByGate && examState && !examState.finished){
    examState.timerId = setInterval(tickExamTimer, 1000);
  }
  examTimerPausedByGate = false;
}

document.getElementById('gateGoogleBtn').addEventListener('click', ()=> attemptGoogleLogin());
document.getElementById('gateSignInBtn').addEventListener('click', ()=> attemptSignIn('gateEmailInput', 'gatePasswordInput', 'gateSignInBtn', 'gateStatus'));
document.getElementById('gateSignUpBtn').addEventListener('click', ()=> attemptSignUp('gateEmailInput', 'gatePasswordInput', 'gateSignUpBtn', 'gateStatus'));
let examTimerPausedByGate = false;

function wirePasswordToggle(btnId, inputId){
  const btn = document.getElementById(btnId);
  const input = document.getElementById(inputId);
  btn.addEventListener('click', ()=>{
    const willShow = input.type === 'password';
    input.type = willShow ? 'text' : 'password';
    btn.textContent = willShow ? '🙈' : '👁';
    btn.setAttribute('aria-label', willShow ? 'Ocultar senha' : 'Mostrar senha');
  });
}
wirePasswordToggle('authPwToggle', 'authPasswordInput');
wirePasswordToggle('gatePwToggle', 'gatePasswordInput');

// ============================================================
// INIT
// ============================================================
buildWeightBar();
buildChips();
rebuildDeck();
buildExamDomainChips();
buildCourseChips();
rebuildCourseDeck();
initAuth();
