const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');

// Extract secret from the config if possible, or use the known one
const secret = "super-secret-key";

const payload = {
    id: 1,
    email: "loadtest@example.com"
};

const token = jwt.sign(payload, secret, { expiresIn: '1y' });

console.log('Generated new token (valid for 1 year):');
console.log(token);

// Update load-test.js
const loadTestPath = path.join(__dirname, 'load-test.js');
let content = fs.readFileSync(loadTestPath, 'utf8');

const tokenRegex = /'Authorization': 'Bearer [^']+'/;
content = content.replace(tokenRegex, `'Authorization': 'Bearer ${token}'`);

fs.writeFileSync(loadTestPath, content);
console.log('\nUpdated load-test.js with the new token.');
