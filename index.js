require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const dns = require('dns');
const app = express();

const { getLongUrl, getShortUrl, addUrl } =  require('./models.js'); // Database

// Basic Configuration
const port = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.urlencoded({ extended: true })); 
app.use('/public', express.static(`${process.cwd()}/public`));


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
