-- CreateEnum
CREATE TYPE "CommuniqueType" AS ENUM ('GRIOT', 'REUNION', 'CONVOCATION', 'DECES', 'COTISATION', 'GENERAL');

CREATE TYPE "CommuniqueStatut" AS ENUM ('BROUILLON', 'PUBLIE', 'ARCHIVE');
CREATE TYPE "CibleType" AS ENUM ('ALL', 'FAMILLE', 'LIGNEE', 'CATEGORIE', 'CUSTOM');
CREATE TYPE "CanalDiffusion" AS ENUM ('GRIOT', 'SMS', 'EMAIL', 'WHATSAPP', 'PUSH');
CREATE TYPE "DiffusionStatut" AS ENUM ('ENVOYE', 'ECHEC');

-- Ajout chef de lignée
ALTER TABLE "Lignee"
ADD COLUMN "chefLigneeId" TEXT;

-- Historique chef de lignée
CREATE TABLE "HistoriqueChefLignee" (
  "id" TEXT NOT NULL,
  "ligneeId" TEXT NOT NULL,
  "membreId" TEXT NOT NULL,
  "dateDebut" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "dateFin" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "HistoriqueChefLignee_pkey" PRIMARY KEY ("id")
);

-- Communiqués
CREATE TABLE "Communique" (
  "id" TEXT NOT NULL,
  "titre" TEXT NOT NULL,
  "contenu" TEXT NOT NULL,
  "type" "CommuniqueType" NOT NULL,
  "statut" "CommuniqueStatut" NOT NULL,
  "canaux" TEXT[],
  "cibleType" "CibleType" NOT NULL,
  "cibleIds" TEXT[],
  "datePublication" TIMESTAMP(3),
  "dateArchivage" TIMESTAMP(3),
  "createdById" INTEGER NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Communique_pkey" PRIMARY KEY ("id")
);

-- Diffusion
CREATE TABLE "DiffusionHistorique" (
  "id" TEXT NOT NULL,
  "communiqueId" TEXT NOT NULL,
  "canal" "CanalDiffusion" NOT NULL,
  "destinataire" TEXT NOT NULL,
  "statut" "DiffusionStatut" NOT NULL,
  "messageRetour" TEXT,
  "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "DiffusionHistorique_pkey" PRIMARY KEY ("id")
);
