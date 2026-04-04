const path = require("path");
const express = require("express");
const { app: appConfig } = require("./config");
const { checkDatabaseConnection, ensureAppSchema } = require("./db");
const { attachAuthRoutes } = require("./auth");
const { attachAdminRoutes } = require("./admin");
const { attachTeacherRoutes } = require("./teacher");
const { attachStudentRoutes } = require("./student");

const app = express();
const publicDir = path.resolve(__dirname, "../public");

function sendPublicPage(res, pageName) {
  res.sendFile(path.resolve(publicDir, pageName));
}

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(publicDir));

attachAuthRoutes(app);
attachAdminRoutes(app);
attachTeacherRoutes(app);
attachStudentRoutes(app);

app.get("/api/health", async (_req, res) => {
  try {
    await checkDatabaseConnection();
    res.json({ ok: true, database: "up" });
  } catch (error) {
    res.status(503).json({
      ok: false,
      database: "down",
      error: error.message,
    });
  }
});

app.get("/", (_req, res) => {
  sendPublicPage(res, "index.html");
});

app.get("/admin", (_req, res) => {
  sendPublicPage(res, "admin.html");
});

app.get("/teacher", (_req, res) => {
  sendPublicPage(res, "teacher.html");
});

app.get("/student", (_req, res) => {
  sendPublicPage(res, "student.html");
});

app.use((_req, res) => {
  res.status(404).send("Not found");
});

async function startServer() {
  try {
    await checkDatabaseConnection();
    await ensureAppSchema();
    console.log("DanceStudio database schema is ready.");
  } catch (error) {
    console.error(`DanceStudio startup warning: ${error.message}`);
  }

  app.listen(appConfig.port, () => {
    console.log(`DanceStudio app listening on http://localhost:${appConfig.port}`);
  });
}

startServer();
