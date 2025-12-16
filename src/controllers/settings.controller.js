// src/controllers/settings.controller.js
import prisma from "../prisma.js";

/**
 * Validate value according to type + meta
 */
function validateValue(settingDef, rawValue) {
  const type = settingDef.type;
  const meta = settingDef.meta ? JSON.parse(settingDef.meta) : null;

  if (type === "boolean") {
    if (rawValue === true || rawValue === "true") return true;
    if (rawValue === false || rawValue === "false") return false;
    throw new Error("Invalid boolean value");
  }

  if (type === "number") {
    const n = Number(rawValue);
    if (Number.isNaN(n)) throw new Error("Invalid number");
    if (meta && typeof meta.min === "number" && n < meta.min)
      throw new Error(`Minimum ${meta.min}`);
    if (meta && typeof meta.max === "number" && n > meta.max)
      throw new Error(`Maximum ${meta.max}`);
    return String(n);
  }

  if (type === "select") {
    if (meta && Array.isArray(meta) && !meta.includes(rawValue))
      throw new Error("Invalid option");
    return String(rawValue);
  }

  if (type === "json") {
    try {
      if (typeof rawValue === "string") JSON.parse(rawValue);
      else JSON.stringify(rawValue);
      return typeof rawValue === "string" ? rawValue : JSON.stringify(rawValue);
    } catch (e) {
      throw new Error("Invalid JSON");
    }
  }

  return String(rawValue ?? "");
}

/* --------------------------- GET ALL ---------------------------- */
export async function getAllSettings(req, res) {
  try {
    const categories = await prisma.settingCategory.findMany({
      include: { settings: true },
      orderBy: { id: "asc" },
    });
    res.json(categories);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
}

/* --------------------------- GET CATEGORY ---------------------------- */
export async function getSettingsByCategory(req, res) {
  try {
    const { code } = req.params;
    const cat = await prisma.settingCategory.findUnique({
      where: { code },
      include: { settings: true },
    });
    if (!cat) return res.status(404).json({ error: "Category not found" });
    res.json(cat);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
}

/* --------------------------- UPDATE ONE ---------------------------- */
export async function updateSetting(req, res) {
  try {
    const { key } = req.params;
    const { value } = req.body;

    const setting = await prisma.setting.findUnique({ where: { key } });
    if (!setting) return res.status(404).json({ error: "Setting not found" });

    // Check role
    const order = ["user", "treasurer", "admin", "superadmin"];
    const userRole = req.user?.role || "user";
    const minRole = setting.minRole || "user";

    if (order.indexOf(userRole) < order.indexOf(minRole))
      return res.status(403).json({ error: "Forbidden" });

    // Validate
    let finalValue = validateValue(setting, value);

    const updated = await prisma.setting.update({
      where: { key },
      data: { value: String(finalValue) },
    });

    /* Emit websocket + SSE */
    const io = req.app?.locals?.io;
    const em = req.app?.locals?.settingsEmitter;

    if (io) {
      io.emit("settings:updated", {
        key,
        value: updated.value,
        user: req.user,
      });
    }
    if (em) {
      em.emit("updated", {
        key,
        value: updated.value,
        updatedAt: updated.updatedAt,
      });
    }

    res.json(updated);
  } catch (err) {
    console.error("updateSetting", err);
    res.status(500).json({ error: "Server error" });
  }
}

/* --------------------------- BULK UPDATE ---------------------------- */
export async function bulkUpdateSettings(req, res) {
  try {
    const items = Array.isArray(req.body) ? req.body : [];
    const results = [];
    const errors = [];

    const allSettings = await prisma.setting.findMany();
    const map = {};
    allSettings.forEach((s) => (map[s.key] = s));

    const order = ["user", "treasurer", "admin", "superadmin"];
    const userRole = req.user?.role || "user";

    for (const it of items) {
      const sDef = map[it.key];
      if (!sDef) {
        errors.push({ key: it.key, error: "Not found" });
        continue;
      }

      const minRole = sDef.minRole || "user";
      if (order.indexOf(userRole) < order.indexOf(minRole)) {
        errors.push({ key: it.key, error: "Forbidden" });
        continue;
      }

      try {
        const finalValue = validateValue(sDef, it.value);
        const updated = await prisma.setting.update({
          where: { key: it.key },
          data: { value: String(finalValue) },
        });
        results.push(updated);
      } catch (err) {
        errors.push({ key: it.key, error: err.message });
      }
    }

    const io = req.app?.locals?.io;
    const em = req.app?.locals?.settingsEmitter;

    if (io && results.length) {
      io.emit("settings:bulkUpdated", {
        updatedKeys: results.map((r) => r.key),
        user: req.user,
      });
    }

    if (em && results.length) {
      for (const r of results)
        em.emit("updated", { key: r.key, value: r.value });
    }

    res.json({ success: true, updatedCount: results.length, errors });
  } catch (err) {
    console.error("bulkUpdateSettings", err);
    res.status(500).json({ error: "Server error" });
  }
}

/* --------------------------- EXPORT ---------------------------- */
export async function exportSettings(req, res) {
  try {
    const cats = await prisma.settingCategory.findMany({
      include: { settings: true },
      orderBy: { id: "asc" },
    });

    const payload = {};
    for (const c of cats) {
      payload[c.code] = {};
      for (const s of c.settings) payload[c.code][s.key] = s.value;
    }

    res.json({
      exportedAt: new Date().toISOString(),
      data: payload,
    });
  } catch (err) {
    console.error("exportSettings", err);
    res.status(500).json({ error: "Server error" });
  }
}

/* --------------------------- IMPORT ---------------------------- */
export async function importSettings(req, res) {
  try {
    const payload = req.body?.data || req.body;
    if (!payload || typeof payload !== "object")
      return res.status(400).json({ error: "Invalid payload" });

    const updates = [];
    const allSettings = await prisma.setting.findMany();
    const map = {};
    allSettings.forEach((s) => (map[s.key] = s));

    const order = ["user", "treasurer", "admin", "superadmin"];
    const userRole = req.user?.role || "user";

    for (const cat of Object.keys(payload)) {
      for (const key of Object.keys(payload[cat])) {
        const sDef = map[key];
        if (!sDef) continue;

        const minRole = sDef.minRole || "user";
        if (order.indexOf(userRole) < order.indexOf(minRole)) continue;

        try {
          const final = validateValue(sDef, payload[cat][key]);
          const updated = await prisma.setting.update({
            where: { key },
            data: { value: String(final) },
          });
          updates.push(updated);
        } catch (err) {}
      }
    }

    const io = req.app?.locals?.io;
    const em = req.app?.locals?.settingsEmitter;

    if (io && updates.length) {
      io.emit("settings:bulkUpdated", {
        updatedKeys: updates.map((u) => u.key),
        user: req.user,
      });
    }

    if (em && updates.length) {
      updates.forEach((u) =>
        em.emit("updated", { key: u.key, value: u.value })
      );
    }

    res.json({ success: true, updatedCount: updates.length });
  } catch (err) {
    console.error("importSettings", err);
    res.status(500).json({ error: "Server error" });
  }
}
