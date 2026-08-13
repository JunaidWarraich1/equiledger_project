import { JSONFilePreset } from 'lowdb/node';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbFile = path.join(__dirname, 'data', 'db.json');

const defaultData = { history: [] };
const db = await JSONFilePreset(dbFile, defaultData);

const MAX_HISTORY = 200;

export async function logEntry(entry) {
  db.data.history.unshift({ ...entry, id: crypto.randomUUID(), createdAt: new Date().toISOString() });
  if (db.data.history.length > MAX_HISTORY) db.data.history.length = MAX_HISTORY;
  await db.write();
}

export function getHistory(limit = 50) {
  return db.data.history.slice(0, limit);
}

export default db;
