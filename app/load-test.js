'use strict';

const autocannon = require('autocannon');

const url = 'http://localhost:3000/tasks';

const instance = autocannon(
  {
    url,
    method: 'POST',
    connections: 200,     // concurrent connections
    pipelining: 1,        // keep simple for correctness
    duration: 10,         // 10 second test
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiZW1haWwiOiJsb2FkdGVzdEBleGFtcGxlLmNvbSIsImlhdCI6MTc3MTgzMDk0OSwiZXhwIjoxODAzMzg4NTQ5fQ.fBKehGy87O44OUyWTT6NKXPFKCbIA9MtV6XEpbaP2-I'
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
