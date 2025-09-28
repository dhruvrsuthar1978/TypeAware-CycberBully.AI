const crypto = require('crypto');

// Hash a string with SHA256
function hashString(input) {
  return crypto.createHash('sha256').update(input).digest('hex');
}

// Compare two hashes
function compareHash(input, hashed) {
  return hashString(input) === hashed;
}

module.exports = { hashString, compareHash };
