import { AnneeAcademique } from "../../inscription/models/AnneeAcademique";
import { Classe } from "../../inscription/models/Classe";
import { Cours } from "../../inscription/models/Cours";
import { NiveauEtude } from "../../inscription/models/NiveauEtude";
import { Parcours } from "../../inscription/models/Parcours";
import { SemestreAcademique } from "../../inscription/models/SemestreAcademique";
import { CoursEnLigne } from "../models/CoursEnLigne";

/* ═══════════════════════════════════════════════════════════════════════════
 * ArborescenceElearningService
 * ───────────────────────────────────────────────────────────────────────────
 * Construit l'arborescence académique utilisée pour rattacher les cours en
 * ligne au catalogue pédagogique (lecture SEULE des modèles inscription) :
 *
 *   AnnéeAcadémique → Parcours (filière) → NiveauEtude → Classe → Cours → CoursEnLigne
 *
 * Notes d'adaptation au schéma réel découvert en exploration :
 *   - Il n'existe PAS de modèle « Filiere » ni de clé `filiereId` dans le module
 *     inscription. La « filière » est portée par `Parcours.titre` (c'est le
 *     mapping utilisé partout ailleurs dans le codebase, ex. RegistreAcademique).
 *   - `AnneeAcademique` n'a aucune FK directe vers Parcours/Classe/Cours.
 *     Le pont réel Année → Parcours est la table `SemestreAcademique`
 *     (`anneeAcademiqueId` + `parcoursId`). Si une année ne possède aucun
 *     semestre, on retombe sur l'ensemble du catalogue (l'arbre ne doit
 *     jamais être vide).
 *   - `CoursEnLigne.coursId` est une chaîne libre (STRING, sans FK) qui
 *     référence `Cours.id`. Les cours en ligne dont `coursId` est NULL ou ne
 *     résout aucun cours existant sont regroupés à la racine sous la rubrique
 *     « nonRattaches » (visible par l'administration).
 *
 * Performance : 7 requêtes groupées en parallèle puis jointures en mémoire.
 * Aucune boucle N+1.
 * ═══════════════════════════════════════════════════════════════════════════ */

/* ── Contrat API exporté (réutilisable pour le typage Angular) ── */

export interface CoursEnLigneArbre {
  id: number | string;
  coursId: string | null;
  titre: string;
  description: string | null;
  statut: string;
  format: string | null;
  enseignantId: number | null;
}

export interface CoursArbre {
  id: number;
  code: string;
  intitule: string;
  classeId: number | null;
  compteurCoursEnLigne: number;
  coursEnLigne: CoursEnLigneArbre[];
}

export interface ClasseArbre {
  id: number | null;
  libelle: string;
  estVirtuel?: boolean;
  compteurCoursEnLigne: number;
  cours: CoursArbre[];
}

export interface NiveauArbre {
  id: number | null;
  libelle: string;
  compteurCoursEnLigne: number;
  classes: ClasseArbre[];
}

export interface ParcoursArbre {
  id: number;
  titre: string;
  description: string | null;
  compteurCoursEnLigne: number;
  niveaux: NiveauArbre[];
}

export interface AnneeAcademiqueArbre {
  id: number;
  libelle: string;
  compteurCoursEnLigne: number;
  parcours: ParcoursArbre[];
}

export interface TotauxArborescence {
  annees: number;
  parcours: number;
  niveaux: number;
  classes: number;
  cours: number;
  coursEnLigne: number;
  coursEnLigneRattaches: number;
  coursEnLigneNonRattaches: number;
}

export interface ArborescenceElearningResponse {
  annees: AnneeAcademiqueArbre[];
  nonRattaches: CoursEnLigneArbre[];
  totaux: TotauxArborescence;
}

/* ── Constantes d'affichage ── */

const LIBELLE_CLASSE_VIRTUELLE = "Sans classe";
const LIBELLE_NIVEAU_INDEFINI = "Niveau non défini";

/* ── Contexte de construction partagé (évite de se balader les maps) ── */

interface ContexteConstruction {
  classesParParcours: Map<number, Classe[]>;
  classesSansParcours: Map<number, Classe>;
  coursByParcours: Map<number, Cours[]>;
  niveauById: Map<number, NiveauEtude>;
  coursEnLigneByCoursId: Map<string, CoursEnLigne[]>;
}

export class ArborescenceElearningService {

