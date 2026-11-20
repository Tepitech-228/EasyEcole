import { Op, Transaction } from 'sequelize';
import { DatabaseConnection } from '../helpers/DatabaseConnection';
import { ClasseOption } from '../enums/ClasseOption';
import { RegimesCours } from '../enums/RegimesCours';
import { StatutSalle } from '../enums/StatutSalle';
import { TypeSalle } from '../enums/TypeSalle';
import { Etablissement } from '../../modules/etablissement/models/Etablissement';
import { AffectationSalleClasse } from '../../modules/inscription/models/AffectationSalleClasse';
import { AnneeAcademique } from '../../modules/inscription/models/AnneeAcademique';
import { Classe } from '../../modules/inscription/models/Classe';
import { NiveauEtude } from '../../modules/inscription/models/NiveauEtude';
import { Parcours } from '../../modules/inscription/models/Parcours';
import { SalleDeClasse } from '../../modules/inscription/models/SalleDeClasse';

type NiveauCode = 'L1' | 'L2' | 'L3' | 'M1' | 'M2';
type Regime = RegimesCours.JOUR | RegimesCours.SOIR;
type AffectationDefinition = {
  niveau: NiveauCode;
  regime: Regime;
  etage: number;
  salle: number;
  codes?: string[];
  toutesLesFilieres?: boolean;
};

const ETABLISSEMENT_CIBLE = 'ESA-SUPER-TACO';
const ANNEE_ACADEMIQUE = '2026-2027';
const DATE_DEBUT_DEFAUT = '2026-09-01';
const DATE_FIN_DEFAUT = '2027-08-31';

const FILIERES: Record<string, string[]> = {
  CE: ['Communication des entreprises'],
  MAC: ['Marketing-communication'],
  MAD: ['Marketing digital et E business'],
  PRP: ['Protocole et relations publiques'],
  SD: ['Secrétariat de direction'],
  AG: ['Administration générale'],
  GPPM: ['Gestion des projets et passation des marchés'],
  ADG: ['Administration et gestion des affaires'],
  AGRH: ['Assistant de gestion des ressources humaines'],
  TLT: ['Transport logistique'],
  AC: ['Action commerciale et force de vente'],
  CI: ['Commerce international'],
  GESCOM: ['Gestion commerciale'],
  CGE: ['Comptabilité et gestion des entreprises'],
  ACG: ['Audit et contrôle de gestion'],
  STCF: ['Science et techniques comptables et financières'],
  IG: [
    "Informatique de gestion (développeur d'application)",
    "Informatique de gestion (administrateur de réseaux locaux d'entreprise)",
  ],
  SICC: ['Sécurité informatique-cyber sécurité-cybercriminalité'],
  GL: ['Génie logiciel'],
  GC: ['Génie civil'],
  TEL: ['Télécommunications'],
  ELEC: ['Electronique'],
  GE: ['Génie électrique'],
  GM: ['Génie mécanique'],
  EEER: ['Energies renouvelables et efficacité énergétique'],
  GRH: ['Gestion des ressources humaines'],
  TL: ['Transport logistique'],
  RT: ['Réseaux et télécommunication'],
  ACT: ['Administration des collectivités territoriales'],
  DPRP: ['Diplomatie, protocole et relations publiques'],
  QSERSE: ['Qualité Sécurité Environnement Responsabilité sociétale des entreprises'],
  ADGENE: ['Administration générale'],
};

