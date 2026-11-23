// Инициализация Telegram Web App (если открыто вне Telegram — просто не будет SDK)
const tg = window.Telegram?.WebApp;
tg?.ready();
tg?.expand();

const STORAGE_KEY = 'romantic-slot-index';
const SPIN_DURATION_BASE = 900; // мс до остановки первого барабана
const REEL_DELAY = 500;         // задержка между остановками барабанов
const TICK_MS = 80;             // скорость «мелькания» символов

const reels = [...document.querySelectorAll('.reel')];
const spinBtn = document.getElementById('spin');
const resetBtn = document.getElementById('reset');
const counterEl = document.getElementById('counter');
const totalEl = document.getElementById('total');
const prizeEl = document.getElementById('prize');
const prizeTextEl = document.getElementById('prize-text');

totalEl.textContent = SCRIPT.length;

// Текущая позиция в сценарии (сохраняется между открытиями приложения)
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
  return SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)];
}

function renderCounter() {
  // Показываем номер спина, который сейчас будет крутиться
  counterEl.textContent = index + 1;
}

function spin() {
  if (spinning) return;
  spinning = true;
  spinBtn.disabled = true;
  prizeEl.classList.add('hidden');

  // Берём очередной шаг сценария и сразу двигаем указатель по кругу
  const step = SCRIPT[index];
  index = (index + 1) % SCRIPT.length;
  saveIndex();

  // Запускаем все барабаны «мелькать»
  const timers = reels.map((reel) => {
    reel.classList.remove('stop');
    reel.classList.add('spinning');
    return setInterval(() => {
      reel.textContent = randomSymbol();
    }, TICK_MS);
  });

  // Останавливаем барабаны по очереди на заранее заданных символах
  let stopped = 0;
  reels.forEach((reel, i) => {
    setTimeout(() => {
      clearInterval(timers[i]);
      reel.classList.remove('spinning');
      reel.textContent = step.symbols[i];
      reel.classList.add('stop');
      tg?.HapticFeedback?.impactOccurred('light');

      stopped++;
      if (stopped === reels.length) showPrize(step);
    }, SPIN_DURATION_BASE + i * REEL_DELAY);
  });
}

function showPrize(step) {
  const isJackpot = step.symbols.every((s) => s === step.symbols[0]);
  prizeTextEl.textContent = step.prize;
  prizeEl.classList.toggle('jackpot', isJackpot);
  prizeEl.classList.remove('hidden');

  tg?.HapticFeedback?.notificationOccurred(isJackpot ? 'success' : 'warning');

  renderCounter();
  spinning = false;
  spinBtn.disabled = false;
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
  prizeEl.classList.add('hidden');
}

spinBtn.addEventListener('click', spin);
resetBtn.addEventListener('click', reset);
renderCounter();
