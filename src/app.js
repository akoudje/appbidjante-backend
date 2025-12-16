// src/app.js
import express from "express";
import cors from "cors";

import membresRoutes from "./routes/membres.routes.js";
import categoriesRoutes from "./routes/categories.routes.js";
import famillesRoutes from "./routes/familles.routes.js";
import decesRoutes from "./routes/deces.routes.js";
import cotisationsRoutes from "./routes/cotisations.routes.js";
import ligneesRoutes from "./routes/lignees.routes.js";
import soldesRoutes from "./routes/soldes.routes.js";
import bilanRoutes from "./routes/bilan.routes.js";
import dashboardRoutes from "./routes/dashboard.routes.js";
import paiementsRoutes from "./routes/paiements.routes.js";
import archivesRoutes from "./routes/archives.routes.js";
import enterrementsRoutes from "./routes/enterrements.routes.js";
import settingsRoutes from "./routes/settings.routes.js";
import menuRoutes from "./routes/menu.routes.js";

import authRoutes from "./routes/auth.routes.js";
import usersRoutes from "./routes/users.routes.js";

import path from "path";
import { fileURLToPath } from "url";
import { EventEmitter } from "events";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();

app.use(cors());
app.use(express.json());

/* STATIC FILES */
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

/* EVENT EMITTER for SSE */
const settingsEmitter = new EventEmitter();
app.locals.settingsEmitter = settingsEmitter;

/* SSE endpoint */
app.get("/api/settings/stream", (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();

  const listener = (payload) => {
    res.write(`data: ${JSON.stringify(payload)}\n\n`);
  };

  settingsEmitter.on("updated", listener);

  req.on("close", () => {
    settingsEmitter.removeListener("updated", listener);
  });
});

/* no global fake user in production; keep temporarily for dev behind env guard */
if (process.env.NODE_ENV === "development" && process.env.FORCE_DEV_USER === "true") {
  app.use((req, res, next) => {
    req.user = { id: 1, role: "superadmin", username: "dev" };
    next();
  });
}

app.use("/api/auth", authRoutes);
app.use("/api/users", usersRoutes);
app.use("/api/menu", menuRoutes);

/* ROUTES */
app.use("/api/membres", membresRoutes);
app.use("/api/categories", categoriesRoutes);
app.use("/api/familles", famillesRoutes);
app.use("/api/deces", decesRoutes);
app.use("/api/cotisations", cotisationsRoutes);
app.use("/api/paiements", paiementsRoutes);
app.use("/api/lignees", ligneesRoutes);
app.use("/api/soldes", soldesRoutes);
app.use("/api/bilan", bilanRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/archives", archivesRoutes);
app.use("/api/enterrements", enterrementsRoutes);
app.use("/api/usersmanagements", usersRoutes);
app.use("/api/register", usersRoutes);
app.use("/api/settings", settingsRoutes);


export default app;
