//src/middlewares/auth.js

import jwt from "jsonwebtoken";
import prisma from "../prisma.js";


export function verifyToken(req, res, next) {
  const header = req.headers.authorization;

  if (!header || !header.startsWith("Bearer "))
    return res.status(401).json({ error: "Token manquant" });

  const token = header.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "votre-secret-jwt-par-defaut");

    req.user = decoded;
    
    next();
  } catch (error) {
    return res.status(401).json({ error: "Token invalide ou expiré" });
  }
}
