// backend/src/middleware/upload.js
import multer from "multer";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 📁 Dossier uploads DANS ton backend
const uploadDir = path.join(__dirname, "../../uploads/membres");

// Créer dossier si absent
fs.mkdirSync(uploadDir, { recursive: true });

// 🚀 Storage
const storage = multer.diskStorage({
  destination: (_, __, cb) => cb(null, uploadDir),
  filename: (_, file, cb) => {
    const ext = path.extname(file.originalname);
    const name =
      Date.now() + "_" + Math.random().toString(36).substring(2, 12);
    cb(null, name + ext);
  },
});

export const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2 MB
});
