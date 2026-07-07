import { Request } from "express";
import { Transaction } from "sequelize";
import { EcritureComptable } from "../models/EcritureComptable";
import { JournalComptable } from "../models/JournalComptable";
import { Compte } from "../models/Compte";

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