  static async construireArborescence(): Promise<ArborescenceElearningResponse> {
    /* ── 1. Requêtes groupées en parallèle (7 requêtes, zéro N+1) ── */
    const [annees, parcoursList, niveaux, classes, coursList, coursEnLigneList, semestres] = await Promise.all([
      AnneeAcademique.findAll({ order: [['libelle', 'ASC']] }),
      Parcours.findAll({ order: [['titre', 'ASC']] }),
      NiveauEtude.findAll({ order: [['libelle', 'ASC']] }),
      Classe.findAll({ order: [['libelle', 'ASC']] }),
      Cours.findAll({ order: [['intitule', 'ASC']] }),
      CoursEnLigne.findAll({ order: [['titre', 'ASC']] }),
      SemestreAcademique.findAll({ attributes: ['id', 'anneeAcademiqueId', 'parcoursId'] }),
    ]);

    /* ── 2. Index en mémoire ── */
    const niveauById = new Map<number, NiveauEtude>(niveaux.map((n) => [Number(n.id), n]));
    const coursIdsRattaches = new Set(coursList.map((c) => String(c.id)));

    // Cours groupés par parcours (Cours.parcoursId est NOT NULL, donc ancre fiable)
    const coursByParcours = new Map<number, Cours[]>();
    for (const c of coursList) {
      const pId = Number(c.parcoursId);
      const bucket = coursByParcours.get(pId);
      if (bucket) bucket.push(c);
      else coursByParcours.set(pId, [c]);
    }

    // Classes : celles qui déclarent un parcoursId vs celles qui n'en ont pas
    const classesParParcours = new Map<number, Classe[]>();
    const classesSansParcours = new Map<number, Classe>();
    for (const cl of classes) {
      if (cl.parcoursId != null) {
        const pId = Number(cl.parcoursId);
        const bucket = classesParParcours.get(pId);
        if (bucket) bucket.push(cl);
        else classesParParcours.set(pId, [cl]);
      } else {
        classesSansParcours.set(Number(cl.id), cl);
      }
    }

    // Cours en ligne groupés par référence cours (chaîne) ; les non rattachés isolés
    const coursEnLigneByCoursId = new Map<string, CoursEnLigne[]>();
    const nonRattaches: CoursEnLigneArbre[] = [];
    for (const cel of coursEnLigneList) {
      const reference = cel.coursId ? String(cel.coursId).trim() : "";
      if (!reference || !coursIdsRattaches.has(reference)) {
        nonRattaches.push(toCoursEnLigneArbre(cel));
      } else {
        const bucket = coursEnLigneByCoursId.get(reference);
        if (bucket) bucket.push(cel);
        else coursEnLigneByCoursId.set(reference, [cel]);
      }
    }

    /* ── 3. Pont Année académique → Parcours (via SemestreAcademique) ── */
    const parcoursParAnnee = new Map<number, number[]>();
    for (const s of semestres) {
      if (s.anneeAcademiqueId == null || s.parcoursId == null) continue;
      const aId = Number(s.anneeAcademiqueId);
      const pId = Number(s.parcoursId);
      const bucket = parcoursParAnnee.get(aId);
      if (bucket) {
        if (!bucket.includes(pId)) bucket.push(pId);
      } else {
        parcoursParAnnee.set(aId, [pId]);
      }
    }
    const tousParcoursIds = parcoursList.map((p) => Number(p.id));

    const ctx: ContexteConstruction = {
      classesParParcours,
      classesSansParcours,
      coursByParcours,
      niveauById,
      coursEnLigneByCoursId,
    };

    /* ── 4. Assemblage de l'arbre ── */
    const anneesArbre: AnneeAcademiqueArbre[] = annees.map((a) => {
      const parcoursIdsLiees = parcoursParAnnee.get(Number(a.id)) || [];
      // Fallback : sans semestre pour cette année, on expose tout le catalogue
      const idsSelectionnes = parcoursIdsLiees.length > 0 ? parcoursIdsLiees : tousParcoursIds;
      const selection = new Set(idsSelectionnes);

      const parcoursArbre = parcoursList
        .filter((p) => selection.has(Number(p.id)))
        .map((p) => buildParcoursArbre(p, ctx));

      return {
        id: Number(a.id),
        libelle: a.libelle,
        compteurCoursEnLigne: parcoursArbre.reduce((s, p) => s + p.compteurCoursEnLigne, 0),
        parcours: parcoursArbre,
      };
    });

    return {
      annees: anneesArbre,
      nonRattaches,
      totaux: {
        annees: annees.length,
        parcours: parcoursList.length,
        niveaux: niveaux.length,
        classes: classes.length,
        cours: coursList.length,
        coursEnLigne: coursEnLigneList.length,
        coursEnLigneRattaches: coursEnLigneList.length - nonRattaches.length,
        coursEnLigneNonRattaches: nonRattaches.length,
      },
    };
  }
}

