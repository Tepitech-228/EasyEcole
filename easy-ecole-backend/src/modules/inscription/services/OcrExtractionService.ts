/**
 * Service d'extraction de données par OCR/ICR pour le wizard d'inscription.
 *
 * Objectif : pré-remplir les champs d'informations personnelles de l'étudiant à
 * partir des pièces déposées (autorisation provisoire, CNI, relevés…).
 *
 * Conception :
 *  - Un RÉFÉRENTIEL ("Document → champs récupérables → fiabilité") décrit, pour
 *    chaque type de pièce, les informations que l'OCR peut extraire et leur
 *    niveau de fiabilité (🟢 Très bonne / Bonne / Bonne à moyenne).
 *  - Une règle de CONSOLIDATION permet d'agréger les extractions sur plusieurs
 *    documents :
 *        collecte → normalisation → déduplication → fusion (priorité fiabilité)
 *    Chaque champ final ne porte QU'UNE SEULE valeur, même si le même renseignement
 *    apparaît dans plusieurs pièces.
 *
 * État actuel :
 *  - Pré-traitement d'images via `sharp` (binarisation, contraste, netteté)
 *    avec détection automatique imprimé/manuscrit.
 *  - Tesseract.js v6 en français pour l'OCR/ICR.
 *  - Regex enrichies avec tolérance aux erreurs de reconnaissance (manuscrit).
 *  - Nettoyage automatique des fichiers temporaires après traitement.
 *  - Le hook du moteur (`extraireDepuisStructures`) est le point d'intégration
 *    (PaddleOCR / Surya on-premise recommandé — les documents restent dans
 *    l'établissement, pas d'envoi PII vers un cloud tiers).
 *  - La consolidation est prête et testable indépendamment du moteur.
 *
 * Le contrat de sortie (`InfoPersonnelles`) est stable : branché ou non, le
 * contrôleur et le frontend ne changent pas d'interface.
 */
import * as fs from "fs";
import * as path from "path";
import { createWorker } from "tesseract.js";
import { ImagePreprocessingService } from "../../../core/services/ImagePreprocessingService";

export interface InfoPersonnelles {
  nom: string;
  prenoms: string;
  dateNaissance: string;
  lieuNaissance: string;
  sexe: string;
  nationalite: string;
  contact: string;
  email: string;
  adresse: string;
  numeroPiece: string;
  nomParents: string;
  prenomsParents: string;
  numeroReferenceActe: string;
  dateDelivrance: string;
  lieuDelivrance: string;
  numeroCarte: string;
  dateExpiration: string;
  anneeBac: string;
  serieFiliere: string;
  mention: string;
  centreExamen: string;
  numeroDiplomeAttestation: string;
  matieres: string;
  notes: string;
  moyennes: string;
  resultatAdmission: string;
  numeroCandidat: string;
  anneeAcademique: string;
  niveau: string;
  semestre: string;
  ue: string;
  credits: string;
  decisionAdmission: string;
  diplome: string;
  filiere: string;
  etablissement: string;
  dateObtention: string;
  montant: string;
  datePaiement: string;
  banque: string;
  referenceBancaire: string;
  numeroBordereau: string;
  motifPaiement: string;
  numeroRecu: string;
  matricule: string;
  dateDocument: string;
  objet: string;
  formationNiveauDemande: string;
  // Métadonnées : niveau de confiance du moteur (0..1) et champs extraits.
  confiance?: number;
  champsExtraits?: string[];
}

type ChampPersonnel = Exclude<keyof InfoPersonnelles, "confiance" | "champsExtraits">;
type ChampProfilOcr = "nom" | "prenoms" | "dateNaissance" | "lieuNaissance" | "sexe" | "nationalite" | "contact" | "adresse" | "numeroPiece";

export type ResultatProfilOcr = Partial<Pick<InfoPersonnelles, ChampProfilOcr>> & {
  champsExtraits?: ChampProfilOcr[];
};

const CHAMPS_PROFIL_OCR: ChampProfilOcr[] = [
  "nom", "prenoms", "dateNaissance", "lieuNaissance", "sexe",
  "nationalite", "contact", "adresse", "numeroPiece",
];

export interface DocumentSoumis {
  nomFichier: string;
  chemin?: string;
  buffer?: Buffer;
  mimeType?: string;
  typeDocument?: TypeDocument;
}

interface StructureDocument extends DocumentSoumis {
  buffer: Buffer;
  typeDocument: TypeDocument;
}

interface ExtractionOcr extends Partial<InfoPersonnelles> {
  typeDocument?: TypeDocument;
  fiabiliteParChamp?: Partial<Record<ChampPersonnel, Fiabilite>>;
}

/* ------------------------------------------------------------------------- */
/* Référentiel Document → champs OCR → fiabilité                            */
/* ------------------------------------------------------------------------- */

