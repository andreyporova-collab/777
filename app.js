// Инициализация Telegram Web App (вне Telegram просто не будет SDK)
const tg = window.Telegram?.WebApp;
tg?.ready();
tg?.expand();

const STORAGE_KEY = 'romantic-slot-index';
const SPIN_BASE = 1300;   // мс до остановки первого барабана
const REEL_DELAY = 600;   // задержка между остановками барабанов
const TICK_MS = 90;       // частота смены кадров при вращении
const CONFETTI_COLORS = ['#ffd76a', '#ff6fa5', '#ffd1e0', '#7ad7ff', '#b28cff'];

const reelImgs = [...document.querySelectorAll('.reel img')];
const reelEls = [...document.querySelectorAll('.reel')];
const machine = document.getElementById('machine');
const spinBtn = document.getElementById('spin');
const resetBtn = document.getElementById('reset');
const counterEl = document.getElementById('counter');
const totalEl = document.getElementById('total');
const resultEl = document.getElementById('result');
const winEl = document.getElementById('win');
const winIcon = document.getElementById('win-icon');
const winPrize = document.getElementById('win-prize');
const winNote = document.getElementById('win-note');
const winClose = document.getElementById('win-close');

totalEl.textContent = SCRIPT.length;
winNote.textContent = WIN_NOTE;

// Текущая позиция в сценарии (сохраняется между открытиями)
let index = loadIndex();
let spinning = false;

function loadIndex() {
  const saved = Number(localStorage.getItem(STORAGE_KEY));
  return Number.isInteger(saved) && saved >= 0 ? saved % SCRIPT.length : 0;
}

function saveIndex() {
  localStorage.setItem(STORAGE_KEY, String(index));
}

function randomSymbol() {
  return PRIZES[SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)]].icon;
}

function renderCounter() {
  counterEl.textContent = index + 1;
}

function spin() {
  if (spinning) return;
  spinning = true;
  spinBtn.disabled = true;
  resultEl.classList.add('hidden');

  // Берём очередной шаг сценария и двигаем указатель по кругу
  const step = SCRIPT[index];
  index = (index + 1) % SCRIPT.length;
  saveIndex();

  // Все барабаны начинают «мелькать»
  const timers = reelImgs.map((img, i) => {
    reelEls[i].classList.remove('stop');
    reelEls[i].classList.add('spinning');
    return setInterval(() => { img.src = randomSymbol(); }, TICK_MS);
  });

  // Останавливаем по очереди на заранее заданных символах
  let stopped = 0;
  reelImgs.forEach((img, i) => {
    setTimeout(() => {
      clearInterval(timers[i]);
      img.src = PRIZES[step.symbols[i]].icon;
      reelEls[i].classList.remove('spinning');
      reelEls[i].classList.add('stop');
      tg?.HapticFeedback?.impactOccurred('light');

      stopped++;
      if (stopped === reelImgs.length) finish(step);
    }, SPIN_BASE + i * REEL_DELAY);
  });
}

function finish(step) {
  const [a, b, c] = step.symbols;
  const isWin = a === b && b === c;

  renderCounter();
  spinning = false;
  spinBtn.disabled = false;

  if (isWin) {
    tg?.HapticFeedback?.notificationOccurred('success');
    showWin(a);
  } else {
    tg?.HapticFeedback?.notificationOccurred('warning');
    showLose();
  }
}

function showLose() {
  resultEl.textContent = LOSE_TEXT;
  resultEl.classList.remove('hidden');
  machine.classList.remove('shake');
  void machine.offsetWidth; // перезапуск анимации
  machine.classList.add('shake');
}

function showWin(prizeId) {
  const prize = PRIZES[prizeId];
  winIcon.src = prize.icon;
  winPrize.textContent = prize.name;
  winEl.classList.remove('hidden');
  confetti();
}

function confetti() {
  for (let i = 0; i < 70; i++) {
    const piece = document.createElement('span');
    piece.className = 'confetti';
    piece.style.left = `${Math.random() * 100}%`;
    piece.style.background = CONFETTI_COLORS[i % CONFETTI_COLORS.length];
    piece.style.animationDuration = `${2 + Math.random() * 2}s`;
    piece.style.animationDelay = `${Math.random() * 0.6}s`;
    piece.style.transform = `rotate(${Math.random() * 360}deg)`;
    document.body.appendChild(piece);
    piece.addEventListener('animationend', () => piece.remove());
  }
}

function closeWin() {
  winEl.classList.add('hidden');
}

function reset() {
  const message = 'Начать сценарий сначала?';
  if (tg?.showConfirm) {
    tg.showConfirm(message, (confirmed) => {
      if (confirmed) doReset();
    });
  } else if (window.confirm(message)) {
    doReset();
  }
}

function doReset() {
  index = 0;
  saveIndex();
  renderCounter();
  resultEl.classList.add('hidden');
}

spinBtn.addEventListener('click', spin);
resetBtn.addEventListener('click', reset);
winClose.addEventListener('click', closeWin);
winEl.addEventListener('click', (e) => { if (e.target === winEl) closeWin(); });
renderCounter();
