-- =========================
-- TABLE: Amende
-- =========================
CREATE TABLE IF NOT EXISTS "Amende" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reference TEXT NOT NULL UNIQUE,
  type TEXT NOT NULL,
  motif TEXT NOT NULL,
  montant INTEGER,

  description TEXT NOT NULL,
  "dateDecision" TIMESTAMP NOT NULL DEFAULT now(),
  "dateLimite" TIMESTAMP,
  statut TEXT NOT NULL DEFAULT 'EN_ATTENTE',

  "createdById" INTEGER NOT NULL,

  "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),

  CONSTRAINT "Amende_createdBy_fkey"
    FOREIGN KEY ("createdById") REFERENCES "User"(id)
    ON DELETE RESTRICT
);

-- =========================
-- TABLE: AmendeCible
-- =========================
CREATE TABLE IF NOT EXISTS "AmendeCible" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL,
  "cibleId" TEXT NOT NULL,
  "cibleNom" TEXT NOT NULL,
  "ciblePrenom" TEXT NOT NULL,
  "amendeId" UUID NOT NULL,

  CONSTRAINT "AmendeCible_amende_fkey"
    FOREIGN KEY ("amendeId") REFERENCES "Amende"(id)
    ON DELETE CASCADE
);

-- =========================
-- TABLE: AmendePaiement
-- =========================
CREATE TABLE IF NOT EXISTS "AmendePaiement" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  montant INTEGER NOT NULL,
  "datePaiement" TIMESTAMP NOT NULL DEFAULT now(),
  mode TEXT,
  "amendeId" UUID NOT NULL,

  CONSTRAINT "AmendePaiement_amende_fkey"
    FOREIGN KEY ("amendeId") REFERENCES "Amende"(id)
    ON DELETE CASCADE
);

-- =========================
-- TABLE: AmendeRelance
-- =========================
CREATE TABLE IF NOT EXISTS "AmendeRelance" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  canal TEXT NOT NULL,
  message TEXT,
  "dateEnvoi" TIMESTAMP NOT NULL DEFAULT now(),
  "amendeId" UUID NOT NULL,

  CONSTRAINT "AmendeRelance_amende_fkey"
    FOREIGN KEY ("amendeId") REFERENCES "Amende"(id)
    ON DELETE CASCADE
);