const AFFECTATIONS: AffectationDefinition[] = [
  { niveau: 'L1', regime: RegimesCours.JOUR, etage: 3, salle: 2, codes: ['CE', 'MAC', 'MAD', 'PRP', 'SD', 'AG', 'GPPM', 'ADG', 'AGRH', 'TLT', 'AC', 'CI', 'GESCOM'] },
  { niveau: 'L1', regime: RegimesCours.JOUR, etage: 1, salle: 2, codes: ['CGE', 'ACG', 'STCF', 'IG', 'SICC', 'GL'] },
  { niveau: 'L1', regime: RegimesCours.JOUR, etage: 5, salle: 1, codes: ['GC', 'TEL', 'ELEC', 'GE', 'GM', 'EEER'] },
  { niveau: 'L1', regime: RegimesCours.SOIR, etage: 3, salle: 1, toutesLesFilieres: true },
  { niveau: 'L2', regime: RegimesCours.JOUR, etage: 3, salle: 1, codes: ['MAC', 'MAD', 'CE', 'SD', 'AG', 'AGRH', 'PRP'] },
  { niveau: 'L2', regime: RegimesCours.JOUR, etage: 5, salle: 2, codes: ['CI', 'GESCOM', 'TLT'] },
  { niveau: 'L2', regime: RegimesCours.JOUR, etage: 2, salle: 2, codes: ['ACG', 'STCF', 'CGE', 'IG', 'SICC', 'GL'] },
  { niveau: 'L2', regime: RegimesCours.JOUR, etage: 4, salle: 4, codes: ['GC'] },
  { niveau: 'L2', regime: RegimesCours.SOIR, etage: 1, salle: 2, toutesLesFilieres: true },
  { niveau: 'L3', regime: RegimesCours.JOUR, etage: 5, salle: 2, codes: ['ACG', 'STCF', 'GPPM', 'GRH'] },
  { niveau: 'L3', regime: RegimesCours.JOUR, etage: 4, salle: 2, codes: ['MAC', 'MAD', 'GESCOM', 'TL', 'ADG', 'ACT', 'PRP'] },
  { niveau: 'L3', regime: RegimesCours.JOUR, etage: 4, salle: 4, codes: ['GC', 'RT', 'GL', 'SICC', 'GE'] },
  { niveau: 'M1', regime: RegimesCours.JOUR, etage: 3, salle: 2, codes: ['ACG', 'STCF', 'GPPM', 'GRH', 'MAC', 'MAD', 'GESCOM', 'TL', 'DPRP', 'QSERSE', 'ADGENE', 'RT', 'GL', 'GE', 'GC'] },
  { niveau: 'M2', regime: RegimesCours.JOUR, etage: 2, salle: 2, codes: ['ACG', 'STCF', 'QSERSE', 'GPPM', 'GRH', 'MAC', 'MAD', 'DPRP', 'TL', 'ADG', 'ACT', 'GESCOM'] },
];

const NIVEAUX: Record<NiveauCode, string> = {
  L1: 'Licence 1',
  L2: 'Licence 2',
  L3: 'Licence 3',
  M1: 'Master 1',
  M2: 'Master 2',
};

function normaliser(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\s*\((licence|master|bts|mba)\)\s*$/i, '')
    .replace(/[^a-z0-9]/g, '');
}

function lireDates(): { dateDebut: string; dateFin: string } {
  const dateDebut = process.env.ESA_SALLES_DATE_DEBUT || DATE_DEBUT_DEFAUT;
  const dateFin = process.env.ESA_SALLES_DATE_FIN || DATE_FIN_DEFAUT;
  const isoDate = /^\d{4}-\d{2}-\d{2}$/;
  if (!isoDate.test(dateDebut) || !isoDate.test(dateFin) || dateFin < dateDebut) {
    throw new Error('Dates invalides : utiliser ESA_SALLES_DATE_DEBUT et ESA_SALLES_DATE_FIN au format YYYY-MM-DD.');
  }
  return { dateDebut, dateFin };
}

async function trouverEtablissement(transaction: Transaction): Promise<Etablissement> {
  const etablissements = await Etablissement.findAll({
    where: {
      [Op.or]: [
        { nom: { [Op.like]: '%ESA%' } },
        { site: { [Op.like]: '%ESA%' } },
        { code: { [Op.like]: '%ESA%' } },
      ],
    },
    transaction,
  });
  const matches = etablissements.filter(etablissement =>
    [etablissement.nom, etablissement.site, etablissement.code]
      .some(value => value != null && normaliser(value).includes(normaliser(ETABLISSEMENT_CIBLE)))
  );
  if (matches.length !== 1) {
    throw new Error(
      matches.length === 0
        ? `Établissement ${ETABLISSEMENT_CIBLE} introuvable.`
        : `Plusieurs établissements correspondent à ${ETABLISSEMENT_CIBLE}; arrêt pour éviter une mauvaise affectation.`
    );
  }
  return matches[0];
}

