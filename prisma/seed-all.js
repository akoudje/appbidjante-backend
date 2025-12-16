// prisma/seed-all.js
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

async function runAllSeeds() {
  console.log("🚀 Lancement de tous les seeds...");
  
  const seeds = [
    'node prisma/seed.js',
    'node prisma/seed-settings.js',
    'node prisma/sidebarSeed.js',
    'node prisma/seedSuperAdmin.js'
  ];

  for (const seed of seeds) {
    console.log(`\n▶️  Exécution: ${seed}`);
    try {
      const { stdout, stderr } = await execAsync(seed);
      if (stdout) console.log(stdout);
      if (stderr) console.error(stderr);
    } catch (error) {
      console.error(`❌ Erreur avec ${seed}:`, error.message);
    }
  }

  console.log("\n✅ Tous les seeds ont été exécutés !");
}

runAllSeeds();