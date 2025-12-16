import { Router } from "express";
import {
  getAllSettings,
  getSettingsByCategory,
  updateSetting,
  bulkUpdateSettings,
  exportSettings,
  importSettings,
} from "../controllers/settings.controller.js";

import { ensureAuth } from "../middlewares/auth.middleware.js";

const router = Router();

router.get("/", getAllSettings);
router.get("/category/:code", getSettingsByCategory);

// protect write endpoints
router.put("/bulk", ensureAuth, bulkUpdateSettings);
router.put("/:key", ensureAuth, updateSetting);

// export/import (protected)
router.get("/export", ensureAuth, exportSettings);
router.post("/import", ensureAuth, importSettings);

export default router;
