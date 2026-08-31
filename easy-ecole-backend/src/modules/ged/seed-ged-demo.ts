import fs from 'fs'
import path from 'path'
import crypto from 'crypto'
import { DatabaseConnection } from '../../core/helpers/DatabaseConnection'

import Domain from './models/Domain'
import DocumentType from './models/DocumentType'
import Folder from './models/Folder'
import RolePermission from './models/RolePermission'
import { SessionGed } from './models/SessionGed'
import { DocumentGed } from './models/DocumentGed'
import { Utilisateur } from '../auth/models/Utilisateur'

if (process.env.ALLOW_DEV_SCRIPTS !== 'true') {
    console.error('Ce script de développement est désactivé en production.');
    process.exit(1);
}




function ensureDir(p: string) {
  if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true })
}

function makeTinyPdfBuffer(label: string): Buffer {
  // PDF minimaliste (pas un vrai document OCR, mais lisible par beaucoup d’outils)
  // Structure: 1 page, texte via un flux simple.
  const safe = label.replace(/\(/g, '[').replace(/\)/g, ']')
  const contentStream = `BT /F1 14 Tf 72 720 Td (${safe}) Tj ET`

  // Build PDF with offsets by simple template approach.
  // Note: ceci reste volontairement simple pour créer des fichiers de démo.
  const objects: string[] = []
  objects.push(`1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj`)
  objects.push(`2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj`)
  objects.push(`3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >> endobj`)
  objects.push(`4 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj`)
  objects.push(`5 0 obj << /Length ${contentStream.length} >> stream\n${contentStream}\nendstream endobj`)

  // Add xref
  const header = `%PDF-1.4\n%âãÏÓ\n`
  let pdf = header
  const offsets: number[] = [0]

  for (const obj of objects) {
    offsets.push(Buffer.byteLength(pdf, 'utf8'))
    pdf += obj + '\n'
  }

  const xrefStart = Buffer.byteLength(pdf, 'utf8')
  const size = objects.length + 1
  pdf += `xref\n0 ${size}\n`
  pdf += `0000000000 65535 f \n`

  for (let i = 1; i <= objects.length; i++) {
    const off = offsets[i] ?? 0
    pdf += `${String(off).padStart(10, '0')} 00000 n \n`
  }

  pdf += `trailer << /Size ${size} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF`
  return Buffer.from(pdf, 'utf8')
}

// Certains modèles peuvent être en schéma “non paranoïd” (pas de deletedAt), mais Sequelize les compte quand même avec deletedAt.
// Pour éviter un crash du seed, on fait un count robuste.
async function safeCount(model: any) {
  try {
    return await model.count()
  } catch {
    try {
      const sequelize = model.sequelize
      const tableName = model.getTableName()
      const [rows] = await sequelize.query(`SELECT COUNT(*) AS c FROM ${tableName}`)
      return Number((rows as any)?.[0]?.c ?? 0)
    } catch {
      return 0
    }
  }
}

async function ensureFolder(foldersSeededByAdminId: number) {
  const count = await safeCount(Folder)
  if (count > 0) return


  await Folder.bulkCreate([
    {
      nom: 'Documents administratifs (démo)',
      description: 'Registres et documents officiels (seed GED démo)',
      createdBy: foldersSeededByAdminId,
    },
    {
      nom: 'Archives (démo)',
      description: 'Archives des années précédentes (seed GED démo)',
      createdBy: foldersSeededByAdminId,
    },
  ])
}

async function ensureDomainsAndTypes() {
  // On s’appuie sur le seed.ts existant: si Domain/DocumentType existent déjà, ne rien refaire.
  if ((await safeCount(Domain)) === 0) {

    // fallback minimal: créer seulement les domaines principaux
    await Domain.bulkCreate([
      { code: 'SCOL', label: 'Scolarité' },
      { code: 'RH', label: 'Ressources Humaines' },
      { code: 'FIN', label: 'Finances' },
      { code: 'REC', label: 'Recherche' },
      { code: 'GOUV', label: 'Gouvernance' },
      { code: 'PAT', label: 'Patrimoine' },
      { code: 'EXT', label: 'Documents externes' },
    ])
  }

  if ((await safeCount(DocumentType)) === 0) {

    const domains = await Domain.findAll()
    const byCode: Record<string, number> = Object.fromEntries(domains.map((d: any) => [d.code, d.id]))

    await DocumentType.bulkCreate([
      {
        domainId: byCode['SCOL'],
        code: 'releve_notes',
        shortCode: 'REL',
        label: 'Relevé de notes',
        defaultConfidentiality: 'interne',
        duaDurationYears: 5,
      },
      {
        domainId: byCode['SCOL'],
        code: 'certificat_scolarite',
        shortCode: 'CERT',
        label: 'Certificat de scolarité',
        defaultConfidentiality: 'public',
        duaDurationYears: 5,
      },
      {
        domainId: byCode['FIN'],
        code: 'facture',
        shortCode: 'FACT',
        label: 'Facture',
        defaultConfidentiality: 'interne',
        duaDurationYears: 10,
      },
    ])
  }
}

