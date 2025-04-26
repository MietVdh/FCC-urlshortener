require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const app = express();

// Basic Configuration
const port = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.urlencoded({ extended: true })); 
app.use('/public', express.static(`${process.cwd()}/public`));


// Database setup
const Database = require('better-sqlite3');
const db = new Database('urls.db', { verbose: console.log });
db.pragma('journal_mode = WAL');

const createTable = "CREATE TABLE IF NOT EXISTS urls('id' INTEGER PRIMARY KEY AUTOINCREMENT, 'long_url' VARCHAR); ";
db.exec(createTable);


// Database functions
function getLongUrl(id) {
  return db.prepare('SELECT long_url FROM urls WHERE id = ?').get(id);
}

function getShortUrl(longUrl) {
  return db.prepare('SELECT id FROM urls WHERE long_url = ?').get(longUrl);
}

function addUrl(longUrl) {
  const stmt = db.prepare('INSERT INTO urls (long_url) VALUES (?)');
  const info = stmt.run(longUrl);
  console.log(info.lastInsertRowid);
  return info.lastInsertRowid;
}

// URL regex
const pattern = /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/gi;
const regex = new RegExp(pattern);


// Routes

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});


// Your first API endpoint
app.get('/api/hello', function(req, res) {
  res.json({ greeting: 'hello API' });
});


// Redirect to original url
app.get('/api/shorturl/:short_url', function(req, res) {
  shortUrl = req.params.short_url;
  longUrl = getLongUrl(shortUrl).long_url;
  res.redirect(longUrl);
});


// Add new url for shortening
app.post('/api/shorturl', function(req, res) {
  const longUrl = req.body.url;

  // If not valid URL: return error message
  if (!longUrl.match(regex)) {
    res.json({ error: 'invalid url' });
    return;
  }

  // Check if URL already in database
  const id = getShortUrl(longUrl);
  if (id) {
    res.json({ original_url: longUrl, short_url: id.id });
  }
  else {
    const shortUrl = addUrl(longUrl);
    res.json({ original_url: longUrl, short_url: shortUrl });
  }
});
  

app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});
