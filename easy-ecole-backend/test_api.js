const http = require('http');

const test = (path, body = null, method = 'GET') => {
  return new Promise((resolve, reject) => {
    const b = body ? JSON.stringify(body) : null;
    const options = {
      hostname: 'localhost',
      port: 3000,
      path,
      method,
      headers: { 'Content-Type': 'application/json' }
    };
    if (b) options.headers['Content-Length'] = Buffer.byteLength(b);

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => resolve({ status: res.statusCode, body: data }));
    });
    req.on('error', reject);
    if (b) req.write(b);
    req.end();
  });
};

(async () => {
  console.log('=== HEALTH ===');
  console.log(await test('/health'));

  console.log('\n=== LOGIN (wrong creds) ===');
  console.log(await test('/api/v1/auth/login', { email: 'tepitechbuild@gmail.com', motDePasse: 'test123' }, 'POST'));

  console.log('\n=== LOGIN (no user) ===');
  console.log(await test('/api/v1/auth/login', { email: 'inconnu@test.com', motDePasse: 'test' }, 'POST'));

  console.log('\n=== RATTRAPAGE-COMITE /demandes ===');
  console.log(await test('/api/v1/inscription/rattrapage-comite/demandes'));
})();
