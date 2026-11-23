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

const reelEls = [...document.querySelectorAll('.reel')];
const midImgs = reelEls.map((reel) => reel.querySelector('.mid'));
const cellImgs = reelEls.map((reel) => [...reel.querySelectorAll('.cell')]); // верх и низ
const machine = document.getElementById('machine');
const spinBtn = document.getElementById('spin');
const spinLabel = spinBtn.querySelector('span');
const counterEl = document.getElementById('counter');
const totalEl = document.getElementById('total');
const resultEl = document.getElementById('result');
const winEl = document.getElementById('win');
const winIcon = document.getElementById('win-icon');
const winPrize = document.getElementById('win-prize');
const winNote = document.getElementById('win-note');
const winClose = document.getElementById('win-close');
const prizeGrid = document.getElementById('prize-grid');

totalEl.textContent = SCRIPT.length;
winNote.textContent = WIN_NOTE;

// Сетка призов строится из PRIZES, чтобы всегда совпадать с барабанами
function renderPrizeGrid() {
  for (const prize of Object.values(PRIZES)) {
    const tile = document.createElement('div');
    tile.className = 'prize-tile';
    const img = document.createElement('img');
    img.src = prize.icon;
    img.alt = '';
    const label = document.createElement('span');
    label.textContent = prize.tableName || prize.name;
    tile.append(img, label);
    prizeGrid.appendChild(tile);
  }
}
renderPrizeGrid();

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

// Обновляет счётчик, кнопку и состояние «попыток не осталось»
function renderState() {
  counterEl.textContent = isFinished() ? SCRIPT.length : index + 1;
  if (isFinished()) {
    spinBtn.disabled = true;
    spinLabel.textContent = 'Попыток не осталось!';
  } else {
    spinBtn.disabled = spinning;
    spinLabel.textContent = 'Крутить';
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

  // Все барабаны начинают «мелькать» (все три видимых символа)
  const timers = reelEls.map((reel, i) => {
    reel.classList.remove('stop');
    reel.classList.add('spinning');
    return setInterval(() => {
      cellImgs[i].forEach((img) => { img.src = randomSymbol(); });
      midImgs[i].src = randomSymbol();
    }, TICK_MS);
  });

  // Останавливаем по очереди: центр — заранее заданный символ, верх и низ — соседние
  let stopped = 0;
  reelEls.forEach((reel, i) => {
    setTimeout(() => {
      clearInterval(timers[i]);
      const [top, bottom] = cellImgs[i];
      top.src = randomSymbol();
      bottom.src = randomSymbol();
      midImgs[i].src = PRIZES[step.symbols[i]].icon;
      reel.classList.remove('spinning');
      reel.classList.add('stop');
      tg?.HapticFeedback?.impactOccurred('light');

      stopped++;
      if (stopped === reelEls.length) finish(step);
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

// Если игрок закрыл мини-приложение, не нажав «Ура!», приз всё равно уйдёт боту через 3 секунды
const AUTO_SEND_WIN_MS = 3000;
let autoSendTimer = null;

function showWin(prizeId) {
  const prize = PRIZES[prizeId];
  pendingWin = prizeId;
  winIcon.src = prize.icon;
  winPrize.textContent = prize.name;
  winEl.classList.remove('hidden');
  confetti();
  clearTimeout(autoSendTimer);
  autoSendTimer = setTimeout(() => {
    if (pendingWin) closeWin();
  }, AUTO_SEND_WIN_MS);
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
  clearTimeout(autoSendTimer);
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

// Скрытый сброс для теста: 10 нажатий по надписи «наш вечер».
// Если между нажатиями пауза больше 3 секунд, счётчик начинается заново.
// Без подтверждения и без подсказок на экране.
const RESET_TAPS = 10;
const TAP_WINDOW_MS = 3000;
const kickerEl = document.querySelector('.kicker');
let tapCount = 0;
let lastTapAt = 0;

function resetScript() {
  if (spinning) return;
  index = 0;
  saveIndex();
  resultEl.classList.add('hidden');
  winEl.classList.add('hidden');
  pendingWin = null;
  renderState();
}

kickerEl.addEventListener('click', () => {
  const now = Date.now();
  tapCount = now - lastTapAt > TAP_WINDOW_MS ? 1 : tapCount + 1;
  lastTapAt = now;
  if (tapCount >= RESET_TAPS) {
    tapCount = 0;
    resetScript();
    tg?.HapticFeedback?.notificationOccurred('success');
  }
});

spinBtn.addEventListener('click', spin);
winClose.addEventListener('click', closeWin);
winEl.addEventListener('click', (e) => { if (e.target === winEl) closeWin(); });
renderState();
