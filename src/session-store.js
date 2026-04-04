const crypto = require("crypto");

const SESSION_COOKIE = "dancestudio_session";
const SESSION_TTL_MS = 1000 * 60 * 60 * 12;
const sessions = new Map();

function createSession(user) {
  const token = crypto.randomBytes(24).toString("hex");

  sessions.set(token, {
    user,
    expiresAt: Date.now() + SESSION_TTL_MS,
  });

  return token;
}

function readSession(token) {
  if (!token) {
    return null;
  }

  const session = sessions.get(token);

  if (!session) {
    return null;
  }

  if (session.expiresAt < Date.now()) {
    sessions.delete(token);
    return null;
  }

  return session.user;
}

function destroySession(token) {
  if (token) {
    sessions.delete(token);
  }
}

module.exports = {
  SESSION_COOKIE,
  createSession,
  readSession,
  destroySession,
};
