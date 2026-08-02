import { Request } from "express";
import { Op, Transaction } from "sequelize";
import { EcritureComptable } from "../models/EcritureComptable";
import { JournalComptable } from "../models/JournalComptable";
import { Compte } from "../models/Compte";
import { ExerciceComptable } from "../models/ExerciceComptable";

export interface CreerEcritureParams {
  req: Request;
  journalCode: string;
  compteDebitNumero: string;
  compteCreditNumero: string;
  montant: number;
  libelle: string;
  reference?: string;
  moduleSource?: string;
  referenceModuleId?: string;
  dateEcriture?: Date;
  dateComptable?: Date;
  transaction?: Transaction;
}

export interface CreerEcritureAutoParams {
  journalCode: string;
  compteDebit: string;
  compteCredit: string;
  montant: number;
  libelle: string;
  moduleSource?: string;
  referenceModuleId?: string;
  transaction?: Transaction;
}

/**
 * Récupère l'exercice comptable actif (statut 'Ouvert' et actif = true)
 * @throws Error si aucun exercice actif trouvé
 */
export async function getExerciceEnCours(): Promise<ExerciceComptable> {
  const exercice = await ExerciceComptable.findOne({ where: { actif: true, statut: 'Ouvert' } });
  if (!exercice) {
    throw new Error('Aucun exercice comptable actif. Veuillez créer un exercice.');
  }
  return exercice;
}

export async function creerEcritureAutomatique(options: CreerEcritureAutoParams): Promise<EcritureComptable> {
  const { journalCode, compteDebit, compteCredit, montant, libelle, moduleSource, referenceModuleId, transaction } = options;

  // Résoudre l'exercice comptable en cours
  const exercice = await getExerciceEnCours();

  const journal = await JournalComptable.findOne({ where: { code: journalCode }, transaction });
  if (!journal) {
    throw new Error(`Journal comptable introuvable pour le code ${journalCode}`);
  }

  const compteDebitRecord = await Compte.findOne({ where: { numero: compteDebit }, transaction });
  if (!compteDebitRecord) {
    throw new Error(`Compte débit introuvable pour le numéro ${compteDebit}`);
  }

  const compteCreditRecord = await Compte.findOne({ where: { numero: compteCredit }, transaction });
  if (!compteCreditRecord) {
    throw new Error(`Compte crédit introuvable pour le numéro ${compteCredit}`);
  }

  const count = await EcritureComptable.count({ where: { journalId: journal.id }, transaction });
  const numeroEcriture = `${journal.code}${String(count + 1).padStart(5, '0')}`;

  const ecriture = await EcritureComptable.create({
    journalId: journal.id,
    exerciceId: exercice.id,
    numeroEcriture,
    dateEcriture: new Date(),
    dateComptable: new Date(),
    compteDebitId: compteDebitRecord.id,
    compteCreditId: compteCreditRecord.id,
    montant,
    libelle,
    moduleSource,
    referenceModuleId,
    validee: false
  }, { transaction });

  return ecriture;
}

export async function creerEcritureComptable(params: CreerEcritureParams): Promise<EcritureComptable> {
  const {
    req,
    journalCode,
    compteDebitNumero,
    compteCreditNumero,
    montant,
    libelle,
    reference,
    moduleSource,
    referenceModuleId,
    dateEcriture,
    dateComptable,
    transaction
  } = params;

  // Résoudre l'exercice comptable en cours
  const exercice = await getExerciceEnCours();

  const journal = await JournalComptable.findOne({ where: { code: journalCode }, transaction });
  if (!journal) {
    throw new Error(`Journal comptable introuvable pour le code ${journalCode}`);
  }

  const compteDebit = await Compte.findOne({ where: { numero: compteDebitNumero }, transaction });
  if (!compteDebit) {
    throw new Error(`Compte débit introuvable pour le numéro ${compteDebitNumero}`);
  }

  const compteCredit = await Compte.findOne({ where: { numero: compteCreditNumero }, transaction });
  if (!compteCredit) {
    throw new Error(`Compte crédit introuvable pour le numéro ${compteCreditNumero}`);
  }

  const count = await EcritureComptable.count({ where: { journalId: journal.id }, transaction });
  const numeroEcriture = `${journal.code}${String(count + 1).padStart(5, '0')}`;

  const ecriture = await EcritureComptable.create({
    journalId: journal.id,
    exerciceId: exercice.id,
    numeroEcriture,
    dateEcriture: dateEcriture ? dateEcriture : new Date(),
    dateComptable: dateComptable ? dateComptable : (dateEcriture ? dateEcriture : new Date()),
    compteDebitId: compteDebit.id,
    compteCreditId: compteCredit.id,
    montant,
    libelle,
    reference,
    moduleSource,
    referenceModuleId,
    utilisateurSaisieId: req.utilisateurId!,
    validee: false
  }, { transaction });

  return ecriture;
}

