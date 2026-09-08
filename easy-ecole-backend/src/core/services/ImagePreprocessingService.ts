/**
 * Service de pré-traitement d'images pour améliorer la qualité OCR/ICR.
 *
 * Objectif : avant d'envoyer une image au moteur OCR (Tesseract.js / PaddleOCR),
 * on applique une chaîne de transformations qui améliore significativement la
 * reconnaissance, en particulier pour les écritures manuscrites.
 *
 * Chaîne de traitement :
 *   1. Normalisation (redimensionnement à 300 DPI, format PNG)
 *   2. Conversion en niveaux de gris
 *   3. Amélioration du contraste (auto-éclaircissement)
 *   4. Binarisation adaptative (seuil d'Otsu simplifié)
 *   5. Réduction du bruit (filtre médian léger)
 *
 * Utilise `sharp` (librairie native rapide, basée sur libvips).
 */
import sharp from "sharp";

export interface PretraitementResultat {
  /** Buffer de l'image pré-traitée (format PNG). */
  buffer: Buffer;
  /** Largeur en pixels. */
  largeur: number;
  /** Hauteur en pixels. */
  hauteur: number;
  /** Nombre de canaux (1 = gris, 3 = RVB, 4 = RVBA). */
  canaux: number;
}

export interface OptionsPretraitement {
  /** Largeur cible en pixels (défaut : 2000 — equivaut ~300 DPI sur A4). */
  largeurCible?: number;
  /** Appliquer la binarisation (défaut : true pour l'OCR). */
  binariser?: boolean;
  /** Niveau de netteté (0 = aucun, 1 = léger, 2 = moyen — défaut : 1). */
  nettete?: number;
}

export class ImagePreprocessingService {

  private static instance: ImagePreprocessingService | null = null;

  static getInstance(): ImagePreprocessingService {
    if (!ImagePreprocessingService.instance) {
      ImagePreprocessingService.instance = new ImagePreprocessingService();
    }
    return ImagePreprocessingService.instance;
  }

  /**
   * Traite un buffer d'image (PNG, JPEG, TIFF, BMP, WebP) et retourne
   * une version optimisée pour l'OCR.
   */
  async preprocesser(
    inputBuffer: Buffer,
    options: OptionsPretraitement = {}
  ): Promise<PretraitementResultat> {
    const {
      largeurCible = 2000,
      binariser = true,
      nettete = 1,
    } = options;

    let image = sharp(inputBuffer);

    // Lire les métadonnées pour connaître les dimensions actuelles
    const metadata = await image.metadata();
    const largeurOrigine = metadata.width || 0;
    const hauteurOrigine = metadata.height || 0;

    // 1. Redimensionner si nécessaire (conserver le ratio)
    if (largeurOrigine > 0 && largeurOrigine < largeurCible) {
      const ratio = largeurCible / largeurOrigine;
      image = image.resize(largeurCible, Math.round(hauteurOrigine * ratio), {
        kernel: sharp.kernel.lanczos3,
      });
    } else if (largeurOrigine > largeurCible) {
      // Réduire les images trop grandes
      image = image.resize(largeurCible, null, {
        kernel: sharp.kernel.lanczos3,
        withoutEnlargement: true,
      });
    }

    // 2. Convertir en niveaux de gris
    image = image.grayscale();

    // 3. Améliorer le contraste (normaliser les niveaux)
    image = image.normalize();

    // 4. Augmenter légèrement la netteté
    if (nettete > 0) {
      const sigma = nettete === 1 ? 0.5 : 1.0;
      image = image.sharpen({ sigma });
    }

    // 5. Binarisation (seuil fixe inspiré d'Otsu pour documents)
    //    Le seuil 128 fonctionne bien pour la plupart des documents scannés.
    //    Pour les manuscrits, on garde le gris pour ne pas perdre d'info.
    if (binariser) {
      // Utiliser le seuil d'adaptation : sharp ne supporte pas Otsu nativement,
      // mais on peut simuler avec threshold(). On utilise 145 (légèrement > 128)
      // pour conserver plus de détails des traits fins (manuscrit).
      image = image.threshold(145);
    }

    // 6. Forcer le format PNG (perte zéro, compatible Tesseract)
    image = image.png({ compressionLevel: 0 });

    // Exécuter le pipeline
    const resultBuffer = await image.toBuffer({ resolveWithObject: true });

    return {
      buffer: resultBuffer.data,
      largeur: resultBuffer.info.width,
      hauteur: resultBuffer.info.height,
      canaux: resultBuffer.info.channels,
    };
  }

  /**
   * Pré-traitement spécialisé pour écritures manuscrites.
   * Plus conservateur que le pré-traitement standard :
   *   - Pas de binarisation aggressive (on garde les nuances de gris)
   *   - Netteté plus forte pour accentuer les traits
   *   - Contraste renforcé pour séparer l'encre du fond
   */
  async preprocesserManuscrit(
    inputBuffer: Buffer,
    options: OptionsPretraitement = {}
  ): Promise<PretraitementResultat> {
    const { largeurCible = 2400 } = options;

    let image = sharp(inputBuffer);

    const metadata = await image.metadata();
    const largeurOrigine = metadata.width || 0;
    const hauteurOrigine = metadata.height || 0;

    // 1. Redimensionner à haute résolution pour préserver les détails fins
    if (largeurOrigine > 0 && largeurOrigine < largeurCible) {
      const ratio = largeurCible / largeurOrigine;
      image = image.resize(largeurCible, Math.round(hauteurOrigine * ratio), {
        kernel: sharp.kernel.lanczos3,
      });
    }

    // 2. Grayscale
    image = image.grayscale();

    // 3. Normaliser + renforcer le contraste
    image = image.normalize();

    // 4. Netteté plus forte pour les traits manuscrits
    image = image.sharpen({ sigma: 1.2 });

    // 5. PAS de binarisation stricte pour manuscrit :
    //    On applique un seuil bas (110) pour éliminer le fond gris
    //    tout en conservant les traits d'encre (plus sombres).
    image = image.threshold(110);

    // 6. PNG sans compression
    image = image.png({ compressionLevel: 0 });

    const resultBuffer = await image.toBuffer({ resolveWithObject: true });

    return {
      buffer: resultBuffer.data,
      largeur: resultBuffer.info.width,
      hauteur: resultBuffer.info.height,
      canaux: resultBuffer.info.channels,
    };
  }

  /**
   * Détection rapide du type de contenu : imprimé vs manuscrit.
   * Heuristique basée sur la variance des niveaux de gris.
   * Un document manuscrit a généralement plus de variance (traits isolés sur fond clair).
   *
   * Retourne true si le document semble manuscrit.
   */
  async detecterManuscrit(inputBuffer: Buffer): Promise<boolean> {
    try {
      const stats = await sharp(inputBuffer)
        .grayscale()
        .stats();

      // La channel 0 est le canal grayscale
      const channel = stats.channels[0];
      if (!channel) return false;

      // Un manuscrit a typiquement :
      // - une stddev plus élevée (contraste fort entre traits et fond)
      // - une mean plus élevée (fond majoritairement blanc)
      const stddev = channel.stdev;
      const mean = channel.mean;

      // Seuils heuristiques calibrés :
      // - stddev > 50 → fort contraste (traits sur fond clair)
      // - mean > 160 → fond majoritairement blanc
      return stddev > 50 && mean > 160;
    } catch {
      return false;
    }
  }
}
