'use strict';

// node file.js duration connections

const autocannon = require('autocannon');

const args = process.argv.slice(2);

const url = 'http://localhost:3000/tasks';

const instance = autocannon(
  {
    url,
    method: 'POST',
    connections: args[1] || 200,     // concurrent connections
    pipelining: 1,        // keep simple for correctness
    duration: args[0] || 10,         // 10 second test
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiZW1haWwiOiJsb2FkdGVzdEBleGFtcGxlLmNvbSIsImlhdCI6MTc3MTgzMTE5MSwiZXhwIjoxODAzMzg4NzkxfQ.JGVjfkXnDzDeBnYZoyVPBCyrk8QN4KEFV7s8zxWstb4'
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
