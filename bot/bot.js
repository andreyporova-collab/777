// Telegram-бот для «Наш слот 💖».
// Без зависимостей, нужен Node.js 18+ (нужен встроенный fetch).
//
// Переменные окружения:
//   BOT_TOKEN   — токен бота от @BotFather (обязательно, НЕ коммитить)
//   WEBAPP_URL  — HTTPS-адрес, где лежит слот (например GitHub Pages)
//   ADMIN_ID    — Telegram ID админа (по умолчанию 8552931520)
//   TG_API_BASE — необязательно, для тестов с подменой API

const { PRIZE_MESSAGES, FOOTER } = require('./prizes');
const { readJson, saveJson } = require('./store');

const BOT_TOKEN = process.env.BOT_TOKEN;
const WEBAPP_URL = process.env.WEBAPP_URL;
const API_BASE = process.env.TG_API_BASE || 'https://api.telegram.org';
const ADMIN_ID = Number(process.env.ADMIN_ID || 8552931520);

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

// ---------- Пользователи ----------

// Запоминаем всех, кто писал боту, чтобы админ мог сбросить спины конкретному человеку
function rememberUser(from) {
  if (!from) return;
  const users = readJson('users.json', {});
  const id = String(from.id);
  const name = [from.first_name, from.last_name].filter(Boolean).join(' ') || from.username || id;
  if (users[id]?.name === name) return;
  users[id] = { name, username: from.username || null };
  saveJson('users.json', users);
}

// ---------- Сброс спинов ----------

// Сброс = увеличить счётчик. Мини-приложение сравнивает свой сохранённый счётчик с этим.
function resetAll() {
  const reset = readJson('reset.json', { all: 0, users: {} });
  reset.all = (reset.all || 0) + 1;
  saveJson('reset.json', reset);
}

function resetUser(userId) {
  const reset = readJson('reset.json', { all: 0, users: {} });
  reset.users = reset.users || {};
  reset.users[userId] = (reset.users[userId] || 0) + 1;
  saveJson('reset.json', reset);
}

// ---------- Админка ----------

function isAdmin(from) {
  return from && from.id === ADMIN_ID;
}

function adminMenu() {
  return {
    inline_keyboard: [
      [{ text: '🔄 Сбросить спины у всех', callback_data: 'admin:reset_all' }],
      [{ text: '👥 Пользователи', callback_data: 'admin:users' }],
    ],
  };
}

async function handleAdmin(chatId) {
  await callApi('sendMessage', {
    chat_id: chatId,
    text: 'Админка слота. Выбери действие:',
    reply_markup: adminMenu(),
  });
}

async function showUsers(chatId) {
  const users = readJson('users.json', {});
  const entries = Object.entries(users);
  if (entries.length === 0) {
    await callApi('sendMessage', { chat_id: chatId, text: 'Пока никто не писал боту.' });
    return;
  }
  // Кнопки по одной в строке, максимум 50 пользователей
  const rows = entries.slice(0, 50).map(([id, u]) => [
    { text: `Сбросить: ${u.name}`, callback_data: `admin:ru:${id}` },
  ]);
  await callApi('sendMessage', {
    chat_id: chatId,
    text: 'Выбери пользователя, у которого сбросить спины:',
    reply_markup: { inline_keyboard: rows },
  });
}

async function handleCallback(query) {
  if (!isAdmin(query.from)) {
    await callApi('answerCallbackQuery', { callback_query_id: query.id, text: 'Нет доступа' });
    return;
  }
  const chatId = query.message.chat.id;
  const data = query.data || '';

  if (data === 'admin:reset_all') {
    resetAll();
    await callApi('answerCallbackQuery', { callback_query_id: query.id, text: 'Спины сброшены у всех' });
    await callApi('sendMessage', { chat_id: chatId, text: 'Готово: спины сброшены у всех.' });
  } else if (data === 'admin:users') {
    await callApi('answerCallbackQuery', { callback_query_id: query.id });
    await showUsers(chatId);
  } else if (data.startsWith('admin:ru:')) {
    const userId = data.slice('admin:ru:'.length);
    const name = readJson('users.json', {})[userId]?.name || userId;
    resetUser(userId);
    await callApi('answerCallbackQuery', { callback_query_id: query.id, text: 'Готово' });
    await callApi('sendMessage', { chat_id: chatId, text: `Готово: спины сброшены у ${name}.` });
  } else {
    await callApi('answerCallbackQuery', { callback_query_id: query.id });
  }
}

// ---------- Обработка сообщений ----------

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

  const caption = `${entry.caption}\n\n${FOOTER}`;
  console.log(`Выигрыш: ${payload.prize}`);
  try {
    await callApi('sendPhoto', {
      chat_id: chatId,
      photo: new URL(entry.photo, WEBAPP_URL).href,
      caption,
    });
  } catch (err) {
    // Если фото не отправилось, всё равно присылаем текст приза
    console.error('Фото не отправилось, шлю текстом:', err.message);
    await callApi('sendMessage', { chat_id: chatId, text: caption });
  }
}

async function handleMessage(message) {
  const chatId = message.chat.id;
  rememberUser(message.from);

  if (message.web_app_data) {
    await handleWin(chatId, message.web_app_data.data);
    return;
  }

  const text = (message.text || '').trim();
  if (text.startsWith('/start')) {
    await handleStart(chatId);
    return;
  }
  if (text.startsWith('/admin')) {
    if (!isAdmin(message.from)) {
      await callApi('sendMessage', { chat_id: chatId, text: 'Эта команда только для админа.' });
      return;
    }
    await handleAdmin(chatId);
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
        allowed_updates: ['message', 'callback_query'],
      });
      for (const update of updates) {
        offset = update.update_id + 1;
        if (update.message) {
          await handleMessage(update.message).catch((err) =>
            console.error('Ошибка обработки:', err.message)
          );
        } else if (update.callback_query) {
          await handleCallback(update.callback_query).catch((err) =>
            console.error('Ошибка кнопки:', err.message)
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
