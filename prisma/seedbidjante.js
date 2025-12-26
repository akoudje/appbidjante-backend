// prisma/seed.js
import bcrypt from "bcryptjs";
import prisma from "../src/prisma.js";

async function main() {
  const username = "superadminbidjante";
  const password = "admin123";

  // Vérifier si le superadmin existe déjà
  const existingUser = await prisma.user.findUnique({
    where: { username },
  });

  if (existingUser) {
    console.log("ℹ️ Superadmin existe déjà — aucune action");
    return;
  }

  // Hash du mot de passe
  const hashedPassword = await bcrypt.hash(password, 10);

  // Création du superadmin
  const user = await prisma.user.create({
    data: {
      username,
      password: hashedPassword,
      role: "ADMIN",
      email: "superadmin@bidjante.local",
      active: true,
    },
  });

  console.log("✅ Superadmin créé avec succès");
  console.log({
    username: user.username,
    role: user.role,
    email: user.email,
  });
}

main()
  .catch((e) => {
    console.error("❌ Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
