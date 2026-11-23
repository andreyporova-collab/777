// =====================================================================
//  ПРИЗЫ И СЦЕНАРИЙ ВЫПАДЕНИЙ
//  Иконки нарисованы вручную: assets/prizes/*.svg
// =====================================================================

const PRIZES = {
  p10:     { name: '10 €',    icon: 'assets/prizes/p10.svg?v=11' },
  p20:     { name: '20 €',    icon: 'assets/prizes/p20.svg?v=11' },
  p50:     { name: '50 €',    icon: 'assets/prizes/p50.svg?v=11' },
  p100:    { name: '100 €',   icon: 'assets/prizes/p100.svg?v=11' },
  p500:    { name: '500 €',   icon: 'assets/prizes/p500.svg?v=11' },
  coffee:  { name: 'Кофе',    icon: 'assets/prizes/coffee.svg?v=11' },
  jackpot: { name: 'Джекпот', tableName: 'SEX', icon: 'assets/prizes/jackpot.svg?v=11' },
  flowers: { name: 'Цветы',   icon: 'assets/prizes/flowers.svg?v=11' },
  candy:   { name: 'Конфеты', icon: 'assets/prizes/candy.svg?v=11' },
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