/** Niveau de fiabilité d'un champ extrait (poids croissant = moins fiable). */
export enum Fiabilite {
  TRES_BONNE = 1, // 🟢 Très bonne
  BONNE = 2,      // 🟢 Bonne
  BONNE_A_MOYENNE = 3, // 🟢 Bonne à moyenne
  MOYENNE = 4, // 🟡 Moyenne
}

export const LIBELLES_FIABILITE: Record<Fiabilite, string> = {
  [Fiabilite.TRES_BONNE]: "Très bonne",
  [Fiabilite.BONNE]: "Bonne",
  [Fiabilite.BONNE_A_MOYENNE]: "Bonne à moyenne",
  [Fiabilite.MOYENNE]: "Moyenne",
};

/** Type de pièce reconnu par le référentiel. */
export enum TypeDocument {
  ACTE_NAISSANCE = "ACTE_NAISSANCE",
  CNI = "CNI",
  ATTESTATION_BAC = "ATTESTATION_BAC",
  RELEVE_BAC = "RELEVE_BAC",
  RELEVES_LICENCE = "RELEVES_LICENCE",
  ATTESTATION_REUSSITE_LICENCE = "ATTESTATION_REUSSITE_LICENCE",
  DUPLICATA_NATIONALITE = "DUPLICATA_NATIONALITE",
  BORDEREAU = "BORDEREAU",
  RECU_FRAIS = "RECU_FRAIS",
  DEMANDE_DG = "DEMANDE_DG",
  PHOTO = "PHOTO",
}

/** Map un type de document vers les champs consolidés qu'il peut alimenter. */
export interface ReferentielChamp {
  champ: ChampPersonnel;
  fiabilite: Fiabilite;
}

/**
 * Référentiel OCR : pour chaque type de pièce, la liste des champs d'infos
 * personnelles qu'il peut fournir et leur fiabilité (voir matrice métier).
 */
