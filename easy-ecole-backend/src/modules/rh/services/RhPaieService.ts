import { Op, Transaction } from "sequelize";
import { DatabaseConnection } from "../../../core/helpers/DatabaseConnection";
import { RhEmploye } from "../models/RhEmploye";
import { RhPeriodePaie } from "../models/RhPeriodePaie";
import { RhRubriquePaie } from "../models/RhRubriquePaie";
import { RhBulletinPaie } from "../models/RhBulletinPaie";
import { RhLigneBulletin } from "../models/RhLigneBulletin";
import { RhHeureSupplementaire } from "../models/RhHeureSupplementaire";
import { RhPrestationEnseignant } from "../models/RhPrestationEnseignant";
import { RhPret } from "../models/RhPret";
import { RhTauxHoraireEnseignant } from "../models/RhTauxHoraireEnseignant";
import { Pointage } from "../../inscription/models/Pointage";
import { SeancePointage } from "../../inscription/models/SeancePointage";
import { Seance } from "../../inscription/models/Seance";
import { Enseignant } from "../../auth/models/Enseignant";

export type PopulationPaie = "personnel" | "enseignants";

function minutesDepuisHeurePaie(value: unknown): number | null {
  const text = value instanceof Date ? value.toISOString().slice(11, 19) : String(value ?? "");
  const match = text.match(/^(?:[01]\d|2[0-3]):[0-5]\d(?::[0-5]\d)?$/);
  if (!match) return null;
  const [hours, minutes] = text.split(":").map(Number);
  return hours * 60 + minutes;
}

function minutesPointageNormales(arriveeValue: unknown, departValue: unknown): number {
  const arrivee = minutesDepuisHeurePaie(arriveeValue);
  const depart = minutesDepuisHeurePaie(departValue);
  if (arrivee === null || depart === null || depart < arrivee) return 0;
  return Math.max(0, Math.min(depart, 18 * 60) - arrivee);
}