async function trouverOuCreerParcours(
  titre: string,
  type: 'LICENCE' | 'MASTER',
  etablissementId: number,
  transaction: Transaction,
): Promise<Parcours> {
  const candidats = await Parcours.findAll({
    where: {
      type,
      [Op.or]: [{ etablissementId }, { etablissementId: null }],
    },
    transaction,
  });
  const matches = candidats.filter(parcours => normaliser(parcours.titre) === normaliser(titre));
  if (matches.length > 1) {
    const linkedClasses = await Promise.all(matches.map(async parcours => ({
      parcours,
      count: await Classe.count({
        where: { parcoursId: parcours.id, etablissementId },
        transaction,
      }),
    })));
    linkedClasses.sort((a, b) => b.count - a.count || Number(a.parcours.id) - Number(b.parcours.id));
    console.warn(
      `Plusieurs filières ${type} correspondent à « ${titre} » ` +
      `(IDs ${matches.map(parcours => parcours.id).join(', ')}); ` +
      `utilisation de l'enregistrement #${linkedClasses[0].parcours.id}.`
    );
    return linkedClasses[0].parcours;
  }
  if (matches.length === 1) return matches[0];

  const titreEnregistre = `${titre} (${type})`;
  return Parcours.create({
    titre: titreEnregistre,
    description: titre,
    type,
    grade: type === 'LICENCE' ? 'Licence Professionnelle' : 'Master Professionnel',
    niveauEtudeId: null,
    etablissementId,
  }, { transaction });
}

async function trouverOuCreerClasse(
  code: string,
  parcours: Parcours,
  niveau: NiveauEtude,
  regime: Regime,
  etablissementId: number,
  transaction: Transaction,
): Promise<Classe> {
  const option = regime === RegimesCours.JOUR ? ClasseOption.JOUR : ClasseOption.SOIR;
  const libelle = `${code} - ${parcours.titre} - ${niveau.libelle} - ${regime}`;
  const [classe] = await Classe.findOrCreate({
    where: {
      libelle,
      niveauEtudeId: niveau.id,
      parcoursId: parcours.id,
      etablissementId,
      option,
    },
    defaults: {
      libelle,
      description: `${parcours.titre} — ${niveau.libelle} — cours ${regime.toLowerCase()}`,
      niveauEtudeId: niveau.id,
      parcoursId: parcours.id,
      etablissementId,
      option,
    },
    transaction,
  });
  return classe;
}

async function trouverOuCreerSalle(
  etage: number,
  numeroSalle: number,
  etablissementId: number,
  transaction: Transaction,
): Promise<SalleDeClasse> {
  const code = `ESA-TACO-E${etage}-S${String(numeroSalle).padStart(2, '0')}`;
  const libelle = `Salle ${numeroSalle} - ${etage}${etage === 1 ? 'er' : 'e'} étage`;
  const [salle] = await SalleDeClasse.findOrCreate({
    where: { code, etablissementId },
    defaults: {
      code,
      libelle,
      description: `Salle physique partagée selon la répartition ESA-SUPER-TACO ${ANNEE_ACADEMIQUE}.`,
      etage: String(etage),
      type: TypeSalle.COURS,
      regime: RegimesCours.JOUR_ET_SOIR,
      statut: StatutSalle.DISPONIBLE,
      capacite: 30,
      parcoursId: null,
      etablissementId,
    },
    transaction,
  });
  return salle;
}

async function affecterSalle(
  salle: SalleDeClasse,
  classe: Classe,
  anneeAcademiqueId: number,
  regime: Regime,
  etablissementId: number,
  dates: { dateDebut: string; dateFin: string },
  transaction: Transaction,
): Promise<void> {
  const affectations = await AffectationSalleClasse.findAll({
    where: {
      salleId: salle.id,
      classeId: classe.id,
      anneeAcademiqueId,
      regime,
      etablissementId,
    },
    transaction,
  });
  if (affectations.length > 1) {
    throw new Error(`Affectations en doublon pour ${classe.libelle} et ${salle.libelle}.`);
  }
  if (affectations.length === 1) {
    await affectations[0].update(dates, { transaction });
    return;
  }
  await AffectationSalleClasse.create({
    salleId: salle.id,
    classeId: classe.id,
    anneeAcademiqueId,
    regime,
    etablissementId,
    ...dates,
  }, { transaction });
}

