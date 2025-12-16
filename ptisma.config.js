// prisma.config.js
const { defineConfig } = require('@prisma/config')

module.exports = defineConfig({
  // chemin vers ton schéma principal
  schema: './prisma/schema.prisma',

  // configuration des générateurs
  generators: {
    client: {
      provider: 'prisma-client-js',
      output: './node_modules/@prisma/client'
    }
  },

  // configuration des datasources
  datasources: {
    db: {
      provider: 'postgresql',
      url: process.env.DATABASE_URL, // récupéré depuis ton .env
    }
  },

  // configuration du seed
  seed: {
    // fichier maître qui orchestre tous tes seeds (seed.js appelle seed-settings.js, sidebarSeed.js, seedSuperAdmin.js, etc.)
    run: 'node prisma/seed.js'
  }
})
