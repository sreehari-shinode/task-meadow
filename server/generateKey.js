const crypto = require('crypto');

// Generate a random string of 64 characters
const secretKey = crypto.randomBytes(64).toString('hex');

console.log('Your JWT Secret Key:');
console.log(secretKey); 