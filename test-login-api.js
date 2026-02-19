const http = require('http');

const postData = JSON.stringify({
  email: 'ppython2020@proton.me',
  password: '111111'
});

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/auth/login',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(postData)
  }
};

console.log('Testing login API...\n');
console.log('Request:', postData);

const req = http.request(options, (res) => {
  console.log('Status:', res.statusCode);
  
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log('Response:', data);
    try {
      const json = JSON.parse(data);
      if (json.token) {
        console.log('\n✅ Login successful! Token received.');
      } else {
        console.log('\n❌ Login failed:', json.error);
      }
    } catch (e) {
      console.log('\nRaw response:', data);
    }
  });
});

req.on('error', (e) => {
  console.error('❌ Request failed:', e.message);
  console.log('Make sure the server is running: npm run dev');
});

req.write(postData);
req.end();
