// Что бот отправляет при выигрыше: фото приза и подпись.
// Ключи совпадают с PRIZES в schedule.js. Фото берётся с GitHub Pages по относительному пути.

const PRIZE_MESSAGES = {
  p10: {
    photo: 'assets/prizes/png/p10.png',
    caption: 'Небольшой, но приятный бонус: 10 € на всё, что захочешь. Ты его заслужила!',
  },
  p20: {
    photo: 'assets/prizes/png/p20.png',
    caption: '20 € — маленькая радость, потрать её с удовольствием.',
  },
  p50: {
    photo: 'assets/prizes/png/p50.png',
    caption: '50 € специально для тебя! Ты молодец, что дошла до конца.',
  },
  p100: {
    photo: 'assets/prizes/png/p100.png',
    caption: '100 € — пусть это будет вечер, когда ни в чём себе не отказываешь.',
  },
  p500: {
    photo: 'assets/prizes/png/p500.png',
    caption: '500 €! Это большой куш, любимая. Сюрприз только для тебя.',
  },
  coffee: {
    photo: 'assets/prizes/png/coffee.png',
    caption: 'Кофе за мой счёт. С меня сладкое утро, любимая.',
  },
  jackpot: {
    photo: 'assets/prizes/png/jackpot.png',
    caption: 'Джекпот! Самое большое чудо этого слота. Выбирай, что хочешь.',
  },
  flowers: {
    photo: 'assets/prizes/png/flowers.png',
    caption: 'Цветы для тебя. Пусть этот букет напоминает, как ты мне нравишься.',
  },
  candy: {
    photo: 'assets/prizes/png/candy.png',
    caption: 'Сладости, чтобы ты улыбалась. Заслуженно!',
  },
};

const FOOTER = 'За получение приза обращайтесь к организатору.';

module.exports = { PRIZE_MESSAGES, FOOTER };
