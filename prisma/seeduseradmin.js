// prisma/seeduseradmin.js

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Démarrage du seed...');

  // Supprimer les données existantes (optionnel)
  console.log('🗑️  Nettoyage des données existantes...');
  await prisma.user.deleteMany();

  // Hash par défaut pour tous les mots de passe
  const defaultPassword = '123456';
  const hashedPassword = await bcrypt.hash(defaultPassword, 10);

  // Liste des utilisateurs à créer
  const users = [
    {
      username: 'superadmin',
      email: 'superadmin@bidjante.com',
      password: hashedPassword,
      role: 'superadmin',
      active: true,
    },
    {
      username: 'admin',
      email: 'admin@bidjante.com',
      password: hashedPassword,
      role: 'admin',
      active: true,
    },
    {
      username: 'tresorier',
      email: 'tresorier@bidjante.com',
      password: hashedPassword,
      role: 'treasurer',
      active: true,
    },
    {
      username: 'utilisateur',
      email: 'user@bidjante.com',
      password: hashedPassword,
      role: 'user',
      active: true,
    },
    {
      username: 'membre',
      email: 'membre@bidjante.com',
      password: hashedPassword,
      role: 'user',
      active: true,
    },
    {
      username: 'inactif',
      email: 'inactif@bidjante.com',
      password: hashedPassword,
      role: 'user',
      active: false, // Compte désactivé pour test
    },
  ];

  console.log('👥 Création des utilisateurs...');
  
  for (const userData of users) {
    try {
      const user = await prisma.user.upsert({
        where: { username: userData.username },
        update: userData,
        create: userData,
      });
      
      console.log(`✅ ${user.role} créé : ${user.username}`);
    } catch (error) {
      console.error(`❌ Erreur création ${userData.username}:`, error.message);
    }
  }

  // Vérification
  console.log('\n📋 Liste des utilisateurs créés :');
  const allUsers = await prisma.user.findMany({
    select: {
      id: true,
      username: true,
      email: true,
      role: true,
      active: true,
      createdAt: true,
    },
    orderBy: {
      role: 'asc',
    },
  });

  console.table(allUsers);

  console.log('\n🔑 Identifiants de test :');
  console.log('='.repeat(50));
  users.forEach(user => {
    console.log(`👤 ${user.role.toUpperCase()}`);
    console.log(`   Username: ${user.username}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Password: ${defaultPassword}`);
    console.log(`   Active: ${user.active ? '✅' : '❌'}`);
    console.log('-'.repeat(50));
  });

  console.log('\n✅ Seed terminé avec succès !');
}

main()
  .catch((error) => {
    console.error('❌ Erreur lors du seed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });