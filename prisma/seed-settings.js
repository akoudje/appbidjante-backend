// prisma/seed-settings.js
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export default async function seedSettings() {
  console.log("➡️ Seed Settings...");

  const username = "admin";
  const password = "admin123"; // ⚠️ à changer après login
  const hashed = await bcrypt.hash(password, 10);

  await prisma.user.upsert({
    where: { email: "admin@bidjante.local" },
    update: { role: "superadmin", active: true },
    create: {
      email: "admin@bidjante.local",
      username,
      password: hashed,
      role: "superadmin",
      active: true,
    },
  });

  const categories = [
    { code: "general", name: "Général" },
    { code: "appearance", name: "Affichage" },
    { code: "tables", name: "Tables & Data" },
    { code: "paiements", name: "Paiements" },
    { code: "security", name: "Sécurité" },
  ];

  for (const c of categories) {
    await prisma.settingCategory.upsert({
      where: { code: c.code },
      update: { name: c.name },
      create: c,
    });
  }

  const cats = await prisma.settingCategory.findMany();
  const map = {};
  cats.forEach((c) => (map[c.code] = c.id));

  const settings = [
    { key: "theme", label: "Thème", type: "select", meta: JSON.stringify(["system","light","dark"]), categoryId: map.general, value: "system", minRole: "user" },
    { key: "datatable_page_size", label: "Page size", type: "number", meta: JSON.stringify({ min: 5, max: 500 }), categoryId: map.tables, value: "15", minRole: "user" },
    { key: "datatable_compact", label: "Mode compact", type: "boolean", categoryId: map.tables, value: "false", minRole: "user" },
    { key: "datatable_auto_fit", label: "Auto-fit colonnes", type: "boolean", categoryId: map.tables, value: "true", minRole: "user" },
    { key: "paiement_mode_default", label: "Mode paiement par défaut", type: "select", meta: JSON.stringify(["Espèces","Mobile Money","Virement"]), categoryId: map.paiements, value: "Espèces", minRole: "treasurer" },
    { key: "lock_after_minutes", label: "Verrouillage auto (min)", type: "number", meta: JSON.stringify({ min: 0, max: 120 }), categoryId: map.security, value: "5", minRole: "admin" },
  ];

  for (const s of settings) {
    await prisma.setting.upsert({
      where: { key: s.key },
      update: { ...s },
      create: s,
    });
  }

  console.log("✔ Seed Settings terminé !");
}
