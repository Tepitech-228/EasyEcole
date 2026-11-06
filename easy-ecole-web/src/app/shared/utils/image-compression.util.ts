/**
 * Normalisation des images côté navigateur avant téléversement.
 *
 * Objectif mobile :
 *  - les photos prises au téléphone pèsent souvent 5 à 15 Mo, alors que le
 *    backend limite la photo de profil à 5 Mo et les pièces à 20 Mo ;
 *  - le HEIC (format par défaut des iPhone) est converti en JPEG dans le
 *    navigateur ; le backend dispose aussi d'une conversion de secours.
 *
 * La compression est faite via canvas, sans dépendance externe. Si le
 * navigateur ne sait pas décoder le fichier (HEIC sur Chrome, par exemple),
 * une erreur explicite est remontée pour que l'interface puisse guider
 * l'utilisateur au lieu d'échouer silencieusement à l'upload.
 */

export class ImageIndecodableError extends Error {
  constructor(
    message = "Cette image n'a pas pu être lue par ce navigateur. "
      + "Si c'est une photo iPhone (HEIC), convertissez-la en JPG ou choisissez une autre photo.",
  ) {
    super(message)
    this.name = 'ImageIndecodableError'
  }
}

export class ImageTropVolumineuseError extends Error {
  constructor(message = "Cette image reste trop volumineuse après compression. Choisissez une image plus petite.") {
    super(message)
    this.name = 'ImageTropVolumineuseError'
  }
}

export interface OptionsCompressionImage {
  /** Largeur/hauteur maximale en pixels (le ratio est conservé). */
  dimensionMax?: number
  /** Qualité JPEG entre 0 et 1. */
  qualite?: number
  /** Taille maximale visée en octets ; la qualité est réduite si nécessaire. */
  tailleMaxOctets?: number
}

const EXTENSIONS_IMAGE = /\.(jpe?g|png|webp|heic|heif)$/i
const TYPES_IMAGE = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/heic',
  'image/heif',
]

/** Vrai si le fichier est une image que l'on peut tenter de normaliser. */
export function estImageNormalisable(fichier: File): boolean {
  const type = (fichier.type || '').toLowerCase()
  return TYPES_IMAGE.includes(type) || EXTENSIONS_IMAGE.test(fichier.name)
}

function estHeic(fichier: File): boolean {
  const type = (fichier.type || '').toLowerCase()
  return type === 'image/heic' || type === 'image/heif' || /\.(heic|heif)$/i.test(fichier.name)
}

function chargerViaImg(fichier: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(fichier)
    const img = new Image()
    img.onload = () => {
      URL.revokeObjectURL(url)
      resolve(img)
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new ImageIndecodableError())
    }
    img.src = url
  })
}

function chargerImage(fichier: File): Promise<ImageBitmap | HTMLImageElement> {
  if (typeof createImageBitmap === 'function') {
    // L'orientation EXIF des photos de téléphone est respectée par défaut.
    return createImageBitmap(fichier).catch(() => chargerViaImg(fichier))
  }
  return chargerViaImg(fichier)
}

function libererSource(source: ImageBitmap | HTMLImageElement): void {
  const bitmap = source as ImageBitmap
  if (typeof bitmap.close === 'function') {
    bitmap.close()
  }
}

function canvasVersBlob(canvas: HTMLCanvasElement, qualite: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      blob => blob ? resolve(blob) : reject(new Error('Conversion de l’image impossible.')),
      'image/jpeg',
      qualite,
    )
  })
}

/**
 * Compresse et normalise une image en JPEG.
 *
 * Les PDF et GIF sont renvoyés tels quels (le GIF peut être animé ; le PDF
 * n'est pas une image). Si le fichier n'est pas une image, il est renvoyé
 * inchangé : l'appelant peut donc utiliser cette fonction sans distinguer les
 * formats.
 */
export async function compresserImage(
  fichier: File,
  options: OptionsCompressionImage = {},
): Promise<File> {
  if (!estImageNormalisable(fichier)) return fichier
  if (fichier.type === 'image/gif') return fichier

  const dimensionMax = options.dimensionMax ?? 2000
  const qualite = options.qualite ?? 0.85
  const tailleMaxOctets = options.tailleMaxOctets

  const source = await chargerImage(fichier)
  const largeur = source.width || (source as HTMLImageElement).naturalWidth
  const hauteur = source.height || (source as HTMLImageElement).naturalHeight
  if (!largeur || !hauteur) {
    libererSource(source)
    throw new ImageIndecodableError()
  }

  const ratio = Math.min(1, dimensionMax / Math.max(largeur, hauteur))
  const largeurCible = Math.max(1, Math.round(largeur * ratio))
  const hauteurCible = Math.max(1, Math.round(hauteur * ratio))

  const canvas = document.createElement('canvas')
  canvas.width = largeurCible
  canvas.height = hauteurCible
  const contexte = canvas.getContext('2d')
  if (!contexte) {
    libererSource(source)
    throw new Error('Canvas indisponible dans ce navigateur.')
  }

  // Fond blanc : évite un fond noir si l'image source a de la transparence.
  contexte.fillStyle = '#ffffff'
  contexte.fillRect(0, 0, largeurCible, hauteurCible)
  contexte.drawImage(source as CanvasImageSource, 0, 0, largeurCible, hauteurCible)
  libererSource(source)

  let blob = await canvasVersBlob(canvas, qualite)

  // Inutile de re-encoder une image déjà petite et déjà en JPEG/PNG/WebP.
  const formatDejaCompatible = ['image/jpeg', 'image/png', 'image/webp'].includes(fichier.type)
  if (
    formatDejaCompatible &&
    ratio === 1 &&
    blob.size >= fichier.size &&
    (!tailleMaxOctets || fichier.size <= tailleMaxOctets)
  ) {
    return fichier
  }

  if (tailleMaxOctets && blob.size > tailleMaxOctets) {
    for (const qualiteEssai of [0.75, 0.65, 0.55, 0.45]) {
      blob = await canvasVersBlob(canvas, qualiteEssai)
      if (blob.size <= tailleMaxOctets) break
    }
  }

  if (tailleMaxOctets && blob.size > tailleMaxOctets) {
    const message = estHeic(fichier)
      ? 'La photo HEIC reste trop volumineuse après conversion. Choisissez une photo JPG ou PNG moins lourde.'
      : undefined
    throw new ImageTropVolumineuseError(message)
  }

  const nom = fichier.name.replace(/\.[^.]+$/, '') + '.jpg'
  return new File([blob], nom, { type: 'image/jpeg', lastModified: Date.now() })
}
