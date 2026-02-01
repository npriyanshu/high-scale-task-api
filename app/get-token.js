const http = require('http');
const fs = require('fs');

function request(path, method, body) {
    return new Promise((resolve, reject) => {
        const data = JSON.stringify(body);
        const options = {
            hostname: 'localhost',
            port: 3000,
            path: path,
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': data.length
            }
        };

        const req = http.request(options, (res) => {
            let responseBody = '';
            res.on('data', (chunk) => {
                responseBody += chunk;
            });
            res.on('end', () => {
                resolve({ statusCode: res.statusCode, body: JSON.parse(responseBody || '{}') });
            });
        });

        req.on('error', (error) => {
            reject(error);
        });

        req.write(data);
        req.end();
    });
}

async function main() {
    const email = 'loadtest' + Date.now() + '@example.com';
    const password = 'password123';

    console.log(`Registering ${email}...`);
    try {
        const regRes = await request('/auth/register', 'POST', {
            name: 'Load Tester',
            email,
            password
        });
        console.log('Register response:', regRes.statusCode, regRes.body);

        console.log('Logging in...');
        const loginRes = await request('/auth/login', 'POST', {
            email,
            password
        });
        console.log('Login response:', loginRes.statusCode, loginRes.body);

        if (loginRes.body.token) {
            console.log('TOKEN received');
            fs.writeFileSync('token.txt', loginRes.body.token);
        }
    } catch (err) {
        console.error('Error:', err);
    }
}

main();