export const REFERENTIEL_OCR: Record<TypeDocument, ReferentielChamp[]> = {
  [TypeDocument.ACTE_NAISSANCE]: [
    { champ: "nom", fiabilite: Fiabilite.BONNE_A_MOYENNE },
    { champ: "prenoms", fiabilite: Fiabilite.BONNE_A_MOYENNE },
    { champ: "dateNaissance", fiabilite: Fiabilite.BONNE_A_MOYENNE },
    { champ: "lieuNaissance", fiabilite: Fiabilite.BONNE_A_MOYENNE },
    { champ: "sexe", fiabilite: Fiabilite.BONNE_A_MOYENNE },
    { champ: "nomParents", fiabilite: Fiabilite.BONNE_A_MOYENNE },
    { champ: "prenomsParents", fiabilite: Fiabilite.BONNE_A_MOYENNE },
    { champ: "numeroReferenceActe", fiabilite: Fiabilite.BONNE_A_MOYENNE },
    { champ: "dateDelivrance", fiabilite: Fiabilite.BONNE_A_MOYENNE },
    { champ: "lieuDelivrance", fiabilite: Fiabilite.BONNE_A_MOYENNE },
  ],
  [TypeDocument.CNI]: [
    { champ: "nom", fiabilite: Fiabilite.TRES_BONNE },
    { champ: "prenoms", fiabilite: Fiabilite.TRES_BONNE },
    { champ: "dateNaissance", fiabilite: Fiabilite.TRES_BONNE },
    { champ: "lieuNaissance", fiabilite: Fiabilite.TRES_BONNE },
    { champ: "nationalite", fiabilite: Fiabilite.TRES_BONNE },
    { champ: "sexe", fiabilite: Fiabilite.TRES_BONNE },
    { champ: "numeroCarte", fiabilite: Fiabilite.TRES_BONNE },
    { champ: "numeroPiece", fiabilite: Fiabilite.TRES_BONNE },
    { champ: "dateDelivrance", fiabilite: Fiabilite.TRES_BONNE },
    { champ: "dateExpiration", fiabilite: Fiabilite.TRES_BONNE },
    { champ: "adresse", fiabilite: Fiabilite.BONNE },
  ],
  [TypeDocument.ATTESTATION_BAC]: [
    { champ: "nom", fiabilite: Fiabilite.BONNE },
    { champ: "prenoms", fiabilite: Fiabilite.BONNE },
    { champ: "dateNaissance", fiabilite: Fiabilite.BONNE },
    { champ: "lieuNaissance", fiabilite: Fiabilite.BONNE },
    { champ: "anneeBac", fiabilite: Fiabilite.BONNE },
    { champ: "serieFiliere", fiabilite: Fiabilite.BONNE },
    { champ: "mention", fiabilite: Fiabilite.BONNE },
    { champ: "centreExamen", fiabilite: Fiabilite.BONNE },
    { champ: "numeroDiplomeAttestation", fiabilite: Fiabilite.BONNE },
  ],
  [TypeDocument.RELEVE_BAC]: [
    { champ: "nom", fiabilite: Fiabilite.BONNE },
    { champ: "prenoms", fiabilite: Fiabilite.BONNE },
    { champ: "anneeBac", fiabilite: Fiabilite.BONNE },
    { champ: "serieFiliere", fiabilite: Fiabilite.BONNE },
    { champ: "matieres", fiabilite: Fiabilite.BONNE },
    { champ: "notes", fiabilite: Fiabilite.BONNE },
    { champ: "moyennes", fiabilite: Fiabilite.BONNE },
    { champ: "resultatAdmission", fiabilite: Fiabilite.BONNE },
    { champ: "numeroCandidat", fiabilite: Fiabilite.BONNE },
  ],
  [TypeDocument.RELEVES_LICENCE]: [
    { champ: "nom", fiabilite: Fiabilite.BONNE },
    { champ: "prenoms", fiabilite: Fiabilite.BONNE },
    { champ: "anneeAcademique", fiabilite: Fiabilite.BONNE },
    { champ: "niveau", fiabilite: Fiabilite.BONNE },
    { champ: "semestre", fiabilite: Fiabilite.BONNE },
    { champ: "ue", fiabilite: Fiabilite.BONNE },
    { champ: "credits", fiabilite: Fiabilite.BONNE },
    { champ: "notes", fiabilite: Fiabilite.BONNE },
    { champ: "moyennes", fiabilite: Fiabilite.BONNE },
    { champ: "decisionAdmission", fiabilite: Fiabilite.BONNE },
  ],
  [TypeDocument.ATTESTATION_REUSSITE_LICENCE]: [
    { champ: "nom", fiabilite: Fiabilite.BONNE },
    { champ: "prenoms", fiabilite: Fiabilite.BONNE },
    { champ: "diplome", fiabilite: Fiabilite.TRES_BONNE },
    { champ: "filiere", fiabilite: Fiabilite.TRES_BONNE },
    { champ: "anneeBac", fiabilite: Fiabilite.TRES_BONNE },
    { champ: "etablissement", fiabilite: Fiabilite.TRES_BONNE },
    { champ: "dateObtention", fiabilite: Fiabilite.TRES_BONNE },
    { champ: "mention", fiabilite: Fiabilite.TRES_BONNE },
  ],
  [TypeDocument.DUPLICATA_NATIONALITE]: [
    { champ: "nom", fiabilite: Fiabilite.BONNE },
    { champ: "prenoms", fiabilite: Fiabilite.BONNE },
    { champ: "dateNaissance", fiabilite: Fiabilite.BONNE },
    { champ: "lieuNaissance", fiabilite: Fiabilite.BONNE },
    { champ: "nationalite", fiabilite: Fiabilite.BONNE },
  ],
  [TypeDocument.BORDEREAU]: [
    { champ: "nom", fiabilite: Fiabilite.BONNE },
    { champ: "prenoms", fiabilite: Fiabilite.BONNE },
    { champ: "montant", fiabilite: Fiabilite.BONNE },
    { champ: "datePaiement", fiabilite: Fiabilite.BONNE },
    { champ: "banque", fiabilite: Fiabilite.BONNE },
    { champ: "referenceBancaire", fiabilite: Fiabilite.BONNE },
    { champ: "numeroBordereau", fiabilite: Fiabilite.BONNE },
    { champ: "motifPaiement", fiabilite: Fiabilite.BONNE },
  ],
  [TypeDocument.RECU_FRAIS]: [
    { champ: "nom", fiabilite: Fiabilite.BONNE },
    { champ: "prenoms", fiabilite: Fiabilite.BONNE },
    { champ: "montant", fiabilite: Fiabilite.BONNE },
    { champ: "dateDocument", fiabilite: Fiabilite.BONNE },
    { champ: "numeroRecu", fiabilite: Fiabilite.BONNE },
    { champ: "motifPaiement", fiabilite: Fiabilite.BONNE },
    { champ: "matricule", fiabilite: Fiabilite.BONNE },
  ],
  [TypeDocument.DEMANDE_DG]: [
    { champ: "nom", fiabilite: Fiabilite.MOYENNE },
    { champ: "prenoms", fiabilite: Fiabilite.MOYENNE },
    { champ: "dateDocument", fiabilite: Fiabilite.MOYENNE },
    { champ: "objet", fiabilite: Fiabilite.MOYENNE },
    { champ: "formationNiveauDemande", fiabilite: Fiabilite.MOYENNE },
    { champ: "adresse", fiabilite: Fiabilite.MOYENNE },
    { champ: "contact", fiabilite: Fiabilite.MOYENNE },
  ],
  [TypeDocument.PHOTO]: [],
};

/* ------------------------------------------------------------------------- */
/* Service                                                                   */
/* ------------------------------------------------------------------------- */

