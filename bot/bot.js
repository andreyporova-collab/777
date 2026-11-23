// Telegram-бот для «Наш слот 💖».
// Без зависимостей, нужен Node.js 18+ (нужен встроенный fetch).
//
// Переменные окружения:
//   BOT_TOKEN   — токен бота от @BotFather (обязательно, НЕ коммитить)
//   WEBAPP_URL  — HTTPS-адрес, где лежит слот (например GitHub Pages)
//   TG_API_BASE — необязательно, для тестов с подменой API

const BOT_TOKEN = process.env.BOT_TOKEN;
const WEBAPP_URL = process.env.WEBAPP_URL;
const API_BASE = process.env.TG_API_BASE || 'https://api.telegram.org';

if (!BOT_TOKEN) {
  console.error('Нет BOT_TOKEN в переменных окружения');
  process.exit(1);
}
if (!WEBAPP_URL || !WEBAPP_URL.startsWith('https://')) {
  console.error('WEBAPP_URL должен быть HTTPS-адресом слота');
  process.exit(1);
}

const API = `${API_BASE}/bot${BOT_TOKEN}`;

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

const START_TEXT =
  'Привет! 💖 Нажми кнопку, чтобы крутить наш слот.\n' +
  'Каждый спин открывает приз.';

async function handleMessage(message) {
  const chatId = message.chat.id;
  const text = (message.text || '').trim();

  if (text.startsWith('/start')) {
    await callApi('sendMessage', {
      chat_id: chatId,
      text: START_TEXT,
      reply_markup: {
        inline_keyboard: [[{ text: '🎰 Крутить слот', web_app: { url: WEBAPP_URL } }]],
      },
    });
    return;
  }

  // Любой другой текст — просто подсказка
  await callApi('sendMessage', {
    chat_id: chatId,
    text: 'Напиши /start, чтобы открыть слот.',
  });
}

async function main() {
  const me = await callApi('getMe');
  console.log(`Бот @${me.username} запущен. Жду сообщений…`);

  let offset = 0;
  while (true) {
    try {
      const updates = await callApi('getUpdates', {
        offset,
        timeout: 30,
        allowed_updates: ['message'],
      });
      for (const update of updates) {
        offset = update.update_id + 1;
        if (update.message) {
          await handleMessage(update.message).catch((err) =>
            console.error('Ошибка обработки:', err.message)
          );
        }
      }
    } catch (err) {
      console.error('Ошибка getUpdates:', err.message);
      await new Promise((r) => setTimeout(r, 3000));
    }
  }
}

main().catch((err) => {
  console.error('Не удалось запустить бота:', err.message);
  process.exit(1);
});
