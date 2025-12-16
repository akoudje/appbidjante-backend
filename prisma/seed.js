// prisma/seed.js
import seedSettings from "./seed-settings.js";
import sidebarSeed from "./sidebarSeed.js";
//import seedSuperAdmin from "./seedSuperAdmin.js";
import seedData from "./seedData.js";

async function main() {
  console.log("🌱 Lancement des seeds...");

  await seedSettings();
  await sidebarSeed();
  //await seedSuperAdmin();
  await seedData();

  console.log("✅ Tous les seeds exécutés !");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
