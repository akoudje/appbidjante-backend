//scr/middlewares/auth.middleware.js

import jwt from "jsonwebtoken";
import prisma from "../prisma.js";

export async function ensureAuth(req, res, next) {
  const header = req.headers.authorization;

  if (!header || !header.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const token = header.split(" ")[1];

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);

    const user = await prisma.user.findUnique({
      where: { id: payload.id },
      select: { id: true, username: true, role: true },
    });

    if (!user) {
      return res.status(401).json({ error: "Utilisateur introuvable" });
    }

    req.user = user;
    next();
  } catch (err) {
    console.error("JWT ERROR:", err);
    return res.status(401).json({ error: "Token invalide" });
  }
}

// Pour protéger les routes admin
export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: "Non authentifié" });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        error: "Accès refusé",
        required: roles,
        current: req.user.role,
      });
    }

    next();
  };
}
