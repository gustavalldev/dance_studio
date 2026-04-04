const crypto = require("crypto");

const KEY_LENGTH = 64;
const HASH_PREFIX = "scrypt";

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const derivedKey = crypto
    .scryptSync(password, salt, KEY_LENGTH)
    .toString("hex");

  return `${HASH_PREFIX}$${salt}$${derivedKey}`;
}

function verifyPassword(password, storedHash) {
  if (!storedHash || typeof storedHash !== "string") {
    return false;
  }

  const [prefix, salt, originalKey] = storedHash.split("$");

  if (prefix !== HASH_PREFIX || !salt || !originalKey) {
    return false;
  }

  const derivedKey = crypto
    .scryptSync(password, salt, KEY_LENGTH)
    .toString("hex");

  return crypto.timingSafeEqual(
    Buffer.from(originalKey, "hex"),
    Buffer.from(derivedKey, "hex")
  );
}

module.exports = {
  hashPassword,
  verifyPassword,
};