async function ensureRolePermissions() {
  const count = await safeCount(RolePermission)

  if (count > 0) return

  const allRoles = [
    'apprenant',
    'institution',
    'admin',
    'enseignant',
    'ressources_humaines',
    'caissier_banque',
    'cabinet_comptable',
    'comite_orientation',
  ]

  const permissions: { confidentialityLevel: string; role: string }[] = []
  for (const role of allRoles) permissions.push({ confidentialityLevel: 'public', role })
  for (const role of allRoles.filter((r) => r !== 'apprenant')) permissions.push({ confidentialityLevel: 'interne', role })
  permissions.push({ confidentialityLevel: 'restreint', role: 'institution' })
  permissions.push({ confidentialityLevel: 'restreint', role: 'admin' })
  permissions.push({ confidentialityLevel: 'confidentiel', role: 'admin' })

  await RolePermission.bulkCreate(permissions)
}

async function seedSessionsAndDocuments() {
  const existingSessions = await safeCount(SessionGed)

  if (existingSessions > 0) return

  const domain = await Domain.findOne({ where: { code: 'SCOL' } }).catch(() => null)
  const docType = await DocumentType.findOne({ where: { shortCode: 'CERT' } }).catch(() => null)

  // prendre le premier folder (sans charger de champs inexistants dans l’ancien schéma)
  let anyFolder: any = null
  try {
    const foldersRows = await (Folder.sequelize as any).query(
      'SELECT id, nom, description, parentId, createdBy FROM ged_folders LIMIT 1',
      { type: (Folder.sequelize as any).QueryTypes?.SELECT }
    )
    anyFolder = (foldersRows as any)?.[0] ?? null
  } catch {
    // fallback si la requête brute échoue
    try {
      anyFolder = (await safeCount(Folder) >= 1 ? await Folder.findAll({ limit: 1 }) : []).at(0) ?? null
    } catch {
      anyFolder = null
    }
  }




  // pick some uploader user (admin id si possible)
  const adminUser = await Utilisateur.findOne({ where: { identifiant: 'admin' } }).catch(() => null)
  const uploaderId = adminUser?.id ?? 1

  const documentsRoot = 'public/ged'
  const pdfRoot = path.resolve(process.cwd(), documentsRoot, 'seed_demo')
  ensureDir(pdfRoot)

  const sessions: any[] = await SessionGed.bulkCreate([
    {
      nom: 'Session GED Démo 1',
      description: 'Seed session 1',
      folderId: anyFolder?.id ?? undefined,
      categorie: 'DEMO',
      fields: { niveau: 'Licence' } as any,
      participantIds: [1, 2, 3] as any,
      status: 'active',
      createdBy: uploaderId,
    },
    {
      nom: 'Session GED Démo 2',
      description: 'Seed session 2',
      folderId: anyFolder?.id ?? undefined,
      categorie: 'DEMO',
      fields: { niveau: 'Master' } as any,
      participantIds: [1, 2] as any,
      status: 'active',
      createdBy: uploaderId,
    },
  ])

  const pickSessions = await SessionGed.findAll({ order: [['createdAt', 'ASC']], limit: 2 })
  const [s1, s2] = pickSessions

  const createDoc = async (session: any, idx: number) => {
    const filename = `seed_${session.id}_${idx}_${crypto.randomBytes(3).toString('hex')}.pdf`
    const fileRel = `seed_demo/${filename}`
    const fileAbs = path.join(pdfRoot, filename)

    const pdfBuf = makeTinyPdfBuffer(`GED demo ${session.id} - ${idx}`)
    fs.writeFileSync(fileAbs, pdfBuf)

    const ref = `DEMO-${session.id}-${idx}`

    await DocumentGed.create({
      titre: `Document démo ${idx}`,
      reference: ref,
      eleve: undefined,
      parcours: undefined,
      categorie: 'DEMO',
      tags: `demo,session:${session.id}`,
      nommage: filename,
      type: 'PDF',
      statut: 'Disponible',
      fichier: fileRel,
      taille: `${(pdfBuf.length / 1024).toFixed(1)} Ko`,
      uploaderId: uploaderId,
      folderId: anyFolder?.id ?? undefined,
      sessionId: session.id,
      metadata: { source: 'seed_demo', idx } as any,
      dureeConservation: undefined,
      archivedUntil: undefined,
      isArchived: false,
      nbPages: 1,
      auteur: 'Seed GED',
      dateDocument: new Date(),
      contenuTexte: `Ceci est un document démo #${idx} pour tester le GED.`,
      classificationPath: `annee:2026/parcours:DEMO/niveau:DEMO`,
      sourceType: 'numerise_interne',
      externalIssuer: undefined,
      receptionDate: new Date(),
      confidentialityLevel: 'public',
      lifecycleStatus: 'courant',
      integrityHash: crypto.createHash('sha256').update(pdfBuf).digest('hex'),
      versionMajor: 1,
      versionMinor: 0,
      isCurrentVersion: true,
      isLocked: false,
      anneeAcademiqueId: undefined,
      parcoursId: undefined,
      niveauEtudeId: undefined,
    })
  }

  await createDoc(s1, 1)
  await createDoc(s1, 2)
  await createDoc(s2, 1)

  console.log('Seed GED démo: sessions + documents créés')
}

async function main() {
  const db = DatabaseConnection.getInstance()
  await db.init()

  const admin = await Utilisateur.findOne({ where: { identifiant: 'admin' } }).catch(() => null)
  const adminId = admin?.id ?? 1

  await ensureFolder(adminId)
  await ensureDomainsAndTypes()
  await ensureRolePermissions()
  await seedSessionsAndDocuments()
}

if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch((e) => {
      console.error(e)
      process.exit(1)
    })
}