/* ── Fonctions de construction (jointures en mémoire) ── */

function buildParcoursArbre(parcours: Parcours, ctx: ContexteConstruction): ParcoursArbre {
  const pId = Number(parcours.id);
  const coursDuParcours = ctx.coursByParcours.get(pId) || [];

  // Classes rattachées au parcours :
  //  1. déclarées explicitement (Classe.parcoursId == parcours.id)
  //  2. sans parcours mais référencées par un cours du parcours (Cours.classeId)
  const classesAttachees = new Map<number, Classe>();
  for (const cl of ctx.classesParParcours.get(pId) || []) {
    classesAttachees.set(Number(cl.id), cl);
  }
  for (const c of coursDuParcours) {
    if (c.classeId != null) {
      const cl = ctx.classesSansParcours.get(Number(c.classeId));
      if (cl) classesAttachees.set(Number(cl.id), cl);
    }
  }

  const classesArbre: ClasseArbre[] = [...classesAttachees.values()]
    .sort((a, b) => a.libelle.localeCompare(b.libelle))
    .map((cl) => buildClasseArbre(cl, coursDuParcours, ctx.coursEnLigneByCoursId));

  // Cours du parcours sans classe rattachée (classeId NULL ou classe inconnue)
  const coursSansClasse = coursDuParcours.filter((c) => {
    if (c.classeId == null) return true;
    return !classesAttachees.has(Number(c.classeId));
  });
  if (coursSansClasse.length > 0) {
    const coursArbre = coursSansClasse.map((c) => buildCoursArbre(c, ctx.coursEnLigneByCoursId));
    classesArbre.push({
      id: null,
      libelle: LIBELLE_CLASSE_VIRTUELLE,
      estVirtuel: true,
      compteurCoursEnLigne: coursArbre.reduce((s, c) => s + c.compteurCoursEnLigne, 0),
      cours: coursArbre,
    });
  }

  // Niveau du parcours (Parcours.niveauEtudeId → NiveauEtude, relation 1..1 dans le schéma)
  const niveau = parcours.niveauEtudeId != null ? ctx.niveauById.get(Number(parcours.niveauEtudeId)) : undefined;
  const compteurNiveau = classesArbre.reduce((s, cl) => s + cl.compteurCoursEnLigne, 0);

  const niveauArbre: NiveauArbre = {
    id: niveau
      ? Number(niveau.id)
      : parcours.niveauEtudeId != null
        ? Number(parcours.niveauEtudeId)
        : null,
    libelle: niveau?.libelle ?? LIBELLE_NIVEAU_INDEFINI,
    compteurCoursEnLigne: compteurNiveau,
    classes: classesArbre,
  };

  return {
    id: pId,
    titre: parcours.titre,
    description: parcours.description ?? null,
    compteurCoursEnLigne: compteurNiveau,
    niveaux: [niveauArbre],
  };
}

function buildClasseArbre(
  classe: Classe,
  coursDuParcours: Cours[],
  coursEnLigneByCoursId: Map<string, CoursEnLigne[]>,
): ClasseArbre {
  const coursDeLaClasse = coursDuParcours.filter(
    (c) => c.classeId != null && Number(c.classeId) === Number(classe.id),
  );
  const coursArbre = coursDeLaClasse.map((c) => buildCoursArbre(c, coursEnLigneByCoursId));
  return {
    id: Number(classe.id),
    libelle: classe.libelle,
    compteurCoursEnLigne: coursArbre.reduce((s, c) => s + c.compteurCoursEnLigne, 0),
    cours: coursArbre,
  };
}

function buildCoursArbre(cours: Cours, coursEnLigneByCoursId: Map<string, CoursEnLigne[]>): CoursArbre {
  const cels = coursEnLigneByCoursId.get(String(cours.id)) || [];
  return {
    id: Number(cours.id),
    code: cours.code,
    intitule: cours.intitule,
    classeId: cours.classeId != null ? Number(cours.classeId) : null,
    compteurCoursEnLigne: cels.length,
    coursEnLigne: cels.map(toCoursEnLigneArbre),
  };
}

function toCoursEnLigneArbre(cel: CoursEnLigne): CoursEnLigneArbre {
  return {
    id: cel.id,
    coursId: cel.coursId ?? null,
    titre: cel.titre,
    description: cel.description ?? null,
    statut: cel.statut ?? "actif",
    format: cel.format ?? null,
    enseignantId: cel.enseignantId ?? null,
  };
}