export class OcrExtractionService {

  private static instance: OcrExtractionService | null = null;

  static getInstance(): OcrExtractionService {
    if (!OcrExtractionService.instance) {
      OcrExtractionService.instance = new OcrExtractionService();
    }
    return OcrExtractionService.instance;
  }

  /**
   * Point d'entrée : lance l'extraction sur les documents soumis et retourne
   * les informations personnelles pré-remplies (normalisées + consolidées).
   *
   * Le nettoyage des fichiers temporaires est automatique après traitement.
   */
  async extraireInfos(documents: DocumentSoumis[]): Promise<ResultatProfilOcr> {
    const structures = await this.chargerStructures(documents);
    const fichiersTemporaires: string[] = structures
      .map((s) => s.chemin)
      .filter((c): c is string => !!c && c.includes("ocr/tmp"));

    try {
      const extractions = await this.extraireDepuisStructures(structures);
      return this.extraireResultatProfil(this.consolider(Array.isArray(extractions) ? extractions : [extractions]));
    } finally {
      // Nettoyage automatique des fichiers temporaires
      this.nettoyerFichiersTemp(fichiersTemporaires);
    }
  }

  private extraireResultatProfil(infos: InfoPersonnelles): ResultatProfilOcr {
    const resultat: ResultatProfilOcr = {};
    for (const champ of CHAMPS_PROFIL_OCR) {
      const valeur = infos[champ];
      if (valeur) resultat[champ] = valeur;
    }
    if (infos.champsExtraits) {
      resultat.champsExtraits = infos.champsExtraits.filter(
        (champ): champ is ChampProfilOcr => CHAMPS_PROFIL_OCR.includes(champ as ChampProfilOcr)
      );
    }
    return resultat;
  }

  /**
   * Charge les documents (lit le fichier si seul le chemin est fourni) en
   * buffers de travail. Limite la taille mémoire par document.
   */
  private async chargerStructures(documents: DocumentSoumis[]): Promise<StructureDocument[]> {
    const structures: StructureDocument[] = [];
    for (const doc of documents) {
      let buffer: Buffer | undefined;
      if (doc.buffer) {
        buffer = doc.buffer;
      } else if (doc.chemin && fs.existsSync(doc.chemin)) {
        const stat = fs.statSync(doc.chemin);
        if (stat.size > 15 * 1024 * 1024) continue; // limite 15 Mo par pièce
        buffer = fs.readFileSync(doc.chemin);
      }
      if (buffer) {
        structures.push({
          ...doc,
          buffer,
          typeDocument: doc.typeDocument || this.determinerTypeDocument(doc.nomFichier),
        });
      }
    }
    return structures;
  }

  /** Déduit le type métier à partir du nom de la pièce quand aucun code n'est fourni. */
  private determinerTypeDocument(nomFichier: string): TypeDocument {
    const nom = nomFichier
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toUpperCase();
    const correspondances: Array<[RegExp, TypeDocument]> = [
      [/CNI|CARTE.?NATIONALE|IDENTITE/, TypeDocument.CNI],
      [/ACTE.?NAISSANCE|NAISSANCE/, TypeDocument.ACTE_NAISSANCE],
      [/ATTESTATION.*BAC|BAC.*ATTESTATION/, TypeDocument.ATTESTATION_BAC],
      [/RELEVE.*BAC|BAC.*RELEVE/, TypeDocument.RELEVE_BAC],
      [/RELEVE.*LICENCE|LICENCE.*RELEVE/, TypeDocument.RELEVES_LICENCE],
      [/ATTESTATION.*LICENCE|LICENCE.*ATTESTATION/, TypeDocument.ATTESTATION_REUSSITE_LICENCE],
      [/DUPLICATA.*NATIONALITE|NATIONALITE/, TypeDocument.DUPLICATA_NATIONALITE],
      [/BORDEREAU|PAIEMENT/, TypeDocument.BORDEREAU],
      [/RECU|FRAIS/, TypeDocument.RECU_FRAIS],
      [/DEMANDE.*DG|DG.*DEMANDE/, TypeDocument.DEMANDE_DG],
      [/PHOTO|PASSEPORT/, TypeDocument.PHOTO],
    ];
    return correspondances.find(([pattern]) => pattern.test(nom))?.[1] || TypeDocument.PHOTO;
  }

  /**
   * ⚠️ HOOK MOTEUR OCR — intégration de PaddleOCR / Surya (on-premise).
   *
   * À terme, on appellera ici le moteur (worker/service local) sur chaque
   * buffer pour en extraire les champs. La valeur retournée alimente la
   * consolidation (déduplication + priorité fiabilité).
   *
   * Tant que le moteur n'est pas branché, on retourne {} : le frontend propose
   * un formulaire à compléter manuellement.
   */
  private async extraireDepuisStructures(
    structures: StructureDocument[]
  ): Promise<ExtractionOcr[]> {
    const extractions: ExtractionOcr[] = [];
    const worker = await createWorker("fra");
    try {
      for (const structure of structures) {
        const texte = await this.extraireTexte(structure, worker);
        if (texte) extractions.push(this.extraireChamps(texte, structure.typeDocument));
      }
    } finally {
      await worker.terminate();
    }
    return extractions;
  }

