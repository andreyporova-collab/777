// =====================================================================
//  ПРИЗЫ И СЦЕНАРИЙ ВЫПАДЕНИЙ
//  Иконки нарисованы вручную: assets/prizes/*.svg
// =====================================================================

const PRIZES = {
  p10:     { name: '10 €',    icon: 'assets/prizes/p10.svg' },
  p20:     { name: '20 €',    icon: 'assets/prizes/p20.svg' },
  p50:     { name: '50 €',    icon: 'assets/prizes/p50.svg' },
  p100:    { name: '100 €',   icon: 'assets/prizes/p100.svg' },
  p500:    { name: '500 €',   icon: 'assets/prizes/p500.svg' },
  coffee:  { name: 'Кофе',    icon: 'assets/prizes/coffee.svg' },
  jackpot: { name: 'Джекпот', icon: 'assets/prizes/jackpot.svg' },
  flowers: { name: 'Цветы',   icon: 'assets/prizes/flowers.svg' },
  candy:   { name: 'Конфеты', icon: 'assets/prizes/candy.svg' },
};

// Символы, которые крутятся на барабанах (случайные «мелькающие» кадры)
const SYMBOLS = Object.keys(PRIZES);

// Сценарий: три барабана слева направо. Совпали все три — выигрыш.
// Дошли до конца — начинаем сначала (по кругу).
const SCRIPT = [
  { symbols: ['jackpot', 'jackpot', 'p10'] },
  { symbols: ['p500', 'flowers', 'candy'] },
  { symbols: ['coffee', 'coffee', 'coffee'] },
  { symbols: ['p10', 'p50', 'p100'] },
  { symbols: ['p50', 'p50', 'p50'] },
];

const LOSE_TEXT = 'Ооо нет... Попробуй снова!';
const WIN_NOTE = 'За получение приза обращайтесь к организатору';
