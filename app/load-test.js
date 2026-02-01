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
      'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MywiZW1haWwiOiJsb2FkdGVzdDE3Njk5NTY4OTE3ODlAZXhhbXBsZS5jb20iLCJpYXQiOjE3Njk5NTY4OTIsImV4cCI6MTc2OTk2MDQ5Mn0.Nwbhkl-29XGAWGc9uI7E6eG634cdTeAcHgTenAebc6M'
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
