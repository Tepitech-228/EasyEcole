import { Compte } from "./Compte"
import { JournalComptable } from "./JournalComptable"
import { EcritureComptable } from "./EcritureComptable"
import { FraisParcours } from "./FraisParcours"
import { LigneFraisEtudiant } from "./LigneFraisEtudiant"
import { ReductionFrais } from "./ReductionFrais"
import { PenaliteRetard } from "./PenaliteRetard"
import { DossierEtudiant } from "../../inscription/models/DossierEtudiant"
import { Parcours } from "../../inscription/models/Parcours"
import { NiveauEtude } from "../../inscription/models/NiveauEtude"
import { AnneeAcademique } from "../../inscription/models/AnneeAcademique"
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

// Associations FraisParcours
FraisParcours.belongsTo(Parcours, {
  as: 'parcours',
  foreignKey: 'parcoursId'
})
Parcours.hasMany(FraisParcours, {
  as: 'fraisParcoursParcours',
  foreignKey: 'parcoursId'
})

FraisParcours.belongsTo(NiveauEtude, {
  as: 'niveauEtude',
  foreignKey: 'niveauEtudeId'
})
NiveauEtude.hasMany(FraisParcours, {
  as: 'fraisParcoursNiveau',
  foreignKey: 'niveauEtudeId'
})

FraisParcours.belongsTo(AnneeAcademique, {
  as: 'anneeAcademique',
  foreignKey: 'anneeAcademiqueId'
})
AnneeAcademique.hasMany(FraisParcours, {
  as: 'fraisParcoursAnnee',
  foreignKey: 'anneeAcademiqueId'
})

// Associations LigneFraisEtudiant
LigneFraisEtudiant.belongsTo(DossierEtudiant, {
  as: 'dossierEtudiant',
  foreignKey: 'dossierEtudiantId'
})
DossierEtudiant.hasMany(LigneFraisEtudiant, {
  as: 'lignesFrais',
  foreignKey: 'dossierEtudiantId'
})

LigneFraisEtudiant.belongsTo(ReductionFrais, {
  as: 'reduction',
  foreignKey: 'reductionId'
})
ReductionFrais.hasMany(LigneFraisEtudiant, {
  as: 'lignesFraisReduction',
  foreignKey: 'reductionId'
})

// Associations ReductionFrais
ReductionFrais.belongsTo(DossierEtudiant, {
  as: 'dossierEtudiant',
  foreignKey: 'dossierEtudiantId'
})
DossierEtudiant.hasMany(ReductionFrais, {
  as: 'reductions',
  foreignKey: 'dossierEtudiantId'
})

ReductionFrais.belongsTo(Utilisateur, {
  as: 'validateur',
  foreignKey: 'validePar'
})
Utilisateur.hasMany(ReductionFrais, {
  as: 'reductionsValidees',
  foreignKey: 'validePar'
})
