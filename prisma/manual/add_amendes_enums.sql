-- =========================
-- ENUMS AMENDES
-- =========================

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'amende_type') THEN
    CREATE TYPE amende_type AS ENUM (
      'PECUNIAIRE',
      'MATERIELLE',
      'DISCIPLINAIRE',
      'MIXTE'
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'amende_statut') THEN
    CREATE TYPE amende_statut AS ENUM (
      'EN_ATTENTE',
      'PARTIEL',
      'PAYEE',
      'TRANSFEREE',
      'IMPAYEE'
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'amende_cible_type') THEN
    CREATE TYPE amende_cible_type AS ENUM (
      'INDIVIDU',
      'LIGNEE',
      'CATEGORIE',
      'GENERATION'
    );
  END IF;
END$$;
