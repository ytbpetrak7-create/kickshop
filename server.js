const http = require('https');
const url = require('url');

const CLIENT_ID = '01KJDBHDCTMKE7JFHFDS7PH6X4';
const REDIRECT_URI = 'https://ytbpetrak7-create.github.io/kickshop/shop.html';
const PORT = 3000;

function post(path, body) {
  return new Promise((resolve, reject) => {
    const data = new URLSearchParams(body).toString();
    const req = http.request({
      hostname: 'id.kick.com',
      path: path,
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(data)
      }
    }, res => {
      let chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => {
        try { resolve(JSON.parse(chunks.join(''))); }
        catch(e) { resolve({ error: chunks.join('') }); }
      });
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

function get(path, token) {
  return new Promise((resolve, reject) => {
    const req = http.request({
      hostname: 'api.kick.com',
      path: path,
      method: 'GET',
      headers: { 'Authorization': 'Bearer ' + token }
    }, res => {
      let chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => {
        try { resolve(JSON.parse(chunks.join(''))); }
        catch(e) { resolve({ error: chunks.join('') }); }
      });
    });
    req.on('error', reject);
    req.end();
  });
}

const server = http.createServer(async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    return res.end();
  }

  if (req.method === 'POST' && req.url === '/api/exchange') {
    let body = '';
    req.on('data', c => body += c);
    req.on('end', async () => {
      try {
        const { code, codeVerifier } = JSON.parse(body);

        const tokenData = await post('/oauth/token', {
          grant_type: 'authorization_code',
          client_id: CLIENT_ID,
          code: code,
          redirect_uri: REDIRECT_URI,
          code_verifier: codeVerifier
        });

        if (!tokenData.access_token) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({ error: 'Token exchange failed', details: tokenData }));
        }

        const userData = await get('/public/v1/users', tokenData.access_token);

        const username = userData.data?.username || userData.data?.name || null;

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ username }));
      } catch(e) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: e.message }));
      }
    });
    return;
  }

  res.writeHead(404);
  res.end('Not found');
});

server.listen(PORT, () => {
  console.log('Kick Auth server running on http://localhost:' + PORT);
  console.log('Otevri https://ytbpetrak7-create.github.io/kickshop/shop.html');
});
