const Database = require('better-sqlite3');
const db = new Database('urls.db', { verbose: console.log });
db.pragma('journal_mode = WAL');

const createTable = "CREATE TABLE IF NOT EXISTS url('id' INTEGER PRIMARY KEY AUTOINCREMENT, 'long_url' VARCHAR); ";
db.exec(createTable);


// Database functions
function getLongUrl(id) {
  return db.prepare('SELECT long_url FROM url WHERE id = ?').get(id);
}

function getShortUrl(longUrl) {
  return db.prepare('SELECT id FROM url WHERE long_url = ?').get(longUrl);
}

function addUrl(longUrl) {
  const stmt = db.prepare('INSERT INTO url (long_url) VALUES (?)');
  const info = stmt.run(longUrl);
  console.log(info.lastInsertRowid);
  return info.lastInsertRowid;
}

module.exports = { getLongUrl, getShortUrl, addUrl }