  /**
   * Extrait le texte natif (PDF textuels) ou rasterise les PDF scannes / images
   * avant OCR local.
   *
   * Le pré-traitement d'images (sharp) est appliqué automatiquement :
   *   - Détection automatique imprimé/manuscrit
   *   - Pipeline adapté (binarisation standard ou conservatrice)
   *   - Amélioration du contraste et de la netteté
   */
  private async extraireTexte(structure: StructureDocument, worker: any): Promise<string> {
    const preprocessing = ImagePreprocessingService.getInstance();
    const extension = path.extname(structure.nomFichier).toLowerCase();

    if (extension === ".pdf" || structure.mimeType === "application/pdf") {
      const pdfModule = await import("pdf-parse");
      // pdf-parse v2 exporte la classe PDFParse en export nommé (CJS). On préfère
      // l'export nommé avant `.default` (qui pointe vers l'objet de module entier).
      const PDFParseCtor = (pdfModule as any).PDFParse ?? (pdfModule as any).default ?? pdfModule;
      const parser = new PDFParseCtor({ data: structure.buffer });
      try {
        const resultat = await parser.getText({ first: 5, pageJoiner: "\n" });
        const captures = await parser.getScreenshot({ first: 5, desiredWidth: 1600, imageBuffer: true });
        const textes: string[] = [];
        for (const capture of captures.pages) {
          if (capture.data) {
            // Pré-traitement de l'image rasterisée avant OCR
            const imageBrute = Buffer.from(capture.data);
            const estManuscrit = await preprocessing.detecterManuscrit(imageBrute);
            const imagePretraitee = estManuscrit
              ? await preprocessing.preprocesserManuscrit(imageBrute)
              : await preprocessing.preprocesser(imageBrute);

            const resultatOcr = await worker.recognize(imagePretraitee.buffer);
            if (resultatOcr.data.text) textes.push(resultatOcr.data.text);
          }
        }
        // Le texte natif contient souvent les libelles imprimes, tandis que
        // les valeurs manuscrites n'existent que dans l'image rasterisee.
        return [resultat.text || "", textes.join("\n")].filter(Boolean).join("\n");
      } finally {
        await parser.destroy();
      }
    }

    // Image directe (PNG, JPEG, TIFF, etc.) — pré-traitement avant OCR
    const estManuscrit = await preprocessing.detecterManuscrit(structure.buffer);
    const imagePretraitee = estManuscrit
      ? await preprocessing.preprocesserManuscrit(structure.buffer)
      : await preprocessing.preprocesser(structure.buffer);

    const resultat = await worker.recognize(imagePretraitee.buffer);
    return resultat.data.text || "";
  }

