// Хранилище данных бота: JSON-файлы в bot/data/.
// Локально файлы просто пишутся на диск.
// В GitHub Actions (есть GITHUB_TOKEN и GITHUB_REPOSITORY) каждое изменение
// дополнительно коммитится в репозиторий, иначе данные потеряются между запусками.
// Мини-приложение читает bot/data/reset.json с GitHub Pages, поэтому файл должен быть в репозитории.

const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, 'data');
const REPO = process.env.GITHUB_REPOSITORY;
const GH_TOKEN = process.env.GITHUB_TOKEN;
const GH_BRANCH = process.env.GITHUB_REF_NAME;

function readJson(name, fallback) {
  try {
    return JSON.parse(fs.readFileSync(path.join(DATA_DIR, name), 'utf8'));
  } catch {
    return fallback;
  }
}

// Записи идут по одной, чтобы не было гонки за sha при коммитах
let queue = Promise.resolve();

function saveJson(name, data) {
  queue = queue
    .then(() => write(name, data))
    .catch((err) => console.error(`Не сохранилось ${name}:`, err.message));
  return queue;
}

async function write(name, data) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  const content = `${JSON.stringify(data, null, 2)}\n`;
  fs.writeFileSync(path.join(DATA_DIR, name), content);

  if (!REPO || !GH_TOKEN || !GH_BRANCH) return;

  const url = `https://api.github.com/repos/${REPO}/contents/bot/data/${name}`;
  const headers = {
    Authorization: `Bearer ${GH_TOKEN}`,
    Accept: 'application/vnd.github+json',
    'Content-Type': 'application/json',
    'User-Agent': 'slot-bot',
  };

  let sha;
  const current = await fetch(`${url}?ref=${GH_BRANCH}`, { headers });
  if (current.ok) sha = (await current.json()).sha;

  const res = await fetch(url, {
    method: 'PUT',
    headers,
    body: JSON.stringify({
      message: `Update bot data: ${name}`,
      content: Buffer.from(content).toString('base64'),
      branch: GH_BRANCH,
      sha,
    }),
  });
  if (!res.ok) throw new Error(`GitHub ${res.status}: ${await res.text()}`);
}

module.exports = { readJson, saveJson };
