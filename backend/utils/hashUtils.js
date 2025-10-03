const crypto = require('crypto');

// Configuration for secure hashing (using PBKDF2)
const HASH_ITERATIONS = 100000;
const HASH_KEYLEN = 64; // Output length in bytes
const HASH_ALGORITHM = 'sha512';
const SALT_LENGTH = 16; // Length of the salt in bytes

/**
 * Generates a secure, salted hash for the given input string using PBKDF2.
 * The salt is prepended to the hash output for storage.
 * * @param {string} input - The string to be hashed (e.g., a password).
 * @returns {Promise<string>} The output hash string (format: salt:hash).
 */
function hashStringSecure(input) {
  return new Promise((resolve, reject) => {
    // 1. Generate a cryptographically strong random salt
    const salt = crypto.randomBytes(SALT_LENGTH).toString('hex');
    
    // 2. Hash the password using PBKDF2 (Password-Based Key Derivation Function 2)
    crypto.pbkdf2(
      input, 
      salt, 
      HASH_ITERATIONS, 
      HASH_KEYLEN, 
      HASH_ALGORITHM, 
      (err, derivedKey) => {
        if (err) return reject(err);
        // 3. Store salt and hash together, separated by a colon
        resolve(`${salt}:${derivedKey.toString('hex')}`);
      }
    );
  });
}

/**
 * Compares an input string against a stored hash using the hash's embedded salt.
 * * @param {string} input - The raw string provided by the user.
 * @param {string} storedHash - The hash retrieved from the database (format: salt:hash).
 * @returns {Promise<boolean>} True if the input matches the stored hash, false otherwise.
 */
function compareHashSecure(input, storedHash) {
  return new Promise((resolve, reject) => {
    const [salt, key] = storedHash.split(':');
    if (!salt || !key) {
      return reject(new Error('Stored hash format is invalid. Must be salt:hash.'));
    }

    // Hash the input using the retrieved salt and compare
    crypto.pbkdf2(
      input, 
      salt, 
      HASH_ITERATIONS, 
      HASH_KEYLEN, 
      HASH_ALGORITHM, 
      (err, derivedKey) => {
        if (err) return reject(err);
        // Compare the newly derived key with the stored key
        resolve(derivedKey.toString('hex') === key);
      }
    );
  });
}

/**
 * Generates a non-cryptographically secure hash for non-password data like IP addresses.
 * (Synchronous and fast, suitable for logging/identification, not authentication).
 * @param {string} input - The string to be hashed (e.g., req.ip).
 * @returns {string} The SHA256 hash.
 */
function hashIP(input) {
  return crypto.createHash('sha256').update(input).digest('hex');
}

/**
 * Generates a standard UUID (v4) synchronously. Useful for creating unique IDs 
 * for temporary resources or non-database entities.
 * @returns {string} A UUID version 4 string.
 */
function generateUUID() {
    return crypto.randomUUID();
}

module.exports = { 
  hashStringSecure, 
  compareHashSecure,
  hashIP,
  generateUUID // 🟢 ADVANCE: Added synchronous UUID generation
};
