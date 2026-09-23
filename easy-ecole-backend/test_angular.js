const http = require('http');

const req = http.request({
  hostname: 'localhost',
  port: 4200,
  path: '/',
  method: 'GET',
  timeout: 5000
}, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log('STATUS:', res.statusCode);
    console.log('HEADERS:', JSON.stringify(res.headers, null, 2));
    console.log('BODY LENGTH:', data.length);
    console.log('BODY START:', data.substring(0, 500));
  });
});
req.on('error', (err) => {
  console.log('ERROR:', err.code, err.message);
});
req.end();
