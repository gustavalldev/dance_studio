const { QueryTypes } = require("sequelize");
const { sequelize } = require("./db");
const { verifyPassword } = require("./passwords");
const {
  SESSION_COOKIE,
  createSession,
  readSession,
  destroySession,
} = require("./session-store");

function parseCookies(cookieHeader = "") {
  return cookieHeader
    .split(";")
    .map((part) => part.trim())
    .filter(Boolean)
    .reduce((accumulator, part) => {
      const separatorIndex = part.indexOf("=");

      if (separatorIndex === -1) {
        return accumulator;
      }

      const key = part.slice(0, separatorIndex);
      const value = decodeURIComponent(part.slice(separatorIndex + 1));
      accumulator[key] = value;
      return accumulator;
    }, {});
}

function setSessionCookie(res, token) {
  res.setHeader(
    "Set-Cookie",
    `${SESSION_COOKIE}=${token}; HttpOnly; Path=/; SameSite=Lax; Max-Age=43200`
  );
}

function clearSessionCookie(res) {
  res.setHeader(
    "Set-Cookie",
    `${SESSION_COOKIE}=; HttpOnly; Path=/; SameSite=Lax; Max-Age=0`
  );
}

async function findUserByEmail(email) {
  const users = await sequelize.query(
    `
      SELECT id, full_name, email, role, password_hash
      FROM users
      WHERE email = :email
      LIMIT 1
    `,
    {
      replacements: { email },
      type: QueryTypes.SELECT,
    }
  );

  return users[0] || null;
}

async function authenticateUser(email, password) {
  const user = await findUserByEmail(email);

  if (!user) {
    return null;
  }

  if (!verifyPassword(password, user.password_hash)) {
    return null;
  }

  return {
    id: user.id,
    fullName: user.full_name,
    email: user.email,
    role: user.role,
  };
}

function getCurrentUser(req) {
  const cookies = parseCookies(req.headers.cookie);
  return readSession(cookies[SESSION_COOKIE]);
}

function attachAuthRoutes(app) {
  app.post("/api/auth/login", async (req, res) => {
    const email = String(req.body.email || "").trim().toLowerCase();
    const password = String(req.body.password || "");

    if (!email || !password) {
      return res.status(400).json({
        ok: false,
        error: "Укажите email и пароль.",
      });
    }

    try {
      const user = await authenticateUser(email, password);

      if (!user) {
        return res.status(401).json({
          ok: false,
          error: "Неверный email или пароль.",
        });
      }

      const token = createSession(user);
      setSessionCookie(res, token);

      return res.json({
        ok: true,
        user,
      });
    } catch (error) {
      return res.status(500).json({
        ok: false,
        error: "Не удалось выполнить вход.",
      });
    }
  });

  app.get("/api/auth/me", (req, res) => {
    const user = getCurrentUser(req);

    if (!user) {
      return res.status(401).json({
        ok: false,
        error: "Сессия не найдена.",
      });
    }

    return res.json({
      ok: true,
      user,
    });
  });

  app.post("/api/auth/logout", (req, res) => {
    const cookies = parseCookies(req.headers.cookie);
    destroySession(cookies[SESSION_COOKIE]);
    clearSessionCookie(res);

    return res.json({ ok: true });
  });

  app.get("/api/dashboard", (req, res) => {
    const user = getCurrentUser(req);

    if (!user) {
      return res.status(401).json({
        ok: false,
        error: "Требуется авторизация.",
      });
    }

    const roleModules = {
      admin: [
        "Управление учениками",
        "Управление преподавателями",
        "Группы и расписание",
        "Абонементы и отчеты",
      ],
      teacher: [
        "Мое расписание",
        "Посещаемость",
        "Состав групп",
      ],
      student: [
        "Мое расписание",
        "Мой абонемент",
        "История посещений",
      ],
    };

    return res.json({
      ok: true,
      user,
      modules: roleModules[user.role] || [],
    });
  });
}

module.exports = {
  attachAuthRoutes,
  getCurrentUser,
};
