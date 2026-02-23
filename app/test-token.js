const jwt = require('jsonwebtoken');
const secret = "super-secret-key";
const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MywiZW1haWwiOiJsb2FkdGVzdDE3Njk5NTY4OTE3ODlAZXhhbXBsZS5jb20iLCJpYXQiOjE3Njk5NTY4OTIsImV4cCI6MTc2OTk2MDQ5Mn0.Nwbhkl-29XGAWGc9uI7E6eG634cdTeAcHgTenAebc6M";

try {
    const decoded = jwt.verify(token, secret);
    console.log("Token is valid:", decoded);
} catch (err) {
    console.log("Token is invalid:", err.message);
}