function arrondirMontant(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

/**
 * Source / traçabilité d'une ligne de bulletin.
 * Chaque ligne référence son rubrique (rubriqueId) et un type de source
 * afin de retracer d'où provient le montant (base, heures supp, prestation, prêt).
 *
 * NOTE — évolution de structure du modèle `RhLigneBulletin` :
 * deux colonnes nullable (`source`, `sourceId`) ont été ajoutées au modèle.
 * Elles sont créées automatiquement par `sequelize.sync({ alter: true })`
 * (exécuté en développement à l'initialisation de la base).
 */
export type LigneSource = 'base' | 'hs' | 'prestation' | 'retrait';

export interface LigneBulletinInput {
  source: LigneSource;
  sourceId?: number | string;
  rubrique: RhRubriquePaie;
  libelle: string;
  base: number;
  taux: number;
  montant: number;
  /** type de la rubrique : 'gain' | 'retenue' | 'cotisation' */
  type: string;
  siteId?: number;
  siteNom?: string;
}

export interface ResultatBulletin {
  employeId: number;
  totalGains: number;
  totalRetenues: number;
  netAPayer: number;
  lignes: LigneBulletinInput[];
}

/**
 * Service de paie : calcule un bulletin réel pour une période donnée et un employé.
 *
 * Le calcul intègre :
 *  - les rubriques "base" applicables (fixe / pourcentage, SALAIRE_BASE = salaireBase de l'employé),
 *  - les heures supplémentaires VALIDÉES / PAYÉES de la période,
 *  - les prestations enseignants validées/payées de la période,
 *  - les prêts en cours (mensualités à retenir).
 */
export class RhPaieService {

  /** Nombre d'heures mensuel de référence utilisé pour le calcul des heures supplémentaires. */
  static readonly HEURES_MENSUELLES = 173;

  /**
   * Rubriques créées "à la volée" pour les lignes qui ne correspondent pas une rubrique
   * de base pré-existante (heures supplémentaires, prestations, prêts). On les cherche
   * puis on les crée si besoin pour satisfaire la clé étrangère `rubriqueId`.
   */
  private static readonly RUBRIQUES_AUTO: Record<Exclude<LigneSource, 'base'>, { code: string; libelle: string; type: 'gain' | 'retenue' }> = {
    hs: { code: 'HEURES_SUPPLEMENTAIRES', libelle: 'Heures supplémentaires', type: 'gain' },
    prestation: { code: 'PRESTATION_ENSEIGNANT', libelle: 'Prestations enseignant', type: 'gain' },
    retrait: { code: 'RETENUE_PRET', libelle: 'Remboursement prêt', type: 'retenue' },
  };

  /**
   * Point d'entrée : génère et PERSISTE un bulletin complet pour un employé sur une période.
   * Utilise une transaction si fournie (appelé depuis la génération globale).
   */
  static async genererBulletinPourEmploye(
    periode: RhPeriodePaie,
    employe: RhEmploye,
    rubriques: RhRubriquePaie[],
    rubriqueBase: RhRubriquePaie | null,
    options?: { transaction?: Transaction; population?: PopulationPaie }
  ): Promise<RhBulletinPaie> {
    const result = await this.calculerBulletin(periode, employe, rubriques, rubriqueBase, options?.population);

    const bulletin = await RhBulletinPaie.create({
      employeId: employe.id,
      periodeId: periode.id,
      totalGains: result.totalGains,
      totalRetenues: result.totalRetenues,
      netAPayer: result.netAPayer,
      statut: 'brouillon'
    }, { transaction: options?.transaction });

    for (const ligne of result.lignes) {
      await RhLigneBulletin.create({
        bulletinId: bulletin.id,
        rubriqueId: ligne.rubrique.id,
        libelle: ligne.libelle,
        base: ligne.base,
        taux: ligne.taux,
        montant: ligne.montant,
        source: ligne.source,
        sourceId: ligne.sourceId !== undefined ? String(ligne.sourceId) : null,
        siteId: ligne.siteId ?? null,
        siteNom: ligne.siteNom ?? null,
      }, { transaction: options?.transaction });
    }

    return bulletin;
  }

  /**
   * Calcule le bulletin en mémoire (aucune écriture) : purement calculatoire et testable.
   */
  private static async calculerBulletinHoraire(
    periode: RhPeriodePaie,
    employe: RhEmploye,
    rubriques: RhRubriquePaie[],
    population: PopulationPaie
  ): Promise<ResultatBulletin> {
    const lignes: LigneBulletinInput[] = [];
    const enseignant = population === "enseignants"
      ? await Enseignant.findOne({ where: { utilisateurId: Number(employe.utilisateurId) } })
      : null;
    if (population === "enseignants" && !enseignant) {
      throw new Error(`L’employé ${employe.id} n’est pas relié à un profil enseignant.`);
    }

    if (population === "personnel") {
      const pointages = await Pointage.findAll({
        where: {
          utilisateurId: Number(employe.utilisateurId),
          date: { [Op.between]: [periode.dateDebut, periode.dateFin] },
        },
      });
      const minutesNormales = pointages.reduce(
        (total, pointage) => total + minutesPointageNormales(pointage.heureArrivee, pointage.heureDepart),
        0
      );
      const heuresNormales = minutesNormales / 60;
      const tauxNormal = Number(employe.tauxHoraireNormal) || 0;
      if (heuresNormales > 0 && tauxNormal <= 0) {
        throw new Error(`Le taux horaire normal de ${employe.prenoms || ""} ${employe.nom || employe.id} doit être renseigné.`);
      }
      if (heuresNormales > 0) {
        lignes.push({
          source: "base",
          rubrique: await this.trouverOuCreerRubrique("HEURES_NORMALES", "Heures normales", "gain"),
          libelle: `Heures normales pointées (${heuresNormales.toFixed(2)} h)`,
          base: heuresNormales,
          taux: tauxNormal,
          montant: arrondirMontant(heuresNormales * tauxNormal),
          type: "gain",
        });
      }

      const heuresSupplementaires = await RhHeureSupplementaire.findAll({
        where: {
          employeId: employe.id,
          statut: { [Op.in]: ["validee", "payee"] },
          date: { [Op.between]: [periode.dateDebut, periode.dateFin] },
        },
      });
      const tauxSupplementaire = Number(employe.tauxHoraireSupplementaire) || 0;
      if (heuresSupplementaires.some(heure => Number(heure.nombreHeures) > 0) && tauxSupplementaire <= 0) {
        throw new Error(`Le taux horaire supplémentaire de ${employe.prenoms || ""} ${employe.nom || employe.id} doit être renseigné.`);
      }
      const rubriqueHs = await this.trouverOuCreerRubrique("HEURES_SUPPLEMENTAIRES", "Heures supplémentaires", "gain");
      for (const heure of heuresSupplementaires) {
        const nombreHeures = Number(heure.nombreHeures) || 0;
        if (nombreHeures <= 0) continue;
        lignes.push({
          source: "hs",
          sourceId: heure.id,
          rubrique: rubriqueHs,
          libelle: `Heures supplémentaires validées (${nombreHeures.toFixed(2)} h)`,
          base: nombreHeures,
          taux: tauxSupplementaire,
          montant: arrondirMontant(nombreHeures * tauxSupplementaire),
          type: "gain",
        });
      }
    } else if (enseignant) {
      const pointages = await SeancePointage.findAll({
        where: {
          enseignantId: Number(enseignant.id),
          date: { [Op.between]: [periode.dateDebut, periode.dateFin] },
        },
        include: [{
          association: SeancePointage.associations.seance,
          include: [
            { association: Seance.associations.cours, required: false },
            { association: Seance.associations.niveauEtude, required: false },
          ],
        }, {
          association: SeancePointage.associations.etablissement,
          attributes: ["id", "nom"],
          required: true,
        }],
      });
      const rubriquePrestation = await this.trouverOuCreerRubrique(
        "PRESTATION_ENSEIGNANT",
        "Heures de cours effectuées",
        "gain"
      );
      for (const pointage of pointages) {
        const debut = minutesDepuisHeurePaie(pointage.heureDebutReelle);
        const fin = minutesDepuisHeurePaie(pointage.heureFinReelle);
        if (debut === null || fin === null || fin <= debut) {
          throw new Error(`Le pointage de séance #${pointage.id} de la période ne contient pas des heures réelles complètes et valides.`);
        }
        const seance = pointage.seance;
        const niveauEtudeId = Number(seance?.niveauEtudeId);
        const coursId = Number(seance?.coursId);
        if (!seance || !pointage.etablissement || niveauEtudeId <= 0 || coursId <= 0) {
          throw new Error(`Le pointage de séance #${pointage.id} n’est pas associé à un site, un cours et un niveau d’étude.`);
        }
        const taux = await RhTauxHoraireEnseignant.findAll({
          where: {
            niveauEtudeId,
            coursId,
            [Op.or]: [{ enseignantId: Number(enseignant.id) }, { enseignantId: null }],
          },
        });
        const tauxEffectif = taux.find(item => Number(item.enseignantId) === Number(enseignant.id))
          || taux.find(item => item.enseignantId === null);
        if (!tauxEffectif) {
          throw new Error(`Aucun taux horaire n’est défini pour le cours ${seance.cours?.intitule || coursId}, niveau ${seance.niveauEtude?.libelle || niveauEtudeId}.`);
        }
        const heures = (fin - debut) / 60;
        const tauxHoraire = Number(tauxEffectif.tauxHoraire);
        lignes.push({
          source: "prestation",
          sourceId: pointage.id,
          rubrique: rubriquePrestation,
          libelle: `${seance.cours?.intitule || `Cours #${coursId}`} - ${seance.niveauEtude?.libelle || `Niveau #${niveauEtudeId}`} (${heures.toFixed(2)} h)`,
          base: heures,
          taux: tauxHoraire,
          montant: arrondirMontant(heures * tauxHoraire),
          type: "gain",
          siteId: Number(pointage.etablissement.id),
          siteNom: pointage.etablissement.nom,
        });
      }
    }

    for (const rubrique of rubriques) {
      if (rubrique.modeCalcul !== "fixe" && rubrique.modeCalcul !== "pourcentage") continue;
      if (["SALAIRE_BASE", "SAL"].includes(rubrique.code)) continue;
      const valeur = Number(rubrique.valeur) || 0;
      const base = rubrique.modeCalcul === "pourcentage"
        ? lignes.filter(ligne => ligne.type === "gain").reduce((total, ligne) => total + ligne.montant, 0)
        : 0;
      const taux = rubrique.modeCalcul === "pourcentage" ? valeur : 0;
      const montant = rubrique.modeCalcul === "pourcentage" ? arrondirMontant(base * taux / 100) : valeur;
      if (montant > 0) {
        lignes.push({
          source: "base",
          sourceId: rubrique.id,
          rubrique,
          libelle: rubrique.libelle,
          base,
          taux,
          montant,
          type: rubrique.type,
        });
      }
    }

    const totalBrut = arrondirMontant(lignes
      .filter(ligne => ligne.type === "gain")
      .reduce((sum, ligne) => sum + ligne.montant, 0));
    const tauxFiscal = Number(employe.tauxFiscal) || 0;
    if (tauxFiscal < 0 || tauxFiscal > 1) {
      throw new Error(`Le taux fiscal de ${employe.prenoms || ""} ${employe.nom || employe.id} doit être entre 0 et 1 (ex. 0,05 pour 5 %).`);
    }
    const montantFiscal = arrondirMontant(totalBrut * tauxFiscal);
    if (montantFiscal > 0) {
      lignes.push({
        source: "retrait",
        rubrique: await this.trouverOuCreerRubrique("RETENUE_FISCALE", "Retenue fiscale", "retenue"),
        libelle: `Retenue fiscale (${(tauxFiscal * 100).toFixed(2)} %)`,
        base: totalBrut,
        taux: tauxFiscal * 100,
        montant: montantFiscal,
        type: "retenue",
      });
    }

    const rubriquePret = await this.trouverOuCreerRubrique("RETENUE_PRET", "Remboursement prêt", "retenue");
    const prets = await RhPret.findAll({
      where: { employeId: employe.id, statut: { [Op.in]: ["actif", "impaye"] } },
    });
    for (const pret of prets) {
      const mensualite = Number(pret.mensualite) > 0
        ? Number(pret.mensualite)
        : (Number(pret.montant) || 0) / (Number(pret.nombreMois) || 1);
      if (mensualite <= 0) continue;
      lignes.push({
        source: "retrait",
        sourceId: pret.id,
        rubrique: rubriquePret,
        libelle: `Remboursement prêt (#${pret.id})`,
        base: mensualite,
        taux: 0,
        montant: arrondirMontant(mensualite),
        type: "retenue",
      });
    }

    const totalGains = arrondirMontant(lignes
      .filter(ligne => ligne.type === "gain")
      .reduce((sum, ligne) => sum + ligne.montant, 0));
    const totalRetenues = arrondirMontant(lignes
      .filter(ligne => ligne.type !== "gain")
      .reduce((sum, ligne) => sum + ligne.montant, 0));
    return {
      employeId: Number(employe.id),
      totalGains,
      totalRetenues,
      netAPayer: arrondirMontant(totalGains - totalRetenues),
      lignes,
    };
  }

  static async calculerBulletin(
    periode: RhPeriodePaie,
    employe: RhEmploye,
    rubriques: RhRubriquePaie[],
    rubriqueBase: RhRubriquePaie | null,
    population?: PopulationPaie
  ): Promise<ResultatBulletin> {
    if (population) {
      return this.calculerBulletinHoraire(periode, employe, rubriques, population);
    }

    const lignes: LigneBulletinInput[] = [];
    const salaireBase = Number(employe.salaireBase) || 0;
    if (rubriqueBase) {
      lignes.push({
        source: "base",
        sourceId: rubriqueBase.id,
        rubrique: rubriqueBase,
        libelle: rubriqueBase.libelle,
        base: salaireBase,
        taux: 0,
        montant: salaireBase,
        type: rubriqueBase.type,
      });
    }

    // Autres rubriques applicables (fixe / pourcentage), hors rubrique de base déjà traitée.
    for (const rubrique of rubriques) {
      if (rubrique.id === rubriqueBase?.id) continue;
      if (rubrique.modeCalcul !== 'fixe' && rubrique.modeCalcul !== 'pourcentage') continue;

      let montant = 0;
      let base = 0;
      let taux = 0;

      if (rubrique.modeCalcul === 'fixe') {
        montant = Number(rubrique.valeur) || 0;
      } else if (rubrique.modeCalcul === 'pourcentage') {
        base = salaireBase;
        taux = Number(rubrique.valeur) || 0;
        montant = (salaireBase * taux) / 100;
      }

      if (montant <= 0) continue;

      lignes.push({
        source: 'base',
        sourceId: rubrique.id,
        rubrique,
        libelle: rubrique.libelle,
        base,
        taux,
        montant,
        type: rubrique.type,
      });
    }

    // ---- 2. Heures supplémentaires validées / payées de la période ----
    const confHs = this.RUBRIQUES_AUTO.hs;
    const rubriqueHs = await this.trouverOuCreerRubrique(confHs.code, confHs.libelle, confHs.type);
    const heures = await RhHeureSupplementaire.findAll({
      where: {
        employeId: employe.id,
        statut: { [Op.in]: ['validee', 'payee'] },
        date: { [Op.between]: [periode.dateDebut, periode.dateFin] },
      },
    });
    for (const h of heures) {
      // Même logique que RhHeureSupplementaireController.valider :
      // montant = (salaireBase / 173) * nbHeures * (1 + tauxMajoration/100)
      const tauxHoraireBase = salaireBase / this.HEURES_MENSUELLES;
      const nbHeures = Number(h.nombreHeures) || 0;
      const majoration = Number(h.tauxMajoration) || 0;
      const montantHs = tauxHoraireBase * nbHeures * (1 + majoration / 100);
      lignes.push({
        source: 'hs',
        sourceId: h.id,
        rubrique: rubriqueHs,
        libelle: `Heures supplémentaires (${nbHeures} h)`,
        base: montantHs,
        taux: majoration,
        montant: montantHs,
        type: 'gain',
      });
    }

    // ---- 3. Prestations enseignant validées / payées de la période ----
    const confPrest = this.RUBRIQUES_AUTO.prestation;
    const rubriquePrest = await this.trouverOuCreerRubrique(confPrest.code, confPrest.libelle, confPrest.type);
    const prestations = await RhPrestationEnseignant.findAll({
      where: {
        enseignantId: employe.id,
        mois: periode.mois,
        annee: periode.annee,
        statut: { [Op.in]: ['validée', 'payée'] },
      },
    });
    const totalPrestations = prestations.reduce((sum, p) => sum + (Number(p.montant) || 0), 0);
    if (totalPrestations > 0) {
      lignes.push({
        source: 'prestation',
        sourceId: prestations[0].id,
        rubrique: rubriquePrest,
        libelle: `Prestations enseignant - ${periode.mois}/${periode.annee}`,
        base: totalPrestations,
        taux: 0,
        montant: totalPrestations,
        type: 'gain',
      });
    }

    // ---- 4. Prêts en cours : mensualité à retenir ----
    const confPret = this.RUBRIQUES_AUTO.retrait;
    const rubriquePret = await this.trouverOuCreerRubrique(confPret.code, confPret.libelle, confPret.type);
    const prets = await RhPret.findAll({
      where: { employeId: employe.id, statut: { [Op.in]: ['actif', 'impaye'] } },
    });
    for (const pret of prets) {
      const mensualite = Number(pret.mensualite) > 0
        ? Number(pret.mensualite)
        : (Number(pret.montant) || 0) / (Number(pret.nombreMois) || 1);
      if (mensualite <= 0) continue;
      lignes.push({
        source: 'retrait',
        sourceId: pret.id,
        rubrique: rubriquePret,
        libelle: `Remboursement prêt (#${pret.id})`,
        base: mensualite,
        taux: 0,
        montant: mensualite,
        type: 'retenue',
      });
    }

    // ---- Totaux ----
    let totalGains = 0;
    let totalRetenues = 0;
    for (const ligne of lignes) {
      if (ligne.type === 'gain') totalGains += ligne.montant;
      else totalRetenues += ligne.montant; // retenue / cotisation
    }
    const netAPayer = totalGains - totalRetenues;

    return {
      employeId: Number(employe.id),
      totalGains,
      totalRetenues,
      netAPayer,
      lignes,
    };
  }

  /**
   * Regénère proprement les bulletins d'une période de façon IDEMPOTENTE.
   *
   * Choix d'idempotence retenu : "régénération propre sans duplication".
   *  - Si des bulletins existent et sont TOUS en statut 'brouillon' → on les supprime
   *    (bulletins + lignes) puis on les recrée avec le calcul à jour.
   *  - Si au moins un bulletin est déjà 'validé' ou 'versé' → on REFUSE la régénération
   *    afin de ne pas écraser une paie validée/versée (protection contre toute perte).
   *
   * @returns le nombre de bulletins générés
   */
  static async genererBulletinsPourPeriode(periode: RhPeriodePaie, population?: PopulationPaie): Promise<number> {
    let employes = await RhEmploye.findAll({ where: { statut: 'actif' } });
    if (population) {
      const utilisateurIds = employes.map(employe => Number(employe.utilisateurId));
      const enseignants = utilisateurIds.length
        ? await Enseignant.findAll({ where: { utilisateurId: { [Op.in]: utilisateurIds } }, attributes: ["id", "utilisateurId"] })
        : [];
      const utilisateurEnseignantIds = new Set(enseignants.map(enseignant => Number(enseignant.utilisateurId)));
      employes = employes.filter(employe => population === "enseignants"
        ? utilisateurEnseignantIds.has(Number(employe.utilisateurId))
        : !utilisateurEnseignantIds.has(Number(employe.utilisateurId)));
    }
    if (employes.length === 0) return 0;
    const rubriques = await RhRubriquePaie.findAll();
    const rubriqueBase = await this.trouverRubriqueSalaireBase();

    const whereBulletins = population
      ? { periodeId: periode.id, employeId: { [Op.in]: employes.map(employe => employe.id) } }
      : { periodeId: periode.id };
    const bulletinsExistants = await RhBulletinPaie.findAll({ where: whereBulletins });

    // Vérification d'idempotence / protection.
    const aUnBulletinFinalise = bulletinsExistants.some(b => b.statut === 'validé' || b.statut === 'versé');
    if (bulletinsExistants.length > 0 && aUnBulletinFinalise) {
      throw new Error(
        `La période ${periode.mois}/${periode.annee} contient des bulletins validés ou versés : régénération refusée pour éviter toute perte de données.`
      );
    }

    // Purge propre des anciens bulletins (les lignes sont supprimées en cascade).
    for (const b of bulletinsExistants) {
      await RhLigneBulletin.destroy({ where: { bulletinId: b.id } });
      await b.destroy();
    }

    const sequelize = DatabaseConnection.getInstance().sequelize;
    const transaction = await sequelize.transaction();
    try {
      for (const employe of employes) {
        await this.genererBulletinPourEmploye(periode, employe, rubriques, rubriqueBase, { transaction, population });
      }
      await transaction.commit();
      return employes.length;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  /** RetourNE la rubrique SALAIRE_BASE (ou `SAL` selon l'environnement de seed), sinon null. */
  static async trouverRubriqueSalaireBase(): Promise<RhRubriquePaie | null> {
    return RhRubriquePaie.findOne({
      where: { code: { [Op.in]: ['SALAIRE_BASE', 'SAL'] } },
    });
  }

  /** Cherche une rubrique, sinon la créée (pour les sources non base). */
  private static async trouverOuCreerRubrique(code: string, libelle: string, type: string, valeur = 0): Promise<RhRubriquePaie> {
    const [rub] = await RhRubriquePaie.findOrCreate({
      where: { code },
      defaults: { code, libelle, type, modeCalcul: 'fixe', valeur },
    });
    return rub;
  }
}