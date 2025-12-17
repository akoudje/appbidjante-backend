-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "public"."Categorie" (
    "id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "generation" TEXT NOT NULL,
    "classe" TEXT NOT NULL,
    "born_from" INTEGER,
    "born_to" INTEGER,
    "date_sortie_1er_guerrier" TIMESTAMP(3) NOT NULL,
    "date_sortie_2eme_guerrier" TIMESTAMP(3),
    "description" TEXT,

    CONSTRAINT "Categorie_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Cotisation" (
    "id" SERIAL NOT NULL,
    "membreId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "montant" INTEGER NOT NULL,
    "motif" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "paidAt" TIMESTAMP(3),
    "decesId" TEXT,
    "statutCotisation" TEXT NOT NULL DEFAULT 'Impaye',

    CONSTRAINT "Cotisation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."CotisationLignee" (
    "id" SERIAL NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "montant" INTEGER NOT NULL,
    "motif" TEXT,
    "statut" TEXT NOT NULL DEFAULT 'Impaye',
    "decesId" TEXT NOT NULL,
    "ligneeId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "paidAt" TIMESTAMP(3),

    CONSTRAINT "CotisationLignee_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Deces" (
    "id" TEXT NOT NULL,
    "membreId" TEXT NOT NULL,
    "dateDeces" TIMESTAMP(3) NOT NULL,
    "motif" TEXT,

    CONSTRAINT "Deces_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Enterrement" (
    "id" TEXT NOT NULL,
    "decesId" TEXT NOT NULL,
    "declareAuVillage" BOOLEAN NOT NULL DEFAULT false,
    "funeraillesAuVillage" BOOLEAN NOT NULL DEFAULT false,
    "enterreAuVillage" BOOLEAN NOT NULL DEFAULT false,
    "lieuEnterrement" TEXT,
    "dateEnterrement" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Enterrement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."GrandeFamille" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,

    CONSTRAINT "GrandeFamille_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Lignee" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "familleId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Lign├⌐e_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Membre" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "prenoms" TEXT NOT NULL,
    "genre" TEXT NOT NULL,
    "dateNaissance" TIMESTAMP(3),
    "photo" TEXT,
    "categorieId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ligneeId" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3),
    "statutMembre" TEXT NOT NULL DEFAULT 'Actif',
    "contact1" TEXT,
    "contact2" TEXT,
    "email" TEXT,

    CONSTRAINT "Membre_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."MenuGroup" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "visible" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "MenuGroup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."MenuItem" (
    "id" SERIAL NOT NULL,
    "label" TEXT NOT NULL,
    "path" TEXT,
    "icon" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "visible" BOOLEAN NOT NULL DEFAULT true,
    "minRole" TEXT NOT NULL DEFAULT 'user',
    "groupId" INTEGER,
    "parentId" INTEGER,

    CONSTRAINT "MenuItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Paiement" (
    "id" SERIAL NOT NULL,
    "cotisationId" INTEGER NOT NULL,
    "montant" INTEGER NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "mode" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Paiement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."PaiementLignee" (
    "id" SERIAL NOT NULL,
    "cotisationId" INTEGER NOT NULL,
    "montant" INTEGER NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "mode" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PaiementLignee_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Setting" (
    "id" SERIAL NOT NULL,
    "key" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "value" TEXT,
    "type" TEXT NOT NULL,
    "meta" TEXT,
    "categoryId" INTEGER NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "minRole" TEXT,
    "visible" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Setting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."SettingCategory" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,

    CONSTRAINT "SettingCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."User" (
    "id" SERIAL NOT NULL,
    "email" TEXT,
    "role" TEXT NOT NULL DEFAULT 'user',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "password" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "username" TEXT NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Cotisation_membreId_decesId_key" ON "public"."Cotisation"("membreId" ASC, "decesId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "CotisationLignee_decesId_ligneeId_key" ON "public"."CotisationLignee"("decesId" ASC, "ligneeId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "Deces_membreId_key" ON "public"."Deces"("membreId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "Enterrement_decesId_key" ON "public"."Enterrement"("decesId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "GrandeFamille_nom_key" ON "public"."GrandeFamille"("nom" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "Lignee_nom_key" ON "public"."Lignee"("nom" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "Membre_nom_prenoms_key" ON "public"."Membre"("nom" ASC, "prenoms" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "MenuGroup_code_key" ON "public"."MenuGroup"("code" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "MenuItem_path_key" ON "public"."MenuItem"("path" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "Setting_key_key" ON "public"."Setting"("key" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "SettingCategory_code_key" ON "public"."SettingCategory"("code" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "public"."User"("email" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "public"."User"("username" ASC);

-- AddForeignKey
ALTER TABLE "public"."Cotisation" ADD CONSTRAINT "Cotisation_decesId_fkey" FOREIGN KEY ("decesId") REFERENCES "public"."Deces"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Cotisation" ADD CONSTRAINT "Cotisation_membreId_fkey" FOREIGN KEY ("membreId") REFERENCES "public"."Membre"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CotisationLignee" ADD CONSTRAINT "CotisationLignee_decesId_fkey" FOREIGN KEY ("decesId") REFERENCES "public"."Deces"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CotisationLignee" ADD CONSTRAINT "CotisationLignee_ligneeId_fkey" FOREIGN KEY ("ligneeId") REFERENCES "public"."Lignee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Deces" ADD CONSTRAINT "Deces_membreId_fkey" FOREIGN KEY ("membreId") REFERENCES "public"."Membre"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Enterrement" ADD CONSTRAINT "Enterrement_decesId_fkey" FOREIGN KEY ("decesId") REFERENCES "public"."Deces"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Lignee" ADD CONSTRAINT "Lign├⌐e_familleId_fkey" FOREIGN KEY ("familleId") REFERENCES "public"."GrandeFamille"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Membre" ADD CONSTRAINT "Membre_categorieId_fkey" FOREIGN KEY ("categorieId") REFERENCES "public"."Categorie"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Membre" ADD CONSTRAINT "Membre_ligneeId_fkey" FOREIGN KEY ("ligneeId") REFERENCES "public"."Lignee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."MenuItem" ADD CONSTRAINT "MenuItem_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "public"."MenuGroup"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."MenuItem" ADD CONSTRAINT "MenuItem_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "public"."MenuItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Paiement" ADD CONSTRAINT "Paiement_cotisationId_fkey" FOREIGN KEY ("cotisationId") REFERENCES "public"."Cotisation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PaiementLignee" ADD CONSTRAINT "PaiementLignee_cotisationId_fkey" FOREIGN KEY ("cotisationId") REFERENCES "public"."CotisationLignee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Setting" ADD CONSTRAINT "Setting_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "public"."SettingCategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

