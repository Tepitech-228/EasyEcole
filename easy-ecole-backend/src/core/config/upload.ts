import multer from "multer"
import path from "path"

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
const ALLOWED_DOCUMENT_TYPES = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'image/jpeg', 'image/png', 'image/gif']
const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/ogg', 'application/pdf', 'image/jpeg', 'image/png']

function fileFilter(allowedTypes: string[]) {
  return (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true)
    } else {
      cb(new Error(`Type de fichier non autorisé: ${file.mimetype}`))
    }
  }
}

export const imageUpload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'public/uploads/images/'),
    filename: (req, file, cb) => cb(null, Date.now() + '-' + Math.round(Math.random() * 1E9) + path.extname(file.originalname))
  }),
  fileFilter: fileFilter(ALLOWED_IMAGE_TYPES),
  limits: { fileSize: 5 * 1024 * 1024 }
})

export const documentUpload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'public/uploads/documents/'),
    filename: (req, file, cb) => cb(null, Date.now() + '-' + Math.round(Math.random() * 1E9) + path.extname(file.originalname))
  }),
  fileFilter: fileFilter(ALLOWED_DOCUMENT_TYPES),
  limits: { fileSize: 20 * 1024 * 1024 }
})

export const videoUpload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'public/uploads/videos/'),
    filename: (req, file, cb) => cb(null, Date.now() + '-' + Math.round(Math.random() * 1E9) + path.extname(file.originalname))
  }),
  fileFilter: fileFilter(ALLOWED_VIDEO_TYPES),
  limits: { fileSize: 200 * 1024 * 1024 }
})
