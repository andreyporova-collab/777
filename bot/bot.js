// Telegram-бот для «Наш слот 💖».
// Без зависимостей, нужен Node.js 18+ (нужен встроенный fetch).
//
// Переменные окружения:
//   BOT_TOKEN   — токен бота от @BotFather (обязательно, НЕ коммитить)
//   WEBAPP_URL  — HTTPS-адрес, где лежит слот (например GitHub Pages)
//   TG_API_BASE — необязательно, для тестов с подменой API

const { PRIZE_MESSAGES, FOOTER } = require('./prizes');

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
  'Привет! 💖 Нажми кнопку внизу, чтобы крутить наш слот.\n' +
  'Каждый спин открывает приз.';

// Кнопка-клавиатура с web_app: только из неё мини-приложение может отправить данные боту
const LAUNCH_KEYBOARD = {
  keyboard: [[{ text: '🎰 Крутить слот', web_app: { url: WEBAPP_URL } }]],
  resize_keyboard: true,
};

async function handleStart(chatId) {
  await callApi('sendMessage', {
    chat_id: chatId,
    text: START_TEXT,
    reply_markup: LAUNCH_KEYBOARD,
  });
}

// Слот сообщил о выигрыше: отправляем фото приза и подпись
async function handleWin(chatId, rawData) {
  let payload;
  try {
    payload = JSON.parse(rawData);
  } catch {
    payload = null;
  }

  const entry = payload?.type === 'win' ? PRIZE_MESSAGES[payload.prize] : null;
  if (!entry) {
    await callApi('sendMessage', { chat_id: chatId, text: 'Не смог распознать приз 🤔' });
    return;
  }

  await callApi('sendPhoto', {
    chat_id: chatId,
    photo: new URL(entry.photo, WEBAPP_URL).href,
    caption: `${entry.caption}\n\n${FOOTER}`,
  });
}

async function handleMessage(message) {
  const chatId = message.chat.id;

  if (message.web_app_data) {
    await handleWin(chatId, message.web_app_data.data);
    return;
  }

  const text = (message.text || '').trim();
  if (text.startsWith('/start')) {
    await handleStart(chatId);
    return;
  }

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
