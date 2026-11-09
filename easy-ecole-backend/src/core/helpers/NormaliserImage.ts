import fs from "fs/promises"
import path from "path"
import { NextFunction, Request, Response } from "express"
import multer from "multer"
import sharp from "sharp"

type HeicConvert = (options: {
    buffer: Buffer | ArrayBuffer | Uint8Array
    format: "JPEG" | "PNG"
    quality?: number
}) => Promise<Buffer | Uint8Array>

const convert = require("heic-convert") as HeicConvert

const EXTENSIONS_HEIC = new Set([".heic", ".heif"])
const MIME_HEIC = new Set([
    "image/heic",
    "image/heif",
    "image/heic-sequence",
    "image/heif-sequence",
])
const EXTENSIONS_IMAGE = new Set([".jpg", ".jpeg", ".png", ".webp"])
const MIME_IMAGE = new Set(["image/jpeg", "image/jpg", "image/png", "image/webp"])

/** Un fichier JPEG déjà petit est conservé tel quel (pas de recompression inutile). */
const TAILLE_SANS_RECOMPRESSION = 2 * 1024 * 1024

export interface OptionsNormalisationImage {
    /** Dimension maximale (largeur ou hauteur), en pixels. */
    dimensionMax: number
    /** Qualité JPEG entre 1 et 100. */
    qualite?: number
    /** Taille maximale après normalisation, appliquée à chaque fichier. */
    tailleMaxOctets?: number
}

function extensionFichier(file: Express.Multer.File): string {
    return path.extname(file.originalname || file.filename || "").toLowerCase()
}

function estHeic(file: Express.Multer.File): boolean {
    const mime = (file.mimetype || "").toLowerCase()
    return EXTENSIONS_HEIC.has(extensionFichier(file)) || MIME_HEIC.has(mime)
}

function estImageNormalisable(file: Express.Multer.File): boolean {
    if (!file?.path) return false

    const ext = extensionFichier(file)
    const mime = (file.mimetype || "").toLowerCase()

    // PDF : jamais transformé. GIF : conservé pour ne pas perdre l'animation.
    if (ext === ".pdf" || mime === "application/pdf") return false
    if (ext === ".gif" || mime === "image/gif") return false

    return estHeic(file) || EXTENSIONS_IMAGE.has(ext) || MIME_IMAGE.has(mime)
}

/**
 * Convertit un HEIC en JPEG, redimensionne et recompresse les images trop
 * lourdes ou trop grandes. Le fichier d'origine est remplacé et les métadonnées
 * multer (`filename`, `path`, `mimetype`, `size`) sont mises à jour pour que
 * les contrôleurs existants continuent de fonctionner sans modification.
 *
 * Les PDF et GIF ne sont pas touchés. En cas d'échec sur un format déjà lisible
 * (JPEG/PNG/WebP), le fichier d'origine est conservé : la conversion ne doit pas
 * bloquer un téléversement valide.
 */
export async function normaliserFichierImage(
    file: Express.Multer.File,
    options: OptionsNormalisationImage,
): Promise<void> {
    if (!estImageNormalisable(file)) return

    const heic = estHeic(file)
    const source = await fs.readFile(file.path)
    const ext = extensionFichier(file)
    const mime = (file.mimetype || "").toLowerCase()
    const dejaJpeg = ext === ".jpg" || ext === ".jpeg" || mime === "image/jpeg"

    try {
        // 1. HEIC/HEIF → JPEG (libheif WASM, aucun binaire natif à installer).
        let contenu: Buffer = source
        if (heic) {
            contenu = Buffer.from(await convert({ buffer: source, format: "JPEG", quality: 90 }))
        }

        // 2. Décider si une transformation est réellement nécessaire.
        const metadata = await sharp(contenu, { failOn: "none" }).metadata()
        const dimensionSource = Math.max(metadata.width || 0, metadata.height || 0)
        const doitRedimensionner = dimensionSource > options.dimensionMax
        const doitRecompresser = source.length > TAILLE_SANS_RECOMPRESSION
        if (!heic && !doitRedimensionner && !doitRecompresser) {
            return
        }

        // 3. Redimensionnement dans une boîte max, rotation EXIF, JPEG.
        const sortie = await sharp(contenu, { failOn: "none" })
            .rotate()
            .resize({
                width: options.dimensionMax,
                height: options.dimensionMax,
                fit: "inside",
                withoutEnlargement: true,
            })
            .flatten({ background: "#ffffff" })
            .jpeg({ quality: options.qualite ?? 88, mozjpeg: true })
            .toBuffer()

        // Un JPEG déjà dans les limites et plus petit que sa version recompressée
        // est conservé : cela évite une perte de qualité sans gain de taille.
        if (!heic && dejaJpeg && !doitRedimensionner && sortie.length >= source.length) {
            return
        }

        // 4. Remplacer le fichier d'origine par le JPEG normalisé.
        const base = path.basename(file.filename, path.extname(file.filename))
        const nouveauNom = `${base}.jpg`
        const nouveauPath = path.join(path.dirname(file.path), nouveauNom)
        await fs.writeFile(nouveauPath, sortie)

        if (path.resolve(nouveauPath) !== path.resolve(file.path)) {
            await fs.unlink(file.path).catch(() => undefined)
        }

        const baseOriginal = file.originalname
            ? path.basename(file.originalname, path.extname(file.originalname))
            : base

        file.filename = nouveauNom
        file.path = nouveauPath
        file.mimetype = "image/jpeg"
        file.originalname = `${baseOriginal}.jpg`
        file.size = sortie.length
    } catch (error) {
        if (heic) {
            // Un HEIC non converti ne doit pas être stocké : les navigateurs et
            // les générateurs de documents ne sauraient pas l'afficher.
            await fs.unlink(file.path).catch(() => undefined)
            throw new multer.MulterError(
                "LIMIT_UNEXPECTED_FILE",
                "La photo HEIC n'a pas pu être convertie. Choisissez un fichier JPG ou PNG.",
            )
        }
        // Format déjà lisible : on garde l'original plutôt que de bloquer.
        console.warn("[NormaliserImage] Recompression ignorée :", file.filename, error)
    }
}

/**
 * Middleware Express à placer juste après `multer`. Gère `req.file`,
 * `req.files` (tableau) et `req.files` (objet de champs multer).
 */
export function normaliserImages(options: OptionsNormalisationImage) {
    return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
        try {
            const fichiers: Express.Multer.File[] = []
            const single = (req as any).file as Express.Multer.File | undefined
            if (single) fichiers.push(single)

            const files = (req as any).files
            if (Array.isArray(files)) {
                fichiers.push(...(files as Express.Multer.File[]))
            } else if (files && typeof files === "object") {
                for (const liste of Object.values(files)) {
                    if (Array.isArray(liste)) {
                        fichiers.push(...(liste as Express.Multer.File[]))
                    }
                }
            }

            for (const fichier of fichiers) {
                await normaliserFichierImage(fichier, options)
            }
            if (options.tailleMaxOctets) {
                for (const fichier of fichiers) {
                    if (fichier.size > options.tailleMaxOctets) {
                        await fs.unlink(fichier.path).catch(() => undefined)
                        throw new multer.MulterError("LIMIT_FILE_SIZE")
                    }
                }
            }
            next()
        } catch (error) {
            next(error)
        }
    }
}
