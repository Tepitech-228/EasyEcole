-- Migration 010 — MODULE INSCRIPTION (ESA-COMPTA)
-- Ajout de la colonne "banque" sur ins_bordereaux
-- Banque émettrice de l'opération de paiement, saisie par ESA-COMPTA lors du
-- traitement. Enum limité aux banques partenaires : ecobank / ib_bank / orabank.

ALTER TABLE ins_bordereaux
  ADD COLUMN banque ENUM('ecobank', 'ib_bank', 'orabank') NULL DEFAULT NULL AFTER moyen_paiement;
