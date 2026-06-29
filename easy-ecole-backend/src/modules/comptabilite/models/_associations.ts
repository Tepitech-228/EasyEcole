import { Compte } from "./Compte"
import { JournalComptable } from "./JournalComptable"
import { EcritureComptable } from "./EcritureComptable"
import { Utilisateur } from "../../auth/models/Utilisateur"

// Associations EcritureComptable
EcritureComptable.belongsTo(JournalComptable, {
  as: 'journal',
  foreignKey: 'journalId'
})
JournalComptable.hasMany(EcritureComptable, {
  as: 'ecritures',
  foreignKey: 'journalId'
})

EcritureComptable.belongsTo(Compte, {
  as: 'compteDebit',
  foreignKey: 'compteDebitId'
})
Compte.hasMany(EcritureComptable, {
  as: 'debitures',
  foreignKey: 'compteDebitId'
})

EcritureComptable.belongsTo(Compte, {
  as: 'compteCredit',
  foreignKey: 'compteCreditId'
})
Compte.hasMany(EcritureComptable, {
  as: 'creditures',
  foreignKey: 'compteCreditId'
})

EcritureComptable.belongsTo(Utilisateur, {
  as: 'utilisateurSaisie',
  foreignKey: 'utilisateurSaisieId'
})
Utilisateur.hasMany(EcritureComptable, {
  as: 'ecrituresSaisies',
  foreignKey: 'utilisateurSaisieId'
})

EcritureComptable.belongsTo(Utilisateur, {
  as: 'utilisateurValidation',
  foreignKey: 'utilisateurValidationId'
})
Utilisateur.hasMany(EcritureComptable, {
  as: 'ecrituresValidees',
  foreignKey: 'utilisateurValidationId'
})