/**
 * Calcule le solde d'un compte à une date donnée (pour le bilan)
 * Solde = SUM(montant en débit) - SUM(montant en crédit)
 */
export async function getSoldeCompteAtDate(compteId: number | string, date: string, exerciceId?: number | string): Promise<number> {
  const where: any = {
    validee: true,
    [Op.or]: [
      { compteDebitId: compteId },
      { compteCreditId: compteId }
    ],
    dateComptable: { [Op.lte]: date }
  };
  if (exerciceId) where.exerciceId = exerciceId;

  const ecritures = await EcritureComptable.findAll({ where });

  let solde = 0;
  for (const e of ecritures) {
    if (Number(e.compteDebitId) === Number(compteId)) solde += e.montant;
    if (Number(e.compteCreditId) === Number(compteId)) solde -= e.montant;
  }

  return solde;
}

/**
 * Calcule le solde d'un compte sur une période donnée (pour le compte de résultat)
 */
export async function getSoldeCompteSurPeriode(compteId: number | string, dateDebut: string, dateFin: string, exerciceId?: number | string): Promise<number> {
  const where: any = {
    validee: true,
    [Op.or]: [
      { compteDebitId: compteId },
      { compteCreditId: compteId }
    ],
    dateComptable: {
      [Op.gte]: dateDebut,
      [Op.lte]: dateFin
    }
  };
  if (exerciceId) where.exerciceId = exerciceId;

  const ecritures = await EcritureComptable.findAll({ where });

  let solde = 0;
  for (const e of ecritures) {
    if (Number(e.compteDebitId) === Number(compteId)) solde += e.montant;
    if (Number(e.compteCreditId) === Number(compteId)) solde -= e.montant;
  }

  return solde;
}

/**
 * Lettrage automatique : lie une écriture débit 411 (création inscription)
 * avec une écriture crédit 411 (paiement) pour un même étudiant.
 *
 * @param options - { referenceModuleId, paiementId, montant }
 * @returns true si lettrage effectué, false si pas de correspondance
 */
export interface LettrageAutoParams {
  referenceModuleId: string;
  paiementId: string | number;
  montant: number;
  transaction?: Transaction;
}

export async function lettrerEcritures411(options: LettrageAutoParams): Promise<boolean> {
  const { referenceModuleId, paiementId, montant, transaction } = options;

  const compte411 = await Compte.findOne({ where: { numero: '411' }, transaction });
  if (!compte411) return false;

  const ecritureDebit = await EcritureComptable.findOne({
    where: {
      compteDebitId: compte411.id,
      moduleSource: 'inscription',
      referenceModuleId: String(referenceModuleId),
      validee: true,
      lettre: null
    },
    transaction
  });

  if (!ecritureDebit) return false;

  const ecritureCredit = await EcritureComptable.findOne({
    where: {
      compteCreditId: compte411.id,
      moduleSource: 'inscription',
      referenceModuleId: String(paiementId),
      validee: true,
      lettre: null
    },
    transaction
  });

  if (!ecritureCredit) return false;

  const lettre = `L${String(ecritureDebit.id).padStart(6, '0')}`;
  const dateLettrage = new Date();

  await ecritureDebit.update({ lettre, dateLettrage }, { transaction });
  await ecritureCredit.update({ lettre, dateLettrage }, { transaction });

  return true;
}