  /**
   * Transforme le texte OCR en candidats nommés.
   *
   * Les regex sont enrichies avec :
   *   - Tolérance aux erreurs OCR courantes (espaces, tirets, caractères proches)
   *   - Variations manuscrites (ex: "NOM :" / "Nom:" / "N° NOM")
   *   - Patterns multi-lignes (libellé sur une ligne, valeur sur la suivante)
   *   - Extraction de patterns courants en manuscrit (dates, téléphones, adresses)
   */
  private extraireChamps(texte: string, typeDocument: TypeDocument): ExtractionOcr {
    const champs: ExtractionOcr = { typeDocument };

    // Libellés enrichis avec variations OCR/ICR manuscrites :
    //   - Espaces optionnels, tirets, deux-points variés
    //   - Abréviations courantes en manuscrit
    //   - Variantes orthographiques liées aux erreurs OCR
    const libelles: Partial<Record<ChampProfilOcr, string[]>> = {
      nom: [
        "nom", "noms", "nom de famille", "nom familial",
        "nom\\s*:", "nom\\s*-", "n°\\s*nom",
      ],
      prenoms: [
        "pr[eé]noms?", "premoms?", "pr[eé]nom\\s*de\\s*bapt[eê]me",
        "pr[eé]noms?\\s*:", "pr[eé]noms?\\s*-",
      ],
      dateNaissance: [
        "date\\s*de\\s*naiss(?:ance|e)", "n[eé]\\(e\\)\\s*le",
        "n[eé]e?\\s*le", "born\\s*on", "naissance\\s*:",
        "le\\s*\\d{1,2}[\\s/.-]+\\d{1,2}[\\s/.-]+\\d{2,4}",
      ],
      lieuNaissance: [
        "lieu\\s*de\\s*naiss(?:ance|e)", "n[eé]\\(e\\)\\s*[àa]",
        "n[eé]e?\\s*[àa]", "lieu\\s*de\\s*naissance\\s*:",
        "place\\s*of\\s*birth",
      ],
      sexe: [
        "sexe", "sex", "genre", "masculin", "f[eé]minin",
        "[MmFf]\\s*/\\s*[MmFf]",
      ],
      nationalite: [
        "nationalit[eé]", "nationalite", "nationalit[eé]\\s*:",
        "citoyennet[eé]", "pays",
      ],
      numeroPiece: [
        "num[eé]ro\\s*(de\\s*)?pi[eè]ce", "num[eé]ro\\s*de\\s*carte",
        "num[eé]ro\\s*CNI", "n°\\s*(de\\s*)?(?:pi[eè]ce|carte|CNI)",
        "n[°o]\\s*carte", "carte\\s*n[°o]", "id\\s*n[°o]",
        "r[eé]f[eé]rence\\s*(de\\s*)?pi[eè]ce",
      ],
      adresse: [
        "adresse", "adresse\\s*:", "domicili[eé]\\s*[àa]",
        "domicil(?:i[eé]|e)\\s*[àa]", "lieu\\s*de\\s*r[eé]sidence",
        "bo[iî]te\\s*postale", "bp\\s*\\d", "quartier",
      ],
      contact: [
        "t[eé]l[eé]phone", "tel(?:e?)phone", "contact",
        "mobile", "cellulaire", "t[eé]l[eé]phone\\s*:",
        "\\+\\d[\\d\\s.-]{8,}", // numéros internationaux
      ],
    };

    for (const [champ, valeurs] of Object.entries(libelles) as [ChampProfilOcr, string[]][]) {
      const valeur = this.valeurApresLibelle(texte, valeurs);
      if (valeur) champs[champ] = valeur;
    }

    // Extraction complémentaire de patterns spécifiques (manuscrit / imprimé)
    if (!champs.dateNaissance) {
      champs.dateNaissance = this.extraireDateGenerique(texte);
    }
    if (!champs.contact) {
      champs.contact = this.extraireTelephoneGenerique(texte);
    }
    if (!champs.numeroPiece) {
      champs.numeroPiece = this.extraireNumeroGenerique(texte);
    }

    return champs;
  }

  /**
   * Recherche la valeur après un libellé dans le texte OCR.
   *
   * Supporte deux modes :
   *   1. Libellé sur la même ligne que la valeur : "Nom : DUPONT"
   *   2. Libellé sur une ligne, valeur sur la ligne suivante (manuscrit courant)
   *
   * Les libellés peuvent contenir de la syntaxe regex (patterns entre parenthèses,
   * classes de caractères, etc.).
   */
  private valeurApresLibelle(texte: string, libelles: string[]): string {
    for (const libelle of libelles) {
      // Mode 1 : valeur sur la même ligne après le libellé
      try {
        const expression = new RegExp(
          `${libelle}\\s*(?:[:\\-=.]\\s*)?([^\\r\\n]+)`,
          "i"
        );
        const correspondance = texte.match(expression);
        if (correspondance) {
          // Le groupe de valeur est toujours le dernier (les libellés peuvent
          // contenir des groupes internes, ex: "numéro (de) pièce").
          const valeur = correspondance[correspondance.length - 1].trim();
          if (
            valeur &&
            !this.estLibelle(valeur) &&
            (valeur.length >= 2 || /^[mf]$/i.test(valeur))
          ) {
            return valeur;
          }
        }
      } catch {
        // Pattern regex invalide → on passe au suivant
      }

      // Mode 2 : libellé sur une ligne, valeur sur la ligne suivante
      try {
        const lignes = texte.split(/\r?\n/);
        const regexLibelle = new RegExp(libelle, "i");
        const index = lignes.findIndex(
          (ligne) => ligne.trim() && regexLibelle.test(ligne)
        );
        if (index >= 0) {
          const ligneSuivante = lignes
            .slice(index + 1)
            .find((ligne) => ligne.trim());
          if (ligneSuivante && !this.estLibelle(ligneSuivante.trim())) {
            return ligneSuivante.trim();
          }
        }
      } catch {
        // Pattern regex invalide → on passe au suivant
      }
    }
    return "";
  }

  /**
   * Détecte si une valeur extraite est en réalité un libellé (et non une valeur).
   * Liste élargie pour couvrir les erreurs OCR/ICR courantes sur manuscrit.
   */
  private estLibelle(valeur: string): boolean {
    return /^(nom|pr[eé]nom|date|lieu|sexe|nationalit[eé]|adresse|contact|t[eé]l[eé]phone|domicil|naissance|pi[eè]ce|carte|cni|num[eé]ro|r[eé]f[eé]rence|fili[eè]re|mention|dipl[oô]me|baccalaur[eé]at|attestation|relev[eé]|bordereau|rec[uü]|paiement|demande)/i.test(valeur.trim());
  }

