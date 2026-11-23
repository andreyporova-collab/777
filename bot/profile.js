// Настройка профиля бота: имя, описания, команды, кнопка меню.
// Запускается один раз (и после изменения текстов): npm run profile
//
// Аватарку и баннер Bot API не принимает — их загружают через @BotFather
// (см. README, раздел «Оформление бота»).
//
// Переменные окружения: BOT_TOKEN, WEBAPP_URL, TG_API_BASE (необязательно).

const BOT_TOKEN = process.env.BOT_TOKEN;
const WEBAPP_URL = process.env.WEBAPP_URL;
const API_BASE = process.env.TG_API_BASE || 'https://api.telegram.org';

if (!BOT_TOKEN || !WEBAPP_URL || !WEBAPP_URL.startsWith('https://')) {
  console.error('Нужны BOT_TOKEN и WEBAPP_URL (HTTPS)');
  process.exit(1);
}

const API = `${API_BASE}/bot${BOT_TOKEN}`;

// Имя бота (до 64 символов)
const NAME = 'Наш слот 💖';

// Короткое описание: показывается в профиле бота и при пересылке (до 120 символов)
const SHORT_DESCRIPTION = 'Романтический слот: каждый спин — сюрприз. Жми /start и крути!';

// Полное описание: показывается, когда чат с ботом пустой (до 512 символов)
const DESCRIPTION =
  'Привет! 💖 Это наш романтический слот-автомат.\n\n' +
  'Нажми «🎰 Крутить слот» и смотри, что выпадет. ' +
  'Три одинаковых приза — выигрыш: бот пришлёт фото приза и поздравление.\n\n' +
  'Всего 5 спинов, так что каждый важен 😉\n\n' +
  'Нажми /start, чтобы начать.';

const COMMANDS = [
  { command: 'start', description: 'Открыть слот' },
];

const MENU_BUTTON_TEXT = 'Слот';

async function callApi(method, body = {}) {
  const res = await fetch(`${API}/${method}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!data.ok) throw new Error(`${method}: ${data.description}`);
  return data.result;
}

async function main() {
  await callApi('setMyName', { name: NAME });
  console.log('имя: ok');

  await callApi('setMyShortDescription', { short_description: SHORT_DESCRIPTION });
  console.log('короткое описание: ok');

  await callApi('setMyDescription', { description: DESCRIPTION });
  console.log('описание: ok');

  await callApi('setMyCommands', { commands: COMMANDS });
  console.log('команды: ok');

  await callApi('setChatMenuButton', {
    menu_button: { type: 'web_app', text: MENU_BUTTON_TEXT, web_app: { url: WEBAPP_URL } },
  });
  console.log('кнопка меню: ok');

  console.log('Готово. Аватарку и баннер загрузи через @BotFather.');
}

main().catch((err) => {
  console.error('Ошибка:', err.message);
  process.exit(1);
});
