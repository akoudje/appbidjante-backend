-- =========================
-- AMENDE
-- =========================
ALTER TABLE "Amende"
  ALTER COLUMN type TYPE amende_type
  USING type::amende_type;

ALTER TABLE "Amende"
  ALTER COLUMN statut TYPE amende_statut
  USING statut::amende_statut;

-- =========================
-- AMENDE CIBLE
-- =========================
ALTER TABLE "AmendeCible"
  ALTER COLUMN type TYPE amende_cible_type
  USING type::amende_cible_type;