  /**
   * Extrait une date au format générique depuis le texte OCR.
   * Formats supportés : DD/MM/YYYY, DD-MM-YYYY, DD.MM.YYYY, DD MM YYYY,
   *                      DD mois YYYY, etc.
   */
  private extraireDateGenerique(texte: string): string {
    const moisFR = "(?:janvier|f[eé]vrier|mars|avril|mai|juin|juillet|ao[uû]t|septembre|octobre|novembre|d[eé]cembre)";
    const patterns = [
      // DD/MM/YYYY ou DD-MM-YYYY ou DD.MM.YYYY
      /\b(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2,4})\b/,
      // DD mois YYYY
      new RegExp(`\\b(\\d{1,2})\\s+(${moisFR})\\s+(\\d{2,4})\\b`, "i"),
      // Le DD mois YYYY (pour "né(e) le...")
      new RegExp(`(?:n[eé]\\(e\\)\\s*le|le)\\s*(\\d{1,2})[\\s/.-]+(\\d{1,2})[\\s/.-]+(\\d{2,4})`, "i"),
    ];

    for (const pattern of patterns) {
      const match = texte.match(pattern);
      if (match) {
        // Retourner la date brute trouvée
        return match[0].trim();
      }
    }
    return "";
  }

  /**
   * Extrait un numéro de téléphone depuis le texte OCR.
   * Supporte formats internationaux (+225, +223, etc.) et locaux.
   */
  private extraireTelephoneGenerique(texte: string): string {
    const patterns = [
      // Format international : +225 XX XX XX XX XX
      /\+\d{1,4}[\s.\-]?\d{2,4}[\s.\-]?\d{2,4}[\s.\-]?\d{2,4}[\s.\-]?\d{0,4}/,
      // Format local : 0X XX XX XX XX (10 chiffres)
      /\b0\d[\s.\-]?\d{2}[\s.\-]?\d{2}[\s.\-]?\d{2}[\s.\-]?\d{2}\b/,
      // Format sans séparateur : 8 chiffres consécutifs commençant par 0
      /\b0\d{8,9}\b/,
    ];

    for (const pattern of patterns) {
      const match = texte.match(pattern);
      if (match) {
        return match[0].trim();
      }
    }
    return "";
  }

  /**
   * Extrait un numéro de pièce / CNI / carte depuis le texte OCR.
   * Les numéros de carte d'identité suivent souvent un pattern alphanumérique.
   */
  private extraireNumeroGenerique(texte: string): string {
    const patterns = [
      // CNI : pattern courant (ex: 1234567890 ou AB123456)
      /(?:n[°o]|num[eé]ro|no)\s*[:.\-]?\s*([A-Z0-9]{6,20})\b/i,
      // Mot-clé suivi d'une séquence alphanumérique
      /(?:carte|cni|pi[eè]ce|id)\s*[:.\-]?\s*([A-Z0-9]{6,20})\b/i,
      // Pattern alphanumérique isolé long (potentiel numéro)
      /\b([A-Z]{1,3}\d{5,15})\b/,
    ];

    for (const pattern of patterns) {
      const match = texte.match(pattern);
      if (match?.[1]) {
        return match[1].trim();
      }
    }
    return "";
  }

  /**
   * Nettoyie les fichiers temporaires créés lors de l'upload OCR.
   */
  private nettoyerFichiersTemp(fichiers: string[]): void {
    for (const fichier of fichiers) {
      try {
        if (fs.existsSync(fichier)) {
          fs.unlinkSync(fichier);
        }
      } catch {
        // Erreur silencieuse — le nettoyage n'est pas critique
      }
    }
  }

  /**
   * Consolidation multi-documents :
   *   collecte → normalisation → déduplication → fusion (priorité fiabilité).
   *
   * Chaque champ final porte UNE SEULE valeur, même si le renseignement est
   * présent sur plusieurs pièces. En cas de valeurs contradictoires, on retient
   * celle issue du document le plus fiable (poids le plus faible).
   */
  private consolider(extractions: ExtractionOcr[]): InfoPersonnelles {
    // 1. Collecte : agréger les candidats par champ.
    //    candidats[champ] = [{ valeur, fiabilite }]
    const candidats: Record<ChampPersonnel, { valeur: string; fiabilite: Fiabilite }[]> = {
      nom: [], prenoms: [], dateNaissance: [], lieuNaissance: [],
      sexe: [], nationalite: [], contact: [], email: [], adresse: [],
      numeroPiece: [],
      nomParents: [], prenomsParents: [], numeroReferenceActe: [],
      dateDelivrance: [], lieuDelivrance: [], numeroCarte: [], dateExpiration: [],
      anneeBac: [], serieFiliere: [], mention: [], centreExamen: [], numeroDiplomeAttestation: [],
      matieres: [], notes: [], moyennes: [], resultatAdmission: [], numeroCandidat: [],
      anneeAcademique: [], niveau: [], semestre: [], ue: [], credits: [], decisionAdmission: [],
      diplome: [], filiere: [], etablissement: [], dateObtention: [],
      montant: [], datePaiement: [], banque: [], referenceBancaire: [], numeroBordereau: [],
      motifPaiement: [], numeroRecu: [], matricule: [], dateDocument: [], objet: [],
      formationNiveauDemande: [],
    };

    for (const bloc of extractions) {
      if (!bloc || typeof bloc !== "object") continue;
      for (const champ of Object.keys(candidats) as ChampPersonnel[]) {
        const valeur = typeof bloc[champ] === "string" ? bloc[champ].trim() : "";
        if (!valeur) continue;
        // Fiabilité par défaut (champ sans type de document renseigné) : Bonne.
        const fiabilite = this.fiabiliteDuChamp(bloc, champ);
        candidats[champ].push({ valeur, fiabilite });
      }
    }

    const consolide: InfoPersonnelles = {
      nom: "", prenoms: "", dateNaissance: "", lieuNaissance: "",
      sexe: "", nationalite: "", contact: "", email: "", adresse: "",
      numeroPiece: "",
      nomParents: "", prenomsParents: "", numeroReferenceActe: "", dateDelivrance: "",
      lieuDelivrance: "", numeroCarte: "", dateExpiration: "", anneeBac: "", serieFiliere: "",
      mention: "", centreExamen: "", numeroDiplomeAttestation: "", matieres: "", notes: "",
      moyennes: "", resultatAdmission: "", numeroCandidat: "", anneeAcademique: "", niveau: "",
      semestre: "", ue: "", credits: "", decisionAdmission: "", diplome: "", filiere: "",
      etablissement: "", dateObtention: "", montant: "", datePaiement: "", banque: "",
      referenceBancaire: "", numeroBordereau: "", motifPaiement: "", numeroRecu: "",
      matricule: "", dateDocument: "", objet: "", formationNiveauDemande: "",
    };

    for (const champ of Object.keys(candidats) as ChampPersonnel[]) {
      consolide[champ] = this.fusionnerChamp(candidats[champ]);
      if (consolide[champ]) {
        consolide.champsExtraits = consolide.champsExtraits || [];
        if (!consolide.champsExtraits.includes(champ)) {
          consolide.champsExtraits.push(champ);
        }
      }
    }

    return consolide;
  }

  /**
   * Fiabilité d'un champ donné pour un bloc d'extraction.
   * Par défaut, on suppose une fiabilité Bonne (le bloc ne transporte pas le
   * type de document). À terme, le moteur fournira la fiabilité par champ.
   */
  private fiabiliteDuChamp(bloc: ExtractionOcr, champ: ChampPersonnel): Fiabilite {
    const fiabiliteParChamp = bloc.fiabiliteParChamp as Record<string, Fiabilite> | undefined;
    const valeur = fiabiliteParChamp?.[champ];
    if (typeof valeur === "number" && valeur >= Fiabilite.TRES_BONNE && valeur <= Fiabilite.BONNE_A_MOYENNE) {
      return valeur;
    }
    const referentiel = bloc.typeDocument && REFERENTIEL_OCR[bloc.typeDocument];
    return referentiel?.find((item) => item.champ === champ)?.fiabilite || Fiabilite.BONNE;
  }

  /**
   * Fusion d'un champ : déduplication + départage par priorité à la fiabilité.
   *  - On normalise puis compare les valeurs (déduplication des doublons).
   *  - On conserve la valeur issue de la source la plus fiable (poids min).
   */
  private fusionnerChamp(candidats: { valeur: string; fiabilite: Fiabilite }[]): string {
    if (candidats.length === 0) return "";

    // Déduplication : première occurrence d'une valeur normalisée.
    const vus = new Set<string>();
    const uniques: { valeur: string; fiabilite: Fiabilite }[] = [];
    for (const c of candidats) {
      const cle = this.normaliserValeur(c.valeur);
      if (!vus.has(cle)) {
        vus.add(cle);
        uniques.push(c);
      }
    }

    if (uniques.length === 1) return uniques[0].valeur;

    // Départage : priorité à la fiabilité (poids minimal).
    uniques.sort((a, b) => a.fiabilite - b.fiabilite);
    return uniques[0].valeur;
  }

  /**
   * Normalisation d'une valeur pour comparaison (casse, espaces multiples,
   * apostrophes) — sert à la déduplication, pas à l'affichage.
   */
  private normaliserValeur(valeur: string): string {
    return valeur
      .trim()
      .toLowerCase()
      .replace(/\s+/g, " ")
      .replace(/['’]/g, "'")
      .replace(/[.,;:!?]/g, "");
  }
}
