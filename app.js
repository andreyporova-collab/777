// Инициализация Telegram Web App (вне Telegram просто не будет SDK)
const tg = window.Telegram?.WebApp;
tg?.ready();
tg?.expand();

// Ключ v2: старый прогресс от прошлых версий не подхватывается
const STORAGE_KEY = 'romantic-slot-v2';
const SPIN_BASE = 1300;   // мс до остановки первого барабана
const REEL_DELAY = 600;   // задержка между остановками барабанов
const TICK_MS = 90;       // частота смены кадров при вращении
const CONFETTI_COLORS = ['#ffd76a', '#ff6fa5', '#ffd1e0', '#7ad7ff', '#b28cff'];

const reelImgs = [...document.querySelectorAll('.reel img')];
const reelEls = [...document.querySelectorAll('.reel')];
const machine = document.getElementById('machine');
const spinBtn = document.getElementById('spin');
const spinLabel = spinBtn.querySelector('span');
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

// Сколько спинов уже сделано: от 0 до SCRIPT.length. Больше сценарий не идёт по кругу.
let index = loadIndex();
let spinning = false;

function loadIndex() {
  const saved = Number(localStorage.getItem(STORAGE_KEY));
  return Number.isInteger(saved) && saved >= 0 && saved <= SCRIPT.length ? saved : 0;
}

function saveIndex() {
  localStorage.setItem(STORAGE_KEY, String(index));
}

function isFinished() {
  return index >= SCRIPT.length;
}

function randomSymbol() {
  return PRIZES[SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)]].icon;
}

// Обновляет счётчик, кнопку «КРУТИТЬ» и состояние «сценарий окончен»
function renderState() {
  counterEl.textContent = isFinished() ? SCRIPT.length : index + 1;
  if (isFinished()) {
    spinBtn.disabled = true;
    spinLabel.textContent = 'СЦЕНАРИЙ ОКОНЧЕН';
    resetBtn.classList.add('primary');
  } else {
    spinBtn.disabled = spinning;
    spinLabel.textContent = 'КРУТИТЬ';
    resetBtn.classList.remove('primary');
  }
}

function spin() {
  if (spinning || isFinished()) return;
  spinning = true;
  renderState();
  resultEl.classList.add('hidden');

  // Берём очередной шаг сценария строго по порядку
  const step = SCRIPT[index];
  index += 1;
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

  spinning = false;
  renderState();

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

// Выигрыш, о котором ещё не сообщили боту
let pendingWin = null;

function showWin(prizeId) {
  const prize = PRIZES[prizeId];
  pendingWin = prizeId;
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

// Закрытие окна выигрыша: отправляем приз боту.
// sendData закрывает мини-приложение, поэтому делаем это только после того, как игрок всё увидел.
function closeWin() {
  winEl.classList.add('hidden');
  if (pendingWin) {
    const payload = JSON.stringify({ type: 'win', prize: pendingWin });
    pendingWin = null;
    if (tg?.sendData) {
      tg.sendData(payload);
    } else {
      console.log('Вне Telegram отправка пропущена:', payload);
    }
  }
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
  resultEl.classList.add('hidden');
  closeWin();
  renderState();
}

spinBtn.addEventListener('click', spin);
resetBtn.addEventListener('click', reset);
winClose.addEventListener('click', closeWin);
winEl.addEventListener('click', (e) => { if (e.target === winEl) closeWin(); });
renderState();