export async function seedRepartitionSallesEsa(apply = false): Promise<void> {
  require('../../modules/inscription/models/_associations');
  const sequelize = DatabaseConnection.getInstance().sequelize;
  const dates = lireDates();
  const transaction = await sequelize.transaction();
  let classesCount = 0;
  let sallesCount = 0;
  let affectationsCount = 0;

  try {
    const etablissement = await trouverEtablissement(transaction);
    const [anneeAcademique] = await AnneeAcademique.findOrCreate({
      where: { libelle: ANNEE_ACADEMIQUE },
      defaults: { libelle: ANNEE_ACADEMIQUE, description: `Année académique ${ANNEE_ACADEMIQUE}` },
      transaction,
    });

    const niveaux = new Map<NiveauCode, NiveauEtude>();
    for (const [code, libelle] of Object.entries(NIVEAUX) as Array<[NiveauCode, string]>) {
      const [niveau] = await NiveauEtude.findOrCreate({
        where: { libelle },
        defaults: { libelle },
        transaction,
      });
      niveaux.set(code, niveau);
    }

    const parcoursByCodeAndType = new Map<string, Parcours[]>();
    for (const definition of AFFECTATIONS.filter(item => !item.toutesLesFilieres)) {
      const type = definition.niveau === 'M1' || definition.niveau === 'M2' ? 'MASTER' : 'LICENCE';
      for (const code of new Set(definition.codes || [])) {
        const key = `${code}:${type}`;
        if (parcoursByCodeAndType.has(key)) continue;
        const titres = FILIERES[code];
        if (!titres) throw new Error(`Sigle de filière non configuré : ${code}.`);
        parcoursByCodeAndType.set(key, await Promise.all(titres.map(titre =>
          trouverOuCreerParcours(titre, type, etablissement.id, transaction)
        )));
      }
    }

    const allLicenceParcours = Array.from(new Map(
      Array.from(parcoursByCodeAndType.entries())
        .filter(([key]) => key.endsWith(':LICENCE'))
        .flatMap(([, parcours]) => parcours)
        .map(parcours => [parcours.id, parcours])
    ).values());

    const salleCache = new Map<string, SalleDeClasse>();
    const sallePour = async (etage: number, numero: number): Promise<SalleDeClasse> => {
      const key = `${etage}-${numero}`;
      const cached = salleCache.get(key);
      if (cached) return cached;
      const salle = await trouverOuCreerSalle(etage, numero, etablissement.id, transaction);
      salleCache.set(key, salle);
      sallesCount++;
      return salle;
    };

    for (const definition of AFFECTATIONS) {
      const niveau = niveaux.get(definition.niveau);
      if (!niveau) throw new Error(`Niveau ${definition.niveau} manquant.`);
      const salle = await sallePour(definition.etage, definition.salle);
      const parcoursType = definition.niveau === 'M1' || definition.niveau === 'M2' ? 'MASTER' : 'LICENCE';
      const parcours = definition.toutesLesFilieres
        ? allLicenceParcours
        : Array.from(new Set(definition.codes || [])).flatMap(code => {
          const correspondances = parcoursByCodeAndType.get(`${code}:${parcoursType}`);
          if (!correspondances) throw new Error(`Sigle de filière non configuré pour ${parcoursType} : ${code}.`);
          return correspondances;
        });

      for (const filiere of parcours) {
        const code = (definition.codes || []).find(candidate =>
          FILIERES[candidate]?.some(titre => normaliser(titre) === normaliser(filiere.titre))
        ) || normaliser(filiere.titre).slice(0, 12).toUpperCase();
        const classe = await trouverOuCreerClasse(
          code,
          filiere,
          niveau,
          definition.regime,
          etablissement.id,
          transaction,
        );
        classesCount++;
        await affecterSalle(
          salle,
          classe,
          anneeAcademique.id,
          definition.regime,
          etablissement.id,
          dates,
          transaction,
        );
        affectationsCount++;
      }
    }

    if (!apply) {
      await transaction.rollback();
      console.log(`[DRY-RUN] Établissement : ${etablissement.nom} (#${etablissement.id})`);
      console.log(`[DRY-RUN] ${sallesCount} salles, ${classesCount} classes et ${affectationsCount} affectations simulées.`);
      console.log(`[DRY-RUN] Période : ${dates.dateDebut} → ${dates.dateFin}`);
      console.log('[DRY-RUN] Aucune donnée enregistrée. Utilisez l’option --apply pour appliquer la répartition.');
      return;
    }

    await transaction.commit();
    console.log(`Répartition ESA-SUPER-TACO ${ANNEE_ACADEMIQUE} enregistrée.`);
    console.log(`${sallesCount} salles, ${classesCount} classes, ${affectationsCount} affectations traitées.`);
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
}

if (require.main === module) {
  const apply = process.argv.includes('--apply');
  seedRepartitionSallesEsa(apply)
    .then(() => process.exit(0))
    .catch(error => {
      console.error('Erreur de répartition des salles ESA :', error);
      process.exit(1);
    });
}
