import prisma from "../src/prisma.js";
import { hashPassword } from "../src/utils/hash.js";

async function run() {
  const username = "admin";
  const password = "Admin@1234"; // change immediately
  const email = "admin@local";
  const hashed = await hashPassword(password);

  const u = await prisma.user.upsert({
    where: { username },
    update: { password: hashed, role: "superadmin", active: true, email },
    create: { username, password: hashed, role: "superadmin", active: true, email },
  });

  console.log("Admin created", u.id);
  process.exit(0);
}

run().catch((e) => { console.error(e); process.exit(1); });
