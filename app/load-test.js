'use strict';

const autocannon = require('autocannon');

const fs = require('fs');
const path = require('path');

const url = 'http://localhost:3000/tasks';

// Load token from token.txt if it exists
let token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiZW1haWwiOiJsb2FkdGVzdEBleGFtcGxlLmNvbSIsImlhdCI6MTc3MTgzMDk0OSwiZXhwI6MTgwMzM4ODU0OX0.fBKehGy87O44OUyWTT6NKXPFKCbIA9MtV6XEpbaP2-I';
try {
  const tokenPath = path.join(__dirname, 'token.txt');
  if (fs.existsSync(tokenPath)) {
    token = fs.readFileSync(tokenPath, 'utf8').trim();
    console.log('✅ Loaded fresh token from token.txt');
  }
} catch (err) {
  console.warn('⚠️ Could not read token.txt, using fallback token');
}

const instance = autocannon(
  {
    url,
    method: 'POST',
    connections: 200,     // concurrent connections
    pipelining: 1,        // keep simple for correctness
    duration: 10,         // 10 second test
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      title: 'load-test-task',
      userId: 1,
    }),
  },
  finished
);

autocannon.track(instance);

function finished(err, res) {
  if (err) {
    console.error('❌ Load test failed', err);
    return;
  }

  console.log('✅ Load test completed');
  console.log(res);
}
