require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const dns = require('dns');
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

// URL regex
// const pattern = /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/gi;
// const regex = new RegExp(pattern);


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
  try {
    longUrl = getLongUrl(shortUrl).long_url;
    res.redirect(longUrl);
  } catch (e) {
    res.json({ error: 'No short URL found for the given input' });
  }
});


// Add new url for shortening
app.post('/api/shorturl', function(req, res) {
  const longUrl = req.body.url;

  try {
    const urlObject = new URL(longUrl);
    dns.lookup(urlObject.hostname, (err, address, family) => {
      if (err) {
        throw Error;
      } 
      const id = getShortUrl(longUrl);
      if (id) {
        res.json({ original_url: longUrl, short_url: id.id });
      }
      else {
        const shortUrl = addUrl(longUrl);
        res.json({ original_url: longUrl, short_url: shortUrl });
      }   
    })
  } catch (e) {
    res.json({ error: 'invalid url' });
  }   
});
  

app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});
