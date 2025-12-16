// prisma/seedSuperAdmin.js
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('👑 Création du SuperAdmin...');

  const superAdminData = {
    username: 'superadmin',
    email: 'superadmin@bidjante.com',
    password: await bcrypt.hash('admin123', 10),
    role: 'superadmin',
    active: true,
  };

  try {
    // Vérifier d'abord si le modèle existe
    console.log('📦 Initialisation de Prisma Client...');
    
    // Méthode 1: Utiliser create directement (au lieu de upsert)
    const existingUser = await prisma.user.findUnique({
      where: { username: superAdminData.username }
    });

    let superAdmin;
    
    if (existingUser) {
      console.log('⚠️  SuperAdmin existe déjà, mise à jour...');
      superAdmin = await prisma.user.update({
        where: { username: superAdminData.username },
        data: superAdminData,
      });
    } else {
      console.log('➕ Création du SuperAdmin...');
      superAdmin = await prisma.user.create({
        data: superAdminData,
      });
    }

    console.log('\n✅ SuperAdmin créé avec succès !');
    console.log('='.repeat(50));
    console.log('🔐 Identifiants :');
    console.log(`   Username: ${superAdmin.username}`);
    console.log(`   Email: ${superAdmin.email}`);
    console.log(`   Password: admin123`);
    console.log(`   Role: ${superAdmin.role}`);
    console.log(`   Active: ${superAdmin.active ? '✅' : '❌'}`);
    console.log(`   ID: ${superAdmin.id}`);
    console.log('='.repeat(50));
    
    console.log('\n💡 Conseil :');
    console.log('Changez le mot de passe après la première connexion !');

  } catch (error) {
    console.error('❌ Erreur création SuperAdmin:', error);
    console.error('Détails:', error.message);
    
    // Afficher plus de détails sur l'erreur
    if (error.code) {
      console.error('Code erreur:', error.code);
    }
    if (error.meta) {
      console.error('Métadonnées:', error.meta);
    }
    
    throw error;
  }
}

// Version alternative plus simple et robuste
async function seedSuperAdmin() {
  console.log('👑 Création du SuperAdmin (version simple)...');
  
  try {
    // Vérifier que la connexion à la base de données fonctionne
    console.log('🔗 Test connexion base de données...');
    await prisma.$connect();
    console.log('✅ Connexion DB OK');
    
    // Créer directement
    const user = await prisma.user.create({
      data: {
        username: 'superadmin',
        email: 'superadmin@bidjante.com',
        password: await bcrypt.hash('admin123', 10),
        role: 'superadmin',
        active: true,
      },
    });
    
    console.log('✅ SuperAdmin créé:', user.username);
    return user;
    
  } catch (error) {
    // Si l'utilisateur existe déjà
    if (error.code === 'P2002') {
      console.log('⚠️  SuperAdmin existe déjà, mise à jour...');
      
      const updatedUser = await prisma.user.update({
        where: { username: 'superadmin' },
        data: {
          role: 'superadmin',
          active: true,
          password: await bcrypt.hash('admin123', 10),
        },
      });
      
      console.log('✅ SuperAdmin mis à jour:', updatedUser.username);
      return updatedUser;
    }
    
    throw error;
  }
}

// Exécution
seedSuperAdmin()
  .then((user) => {
    console.log('\n🎉 Seed terminé avec succès !');
    console.log(`Utilisateur créé: ${user.username} (ID: ${user.id})`);
  })
  .catch((error) => {
    console.error('❌ Seed échoué:', error.message);
    
    // Suggestions de dépannage
    console.log('\n🔧 Suggestions de dépannage :');
    console.log('1. Vérifiez votre fichier .env');
    console.log('2. Lancez "npx prisma generate"');
    console.log('3. Lancez "npx prisma db push"');
    console.log('4. Vérifiez votre schéma Prisma');
    
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });