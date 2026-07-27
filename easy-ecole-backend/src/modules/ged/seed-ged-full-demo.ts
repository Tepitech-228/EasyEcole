import fs from 'fs'
import path from 'path'
import crypto from 'crypto'
import bcrypt from 'bcrypt'
import { DatabaseConnection } from "../../core/helpers/DatabaseConnection"
import { QueryTypes } from "sequelize"
import Domain from './models/Domain'
import DocumentType from './models/DocumentType'
import Folder from './models/Folder'
import { SessionGed } from './models/SessionGed'
import { DocumentGed } from './models/DocumentGed'
import { RegistreCourrier } from './models/RegistreCourrier'
import { ProcessusGenerateur } from './models/ProcessusGenerateur'
import RolePermission from './models/RolePermission'

function ensureDir(p: string) { if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true }) }

function makeTinyPdfBuffer(label: string): Buffer {
  const safe = label.replace(/\(/g, '[').replace(/\)/g, ']')
  const contentStream = `BT /F1 14 Tf 72 720 Td (${safe}) Tj ET`
  const objects: string[] = []
  objects.push(`1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj`)
  objects.push(`2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj`)
  objects.push(`3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >> endobj`)
  objects.push(`4 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj`)
  objects.push(`5 0 obj << /Length ${contentStream.length} >> stream\n${contentStream}\nendstream endobj`)
  const header = `%PDF-1.4\n%âãÏÓ\n`
  let pdf = header
  const offsets: number[] = [0]
  for (const obj of objects) { offsets.push(Buffer.byteLength(pdf, 'utf8')); pdf += obj + '\n' }
  const xrefStart = Buffer.byteLength(pdf, 'utf8')
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`
  for (let i = 1; i <= objects.length; i++) pdf += `${String(offsets[i] ?? 0).padStart(10, '0')} 00000 n \n`
  pdf += `trailer << /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF`
  return Buffer.from(pdf, 'utf8')
}

const NOMS = ['Koffi','Ama','Yawo','Kossi','Afua','Mensah','Adjoa','Kodjo','Akua','Komla','Mawuli','Dovi','Esi','Atsu','Sena','Amen','Yawa','Nane','Da','Dogbo']
const PRENOMS_M = ['Jean','Pierre','Paul','Jacques','Marc','Michel','Alexandre','David','Emmanuel','Gabriel','Daniel','Nathan','Samuel','Joseph','Noah']
const PRENOMS_F = ['Marie','Jeanne','Julie','Anne','Sophie','Claire','Alice','Sarah','Emma','Laura','Chloe','Ines','Lea','Manon','Camille']
const VILLES = ['Lomé','Kara','Atakpamé','Sokodé','Tsévié','Aného','Dapaong','Kpalimé','Mango','Bassar']

async function safeCount(sequelize: any, table: string): Promise<number> {
  try { const [r] = await sequelize.query(`SELECT COUNT(*) as n FROM ${table}`); return Number(r[0]?.n ?? 0) } catch { return 0 }
}

async function getExistingIds(sequelize: any, table: string, field = 'id'): Promise<number[]> {
  try { const [r] = await sequelize.query(`SELECT ${field} as id FROM ${table}`); return r.map((x: any) => x.id) } catch { return [] }
}

async function getMap(sequelize: any, table: string, keyField: string, valField: string): Promise<Record<string, any>> {
  try {
    const [rows] = await sequelize.query(`SELECT ${keyField} as k, ${valField} as v FROM ${table}`)
    const m: Record<string, any> = {}
    for (const r of rows as any[]) m[r.k] = r.v
    return m
  } catch { return {} }
}

async function getClassInfo(sequelize: any): Promise<any[]> {
  try {
    const [rows] = await sequelize.query(`SELECT c.id as classeId, c.libelle as classeLibelle, c.niveauEtudeId as niveauEtudeId, n.libelle as niveauLibelle, p.id as parcoursId, p.titre as parcoursTitre FROM ins_classes c LEFT JOIN ins_niveaux_etudes n ON c.niveauEtudeId = n.id LEFT JOIN ins_parcours p ON p.id = (SELECT pc.id FROM ins_parcours pc WHERE pc.niveauEtudeId = c.niveauEtudeId LIMIT 1) ORDER BY c.id`)
    return rows as any[]
  } catch { return [] }
}

async function createDoctoratLevels(sequelize: any) {
  const niveaux = ['Doctorat 1', 'Doctorat 2', 'Doctorat 3']
  const parcours = ['Sciences Doctorat', 'Lettres Doctorat', 'Droit Doctorat']
  
  const createdIds: { niveauId: number; parcoursId: number; classeId: number }[] = []
  
  for (let i = 0; i < niveaux.length; i++) {
    const [niv] = await sequelize.query(`SELECT id FROM ins_niveaux_etudes WHERE libelle = ?`, { replacements: [niveaux[i]] })
    let niveauId: number
    if ((niv as any[]).length > 0) {
      niveauId = (niv as any[])[0].id
    } else {
      await sequelize.query(`INSERT INTO ins_niveaux_etudes (libelle, createdAt, updatedAt) VALUES (?, NOW(), NOW())`, { replacements: [niveaux[i]] })
      const [nn] = await sequelize.query(`SELECT id FROM ins_niveaux_etudes WHERE libelle = ?`, { replacements: [niveaux[i]] })
      niveauId = (nn as any[])[0].id
    }
    
    for (const parc of parcours) {
      const [pa] = await sequelize.query(`SELECT id FROM ins_parcours WHERE titre = ?`, { replacements: [parc] })
      let parcoursId: number
      if ((pa as any[]).length > 0) {
        parcoursId = (pa as any[])[0].id
      } else {
        await sequelize.query(`INSERT INTO ins_parcours (titre, niveauEtudeId, createdAt, updatedAt) VALUES (?, ?, NOW(), NOW())`, { replacements: [parc, niveauId] })
        const [pn] = await sequelize.query(`SELECT id FROM ins_parcours WHERE titre = ?`, { replacements: [parc] })
        parcoursId = (pn as any[])[0].id
      }
      
      const prefix = parc === 'Sciences Doctorat' ? 'SDC' : parc === 'Lettres Doctorat' ? 'LET' : 'DRO'
      const classLibelle = `${prefix}-DOC${i+1}`
      const [cl] = await sequelize.query(`SELECT id FROM ins_classes WHERE libelle = ?`, { replacements: [classLibelle] })
      let classeId: number
      if ((cl as any[]).length > 0) {
        classeId = (cl as any[])[0].id
      } else {
        await sequelize.query(`INSERT INTO ins_classes (libelle, niveauEtudeId, createdAt, updatedAt) VALUES (?, ?, NOW(), NOW())`, { replacements: [classLibelle, niveauId] })
        const [cn] = await sequelize.query(`SELECT id FROM ins_classes WHERE libelle = ?`, { replacements: [classLibelle] })
        classeId = (cn as any[])[0].id
      }
      createdIds.push({ niveauId, parcoursId, classeId })
    }
  }
  console.log(`Doctorat: ${niveaux.length} niveaux, ${parcours.length} parcours, ${createdIds.length} classes`)
  return createdIds
}

async function generateStudents(sequelize: any, classes: any[], studentsPerClass: number) {
  const password = await bcrypt.hash('123456', 10)
  const existingIds = new Set(await getExistingIds(sequelize, 'aut_utilisateurs'))
  const existingMatricules = new Set<string>()
  try { const [m] = await sequelize.query('SELECT matricule FROM ins_dossiers_etudiants'); (m as any[]).forEach((r: any) => existingMatricules.add(r.matricule)) } catch {}
  
  // Ensure academic session exists for 2025-2026
  const [insSessions] = await sequelize.query('SELECT id FROM ins_sessions WHERE anneeAcademiqueId = 2 LIMIT 1') as any[]
  let sessionId: number
  if (insSessions.length > 0) {
    sessionId = insSessions[0].id
  } else {
    await sequelize.query('INSERT INTO ins_sessions (dateDebut, dateFin, niveauEtudeId, anneeAcademiqueId, createdAt, updatedAt) VALUES (?, ?, 1, 2, NOW(), NOW())',
      { replacements: [new Date('2025-10-01'), new Date('2026-07-31')] })
    const [ns] = await sequelize.query('SELECT LAST_INSERT_ID() as id')
    sessionId = (ns as any[])[0].id
  }
  
  let userIdCounter = Math.max(...existingIds, 100)
  let studentCount = 0
  const anneeId = 2  // 2025-2026
  
  const lastMatricule = Math.max(0, ...Array.from(existingMatricules).map(m => {
    const n = parseInt(m.replace(/[^0-9]/g, ''))
    return isNaN(n) ? 0 : n
  }))
  let matCounter = lastMatricule
  
  for (const cls of classes) {
    const classeId = cls.classeId
    const niveauEtudeId = cls.niveauEtudeId
    let parcoursId = cls.parcoursId
    
    if (!parcoursId) {
      const [pc] = await sequelize.query('SELECT id FROM ins_parcours WHERE niveauEtudeId = ? LIMIT 1', { replacements: [niveauEtudeId] })
      parcoursId = (pc as any[])[0]?.id
    }
    if (!parcoursId) continue
    
    for (let s = 0; s < studentsPerClass; s++) {
      userIdCounter++
      const nom = NOMS[Math.floor(Math.random() * NOMS.length)]
      const isF = Math.random() > 0.5
      const prenom = isF ? PRENOMS_F[Math.floor(Math.random() * PRENOMS_F.length)] : PRENOMS_M[Math.floor(Math.random() * PRENOMS_M.length)]
      const identifiant = `${nom.toLowerCase()}.${prenom.toLowerCase()}.${userIdCounter}`
      const email = `${identifiant}@etudiant.ust.tg`
      const ville = VILLES[Math.floor(Math.random() * VILLES.length)]
      matCounter++
      const matricule = `UST${String(2026).slice(2)}${String(matCounter).padStart(5, '0')}`
      const naissance = new Date(2000 + Math.floor(Math.random() * 6), Math.floor(Math.random() * 12), 1 + Math.floor(Math.random() * 28))
      
      try {
        await sequelize.query(
          `INSERT INTO aut_utilisateurs (id, nom, prenoms, identifiant, email, motDePasse, role, contact, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, 'apprenant', ?, NOW(), NOW())`,
          { replacements: [userIdCounter, nom, prenom, identifiant, email, password, `+228${90000000 + userIdCounter}`] }
        )
        await sequelize.query(
          `INSERT INTO aut_apprenants (utilisateurId, dateNaissance, lieuNaissance, createdAt, updatedAt) VALUES (?, ?, ?, NOW(), NOW())`,
          { replacements: [userIdCounter, naissance, ville] }
        )
        await sequelize.query(
          `INSERT INTO ins_demandes_inscription (matricule, dateDemande, sessionId, utilisateurId, createdAt, updatedAt) VALUES (?, NOW(), ?, ?, NOW(), NOW())`,
          { replacements: [matricule, sessionId, userIdCounter] }
        )
        const [di] = await sequelize.query('SELECT LAST_INSERT_ID() as id')
        const demandeId = (di as any[])[0]?.id
        
        const fraisBase = 500000 + Math.floor(Math.random() * 2000000)
        await sequelize.query(
          `INSERT INTO ins_dossiers_etudiants (matricule, statut, dateCreation, fraisScolarite, modePaiement, nbMensualites, demarrageParcours, utilisateurId, createdAt, updatedAt) VALUES (?, 'actif', CURDATE(), ?, 'mensuel', 10, CONCAT(YEAR(CURDATE()), '-10-01'), ?, NOW(), NOW())`,
          { replacements: [matricule, fraisBase, userIdCounter] }
        )
        await sequelize.query(
          `INSERT INTO ins_parcours_choisis (etatDeValidation, choixFinal, parcoursId, demandeInscriptionId, createdAt, updatedAt) VALUES ('valide', 1, ?, ?, NOW(), NOW())`,
          { replacements: [parcoursId, demandeId] }
        )
        await sequelize.query(
          `INSERT INTO ins_cursus_apprenants (utilisateurId, parcoursId, niveauEtudeId, classeId, anneeAcademiqueId, demandeInscriptionId, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())`,
          { replacements: [userIdCounter, parcoursId, niveauEtudeId, classeId, anneeId, demandeId] }
        )
        studentCount++
      } catch (e: any) {
        // If duplicate entry, skip silently
        if (e.code === 'ER_DUP_ENTRY') continue
        console.error(`  Error ${identifiant}: ${e.message.substring(0, 60)}`)
      }
    }
  }
  return studentCount
}

async function generateGedDocuments(sequelize: any, classes: any[]) {
  const existingDocs = await safeCount(sequelize, 'ged_documents')
  if (existingDocs > 50) { console.log(`GED: ${existingDocs} documents existants, skip`); return }
  
  const pdfRoot = path.resolve(process.cwd(), 'public/ged', 'seed_full')
  ensureDir(pdfRoot)
  
  const domains = await Domain.findAll()
  const dByCode = Object.fromEntries(domains.map(d => [d.code, d.id]))
  const types = await DocumentType.findAll()
  const tByCode = Object.fromEntries(types.map(t => [t.code, t.id]))
  const processus = await ProcessusGenerateur.findAll()
  const pByCode = Object.fromEntries(processus.map(p => [p.code, p.id]))
  
  const [students] = await sequelize.query(`
    SELECT ca.utilisateurId as uid, ca.classeId, ca.niveauEtudeId, ca.parcoursId, ca.anneeAcademiqueId,
           u.nom, u.prenoms, c.libelle as classeLibelle, n.libelle as niveauLibelle
    FROM ins_cursus_apprenants ca
    JOIN aut_utilisateurs u ON ca.utilisateurId = u.id
    JOIN ins_classes c ON ca.classeId = c.id
    JOIN ins_niveaux_etudes n ON ca.niveauEtudeId = n.id
  `) as any[]
  
  console.log(`Génération documents pour ${students.length} étudiants...`)
  
  const folders = await Folder.findAll()
  const folderIds = folders.map(f => f.id)
  const anneeId = 2
  
  // Doc types by code
  const scolariteTypes = ['releve_notes', 'certificat_scolarite', 'fiche_inscription', 'bulletin']
  const finTypes = ['quitus', 'facture']
  const extTypes = ['document_entrant']
  const gouvernanceTypes = ['deliberation', 'reglement_interieur']
  const rechercheTypes = ['publication', 'rapport_recherche']
  const rhTypes = ['bulletin_paie', 'contrat_travail', 'attestation_travail', 'pointage']
  const patTypes = ['inventaire', 'bon_commande']
  
  let docCount = 0
  const lifecycleOptions = ['courant', 'courant', 'courant', 'intermediaire', 'definitif']
  const confOptions = ['public', 'interne', 'interne', 'restreint']
  const sourceOptions = ['numerise_interne', 'genere_application', 'recu_externe']
  
  function pick<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)] }
  
  // Per-student documents
  for (const s of students) {
    const dateBase = new Date(2025, 9, 1)
    dateBase.setDate(dateBase.getDate() + Math.floor(Math.random() * 200))
    
    // SCOL documents
    for (const typeCode of scolariteTypes) {
      const docType = tByCode[typeCode]
      if (!docType) continue
      const ref = `SCOL-${s.classeLibelle}-${typeCode}-${s.uid}`
      const label = `${s.nom} ${s.prenoms} - ${typeCode}`
      const filename = `doc_scol_${docCount}.pdf`
      const pdfBuf = makeTinyPdfBuffer(label)
      fs.writeFileSync(path.join(pdfRoot, filename), pdfBuf)
      
      await DocumentGed.create({
        titre: `${typeCode.replace('_', ' ')} - ${s.nom} ${s.prenoms}`,
        reference: ref,
        categorie: 'SCOL',
        tags: `${s.classeLibelle},${s.niveauLibelle}`,
        type: 'application/pdf',
        statut: 'Disponible',
        fichier: `seed_full/${filename}`,
        taille: `${(pdfBuf.length / 1024).toFixed(1)} Ko`,
        uploaderId: 1,
        folderId: pick(folderIds) ?? undefined,
        nbPages: 1 + Math.floor(Math.random() * 4),
        auteur: 'Service Scolarité',
        dateDocument: dateBase,
        sourceType: pick(sourceOptions) as any,
        confidentialityLevel: pick(confOptions),
        lifecycleStatus: pick(lifecycleOptions),
        domainId: dByCode['SCOL'],
        documentTypeId: docType,
        anneeAcademiqueId: anneeId,
        niveauEtudeId: s.niveauEtudeId,
        parcoursId: s.parcoursId,
        classeId: s.classeId,
        isCurrentVersion: true,
        classificationPath: `SCOL/${s.niveauLibelle}/${s.parcoursId}/${s.classeLibelle}`,
        integrityHash: crypto.createHash('sha256').update(pdfBuf).digest('hex'),
      } as any)
      docCount++
    }
    
    // FIN documents
    for (const typeCode of finTypes) {
      const docType = tByCode[typeCode]
      if (!docType) continue
      const filename = `doc_fin_${docCount}.pdf`
      const pdfBuf = makeTinyPdfBuffer(`FIN ${s.nom} ${s.prenoms}`)
      fs.writeFileSync(path.join(pdfRoot, filename), pdfBuf)
      
      await DocumentGed.create({
        titre: `${typeCode} - ${s.nom} ${s.prenoms}`,
        reference: `FIN-${s.uid}-${typeCode}`,
        categorie: 'FIN',
        tags: `${s.classeLibelle},finances`,
        type: 'application/pdf',
        statut: 'Disponible',
        fichier: `seed_full/${filename}`,
        taille: `${(pdfBuf.length / 1024).toFixed(1)} Ko`,
        uploaderId: 1,
        folderId: pick(folderIds) ?? undefined,
        nbPages: 1,
        auteur: 'Service Financier',
        dateDocument: dateBase,
        sourceType: pick(sourceOptions) as any,
        confidentialityLevel: 'interne',
        lifecycleStatus: pick(lifecycleOptions),
        domainId: dByCode['FIN'],
        documentTypeId: docType,
        anneeAcademiqueId: anneeId,
        isCurrentVersion: true,
        classificationPath: `FIN/${s.niveauLibelle}`,
        integrityHash: crypto.createHash('sha256').update(pdfBuf).digest('hex'),
      } as any)
      docCount++
    }
    
    // EXT document
    const extType = tByCode[extTypes[0]]
    if (extType) {
      const filename = `doc_ext_${docCount}.pdf`
      const pdfBuf = makeTinyPdfBuffer(`EXT ${s.nom}`)
      fs.writeFileSync(path.join(pdfRoot, filename), pdfBuf)
      
      await DocumentGed.create({
        titre: `Dossier admission - ${s.nom} ${s.prenoms}`,
        reference: `EXT-ADM-${s.uid}`,
        categorie: 'EXT',
        tags: `admission,${s.classeLibelle}`,
        type: 'application/pdf',
        statut: 'Disponible',
        fichier: `seed_full/${filename}`,
        taille: `${(pdfBuf.length / 1024).toFixed(1)} Ko`,
        uploaderId: 1,
        folderId: pick(folderIds) ?? undefined,
        nbPages: 2,
        auteur: "Bureau d'admission",
        dateDocument: dateBase,
        sourceType: 'recu_externe' as any,
        externalIssuer: `Campus France`,
        confidentialityLevel: 'interne',
        lifecycleStatus: 'definitif',
        domainId: dByCode['EXT'],
        documentTypeId: extType,
        anneeAcademiqueId: anneeId,
        isCurrentVersion: true,
        classificationPath: `EXT/entrant`,
        integrityHash: crypto.createHash('sha256').update(pdfBuf).digest('hex'),
      } as any)
      docCount++
    }
    
    if (docCount % 100 === 0) process.stdout.write(`Documents: ${docCount}\r`)
  }
  
  // Per-class documents (GOUV)
  for (const cls of classes) {
    const delibType = tByCode['deliberation']
    if (delibType) {
      const filename = `doc_gouv_${docCount}.pdf`
      const pdfBuf = makeTinyPdfBuffer(`Délibération ${cls.classeLibelle}`)
      fs.writeFileSync(path.join(pdfRoot, filename), pdfBuf)
      
      await DocumentGed.create({
        titre: `Délibération - ${cls.classeLibelle}`,
        reference: `GOUV-DELIB-${cls.classeId}`,
        categorie: 'GOUV',
        tags: `deliberation,${cls.classeLibelle}`,
        type: 'application/pdf',
        statut: 'Disponible',
        fichier: `seed_full/${filename}`,
        taille: `${(pdfBuf.length / 1024).toFixed(1)} Ko`,
        uploaderId: 1,
        folderId: pick(folderIds) ?? undefined,
        nbPages: 3 + Math.floor(Math.random() * 5),
        auteur: 'Conseil de classe',
        dateDocument: new Date(2026, 4, 15),
        sourceType: 'numerise_interne' as any,
        confidentialityLevel: 'restreint',
        lifecycleStatus: 'definitif',
        domainId: dByCode['GOUV'],
        documentTypeId: delibType,
        anneeAcademiqueId: anneeId,
        niveauEtudeId: cls.niveauEtudeId,
        classificationPath: `GOUV/${cls.classeLibelle}`,
        integrityHash: crypto.createHash('sha256').update(pdfBuf).digest('hex'),
      } as any)
      docCount++
    }
    
    if (docCount % 50 === 0) process.stdout.write(`Documents: ${docCount}\r`)
  }
  
  // Per-parcours documents (REC)
  const parcoursIds = [...new Set(classes.map((c: any) => c.parcoursId).filter(Boolean))]
  for (const pid of parcoursIds) {
    for (const typeCode of rechercheTypes) {
      const docType = tByCode[typeCode]
      if (!docType) continue
      const filename = `doc_rec_${docCount}.pdf`
      const pdfBuf = makeTinyPdfBuffer(`Recherche ${pid}`)
      fs.writeFileSync(path.join(pdfRoot, filename), pdfBuf)
      
      await DocumentGed.create({
        titre: `${typeCode} - Parcours #${pid}`,
        reference: `REC-${pid}-${typeCode}`,
        categorie: 'REC',
        tags: `recherche,parcours${pid}`,
        type: 'application/pdf',
        statut: 'Disponible',
        fichier: `seed_full/${filename}`,
        taille: `${(pdfBuf.length / 1024).toFixed(1)} Ko`,
        uploaderId: 1,
        nbPages: 5 + Math.floor(Math.random() * 15),
        auteur: 'Chercheur',
        dateDocument: new Date(2026, 2, 1),
        sourceType: 'numerise_interne' as any,
        confidentialityLevel: 'public',
        lifecycleStatus: 'courant',
        domainId: dByCode['REC'],
        documentTypeId: docType,
        classificationPath: `REC/parcours${pid}`,
        integrityHash: crypto.createHash('sha256').update(pdfBuf).digest('hex'),
      } as any)
      docCount++
    }
  }
  
  // RH documents per departement
  const [departements] = await sequelize.query('SELECT id, nom FROM rh_departements') as any[]
  for (const dep of departements) {
    for (const typeCode of rhTypes) {
      const docType = tByCode[typeCode]
      if (!docType) continue
      const filename = `doc_rh_${docCount}.pdf`
      const pdfBuf = makeTinyPdfBuffer(`RH ${dep.nom}`)
      fs.writeFileSync(path.join(pdfRoot, filename), pdfBuf)
      
      await DocumentGed.create({
        titre: `${typeCode} - ${dep.nom}`,
        reference: `RH-${dep.id}-${typeCode}`,
        categorie: 'RH',
        tags: `rh,${dep.nom}`,
        type: 'application/pdf',
        statut: 'Disponible',
        fichier: `seed_full/${filename}`,
        taille: `${(pdfBuf.length / 1024).toFixed(1)} Ko`,
        uploaderId: 1,
        nbPages: 1 + Math.floor(Math.random() * 3),
        auteur: 'Service RH',
        dateDocument: new Date(2026, 6, 1),
        sourceType: 'genere_application' as any,
        confidentialityLevel: 'confidentiel',
        lifecycleStatus: pick(lifecycleOptions),
        domainId: dByCode['RH'],
        documentTypeId: docType,
        processusGenerateurId: typeCode === 'bulletin_paie' ? pByCode['PAIE'] : typeCode === 'pointage' ? pByCode['POINTAGE'] : typeCode === 'contrat_travail' ? pByCode['CONTRAT_ENSEIGNANT'] : undefined,
        classificationPath: `RH/${dep.nom}`,
        integrityHash: crypto.createHash('sha256').update(pdfBuf).digest('hex'),
      } as any)
      docCount++
    }
  }
  
  // PAT documents  
  const [fournisseurs] = await sequelize.query('SELECT id FROM ach_fournisseurs LIMIT 10') as any[]
  for (const four of fournisseurs) {
    for (const typeCode of patTypes) {
      const docType = tByCode[typeCode]
      if (!docType) continue
      const filename = `doc_pat_${docCount}.pdf`
      const pdfBuf = makeTinyPdfBuffer(`PAT ${four.id}`)
      fs.writeFileSync(path.join(pdfRoot, filename), pdfBuf)
      
      await DocumentGed.create({
        titre: `${typeCode} - Fournisseur #${four.id}`,
        reference: `PAT-${four.id}-${typeCode}`,
        categorie: 'PAT',
        tags: `patrimoine,fournisseur${four.id}`,
        type: 'application/pdf',
        statut: 'Disponible',
        fichier: `seed_full/${filename}`,
        taille: `${(pdfBuf.length / 1024).toFixed(1)} Ko`,
        uploaderId: 1,
        nbPages: 2,
        auteur: 'Service logistique',
        dateDocument: new Date(2026, 5, 1),
        sourceType: 'numerise_interne' as any,
        confidentialityLevel: 'interne',
        lifecycleStatus: 'courant',
        domainId: dByCode['PAT'],
        documentTypeId: docType,
        classificationPath: `PAT/fournisseur${four.id}`,
        integrityHash: crypto.createHash('sha256').update(pdfBuf).digest('hex'),
      } as any)
      docCount++
    }
  }
  
  console.log(`\nTotal documents GED créés: ${docCount}`)
}

async function seedSessions(sequelize: any) {
  const existing = await safeCount(sequelize, 'ged_sessions')
  if (existing > 0) return
  
  const [annee] = await sequelize.query('SELECT id FROM ins_annees_academiques WHERE id = 2') as any[]
  if (annee.length === 0) return
  
  await SessionGed.bulkCreate([
    { nom: 'Année 2025-2026 - Documents scolaires', description: 'Tous les documents de l\'année académique 2025-2026', fields: JSON.stringify({ annee: '2025-2026' }) as any, status: 'active', createdBy: 1 },
    { nom: 'Commission pédagogique 2026', description: 'PV des conseils de classe', fields: JSON.stringify({ type: 'commission' }) as any, status: 'active', createdBy: 1 },
    { nom: 'Admissions 2026', description: 'Dossiers d\'admission des nouveaux étudiants', fields: JSON.stringify({ type: 'admission' }) as any, status: 'active', createdBy: 1 },
  ])
}

async function seedCourrier(sequelize: any) {
  const existing = await safeCount(sequelize, 'ged_registre_courrier')
  if (existing > 0) return
  
  const [firstDoc] = await sequelize.query('SELECT id FROM ged_documents LIMIT 1') as any[]
  const docId = firstDoc[0]?.id ?? null
  
  await sequelize.query(
    `INSERT INTO ged_registre_courrier (sens, numeroOrdre, annee, expediteur, destinataire, objet, modeEnvoi, documentId, utilisateurId, createdAt, updatedAt) VALUES 
    ('entrant', 1, 2026, 'Ministère ENS', NULL, 'Octroi subvention 2026', 'courrier', ?, 1, NOW(), NOW()),
    ('entrant', 2, 2026, 'Rectorat', NULL, 'Directive réforme LMD', 'email', NULL, 1, NOW(), NOW()),
    ('sortant', 1, 2026, NULL, 'Ministère ENS', 'Accusé reception subvention', 'courrier', NULL, 1, NOW(), NOW()),
    ('entrant', 3, 2026, 'Conseil Régional', NULL, 'Attribution bourse 2026-2027', 'email', NULL, 1, NOW(), NOW()),
    ('sortant', 2, 2026, NULL, 'Rectorat', "Demande d'habilitation formation", 'remise_main_propre', NULL, 1, NOW(), NOW())`,
    { replacements: [docId] }
  )
}

async function seedDomainsIfEmpty(): Promise<void> {
  const count = await Domain.count()
  if (count > 0) { console.log(`Domaines: ${count} existants`); return }
  await Domain.bulkCreate([
    { code: 'SCOL', label: 'Scolarité' },
    { code: 'RH', label: 'Ressources Humaines' },
    { code: 'FIN', label: 'Finances' },
    { code: 'REC', label: 'Recherche' },
    { code: 'GOUV', label: 'Gouvernance' },
    { code: 'PAT', label: 'Patrimoine' },
    { code: 'EXT', label: 'Documents externes' },
  ])
  console.log('7 Domaines GED créés')
}

async function seedDocumentTypesIfEmpty(): Promise<void> {
  const count = await DocumentType.count()
  if (count > 0) { console.log(`Types documentaires: ${count} existants`); return }
  const domains = await Domain.findAll()
  const byCode = Object.fromEntries(domains.map(d => [d.code, d.id]))
  await DocumentType.bulkCreate([
    { domainId: byCode['SCOL'], code: 'releve_notes', shortCode: 'REL', label: 'Relevé de notes', defaultConfidentiality: 'interne', duaDurationYears: 5 },
    { domainId: byCode['SCOL'], code: 'diplome', shortCode: 'DIPL', label: 'Diplôme', defaultConfidentiality: 'confidentiel', isPermanent: true },
    { domainId: byCode['SCOL'], code: 'pv_jury', shortCode: 'PV', label: 'Procès-verbal de jury', defaultConfidentiality: 'restreint', isPermanent: true },
    { domainId: byCode['SCOL'], code: 'fiche_inscription', shortCode: 'FINS', label: "Fiche d'inscription", defaultConfidentiality: 'confidentiel', duaDurationYears: 10 },
    { domainId: byCode['SCOL'], code: 'certificat_scolarite', shortCode: 'CERT', label: 'Certificat de scolarité', defaultConfidentiality: 'public', duaDurationYears: 5 },
    { domainId: byCode['SCOL'], code: 'attestation_reussite', shortCode: 'AR', label: 'Attestation de réussite', defaultConfidentiality: 'public', isPermanent: true },
    { domainId: byCode['SCOL'], code: 'convention_stage', shortCode: 'CONV', label: 'Convention de stage', defaultConfidentiality: 'interne', duaDurationYears: 10 },
    { domainId: byCode['SCOL'], code: 'bulletin', shortCode: 'BULL', label: 'Bulletin de notes', defaultConfidentiality: 'restreint', duaDurationYears: 10 },
    { domainId: byCode['SCOL'], code: 'dossier_inscription', shortCode: 'DOSS', label: "Dossier d'inscription", defaultConfidentiality: 'confidentiel', duaDurationYears: 10 },
    { domainId: byCode['SCOL'], code: 'contrat_formation', shortCode: 'CFORM', label: 'Contrat de formation', defaultConfidentiality: 'confidentiel', duaDurationYears: 10 },
    { domainId: byCode['RH'], code: 'contrat_travail', shortCode: 'CTR', label: 'Contrat de travail', defaultConfidentiality: 'confidentiel', duaDurationYears: 50 },
    { domainId: byCode['RH'], code: 'bulletin_paie', shortCode: 'BULL', label: 'Bulletin de paie', defaultConfidentiality: 'confidentiel', duaDurationYears: 5 },
    { domainId: byCode['RH'], code: 'cv', shortCode: 'CV', label: 'Curriculum vitae', defaultConfidentiality: 'interne', duaDurationYears: 2 },
    { domainId: byCode['RH'], code: 'attestation_travail', shortCode: 'ATT', label: 'Attestation de travail', defaultConfidentiality: 'interne', duaDurationYears: 5 },
    { domainId: byCode['FIN'], code: 'facture', shortCode: 'FACT', label: 'Facture', defaultConfidentiality: 'interne', duaDurationYears: 10 },
    { domainId: byCode['FIN'], code: 'quitus', shortCode: 'QUIT', label: 'Quitus', defaultConfidentiality: 'interne', duaDurationYears: 10 },
    { domainId: byCode['FIN'], code: 'bordereau', shortCode: 'BORD', label: 'Bordereau', defaultConfidentiality: 'interne', duaDurationYears: 10 },
    { domainId: byCode['REC'], code: 'publication', shortCode: 'PUB', label: 'Publication', defaultConfidentiality: 'public', isPermanent: true },
    { domainId: byCode['REC'], code: 'these', shortCode: 'THESE', label: 'Thèse', defaultConfidentiality: 'public', isPermanent: true },
    { domainId: byCode['REC'], code: 'rapport_recherche', shortCode: 'RAPR', label: 'Rapport de recherche', defaultConfidentiality: 'interne', duaDurationYears: 10 },
    { domainId: byCode['GOUV'], code: 'deliberation', shortCode: 'DELIB', label: 'Délibération', defaultConfidentiality: 'restreint', isPermanent: true },
    { domainId: byCode['GOUV'], code: 'proces_verbal', shortCode: 'PVRB', label: 'Procès-verbal', defaultConfidentiality: 'restreint', isPermanent: true },
    { domainId: byCode['GOUV'], code: 'reglement_interieur', shortCode: 'REGL', label: 'Règlement intérieur', defaultConfidentiality: 'public', isPermanent: true },
    { domainId: byCode['PAT'], code: 'inventaire', shortCode: 'INVT', label: 'Inventaire', defaultConfidentiality: 'interne', duaDurationYears: 10 },
    { domainId: byCode['PAT'], code: 'bon_commande', shortCode: 'BC', label: 'Bon de commande', defaultConfidentiality: 'interne', duaDurationYears: 5 },
    { domainId: byCode['PAT'], code: 'contrat_fournisseur', shortCode: 'CF', label: 'Contrat fournisseur', defaultConfidentiality: 'confidentiel', duaDurationYears: 10 },
    { domainId: byCode['EXT'], code: 'convention_externe', shortCode: 'CONVX', label: 'Convention externe', defaultConfidentiality: 'interne', duaDurationYears: 10 },
    { domainId: byCode['EXT'], code: 'document_entrant', shortCode: 'DENT', label: 'Document entrant', defaultConfidentiality: 'interne', duaDurationYears: 5 },
    { domainId: byCode['EXT'], code: 'courrier', shortCode: 'COUR', label: 'Courrier', defaultConfidentiality: 'interne', duaDurationYears: 5 },
    { domainId: byCode['RH'], code: 'pointage', shortCode: 'PTS', label: 'Fiche de pointage', defaultConfidentiality: 'restreint', duaDurationYears: 5 },
    { domainId: byCode['RH'], code: 'planning', shortCode: 'PLAN', label: 'Planning personnel', defaultConfidentiality: 'interne', duaDurationYears: 2 },
  ])
  console.log(`${await DocumentType.count()} Types documentaires GED créés`)
}

async function seedProcessusIfEmpty(): Promise<void> {
  const count = await ProcessusGenerateur.count()
  if (count > 0) { console.log(`Processus générateurs: ${count} existants`); return }
  await ProcessusGenerateur.bulkCreate([
    { code: 'PAIE', libelle: 'Paie', description: 'Bulletins de paie et documents salariaux', moduleSource: 'rh', isActif: true },
    { code: 'POINTAGE', libelle: 'Pointage', description: 'Fiches de pointage et relevés horaires', moduleSource: 'rh', isActif: true },
    { code: 'CONTRAT_ENSEIGNANT', libelle: 'Contrat enseignant', description: 'Contrats des enseignants', moduleSource: 'rh', isActif: true },
    { code: 'FACTURE', libelle: 'Facture fournisseur', description: 'Factures des fournisseurs', moduleSource: 'comptabilite', isActif: true },
    { code: 'BON_COMMANDE', libelle: 'Bon de commande', description: 'Bons de commande fournisseurs', moduleSource: 'achats', isActif: true },
    { code: 'RECEPTION', libelle: 'Bon de réception', description: 'Bons de réception marchandises', moduleSource: 'stock', isActif: true },
  ])
  console.log(`${await ProcessusGenerateur.count()} Processus générateurs GED créés`)
}

async function seedPermissionsIfEmpty(): Promise<void> {
  const count = await RolePermission.count()
  if (count > 0) { console.log(`Permissions: ${count} existantes`); return }
  const allRoles = ['apprenant', 'institution', 'admin', 'enseignant', 'ressources_humaines', 'caissier_banque', 'cabinet_comptable', 'comite_orientation']
  const permissions: { confidentialityLevel: string; role: string }[] = []
  for (const role of allRoles) permissions.push({ confidentialityLevel: 'public', role })
  for (const role of allRoles.filter(r => r !== 'apprenant')) permissions.push({ confidentialityLevel: 'interne', role })
  permissions.push({ confidentialityLevel: 'restreint', role: 'institution' })
  permissions.push({ confidentialityLevel: 'restreint', role: 'admin' })
  permissions.push({ confidentialityLevel: 'confidentiel', role: 'admin' })
  await RolePermission.bulkCreate(permissions)
  console.log(`${permissions.length} permissions de confidentialité GED créées`)
}

async function seedFoldersIfEmpty(): Promise<void> {
  const count = await Folder.count()
  if (count > 0) { console.log(`Folders: ${count} existants`); return }
  await Folder.bulkCreate([
    { nom: "Documents administratifs", description: "Registres, procès-verbaux et documents officiels", createdBy: 1 },
    { nom: "Archives", description: "Archives des années précédentes", createdBy: 1 },
  ])
  console.log("2 Folders créés")
}

async function main() {
  const db = DatabaseConnection.getInstance()
  await db.init()
  const seq = db.sequelize

  // 1. Seed all base GED data (domains, document types, processus, permissions, folders)
  await seedDomainsIfEmpty()
  await seedDocumentTypesIfEmpty()
  await seedProcessusIfEmpty()
  await seedPermissionsIfEmpty()
  await seedFoldersIfEmpty()
  
  // 2. Create Doctorat levels
  const doctoratClasses = await createDoctoratLevels(seq)
  
  // 3. Get all classes for student generation
  const allClasses = await getClassInfo(seq)
  const doctoratInfo = doctoratClasses.map(dc => ({
    classeId: dc.classeId,
    niveauEtudeId: dc.niveauId,
    parcoursId: dc.parcoursId,
    classeLibelle: `DOC${dc.niveauId}`,
    niveauLibelle: `Doctorat ${dc.niveauId - 5}`,
  }))
  const fullClassList = [...allClasses, ...doctoratInfo]
  console.log(`Total classes disponibles: ${fullClassList.length}`)
  
  // 4. Generate students (3 per class)
  console.log('Génération des étudiants...')
  const studentCount = await generateStudents(seq, fullClassList, 3)
  console.log(`Étudiants créés: ${studentCount}`)
  
  // 5. Generate GED documents
  await generateGedDocuments(seq, fullClassList)
  
  // 6. Sessions
  await seedSessions(seq)
  
  // 7. Courrier
  await seedCourrier(seq)
  
  // Summary
  const counts: Record<string, number> = {}
  for (const tbl of ['aut_utilisateurs', 'aut_apprenants', 'ins_dossiers_etudiants', 'ins_cursus_apprenants', 'ins_parcours_choisis', 'ged_documents', 'ged_sessions', 'ged_registre_courrier']) {
    counts[tbl] = await safeCount(seq, tbl)
  }
  console.log('\n=== RÉSUMÉ ===')
  for (const [k, v] of Object.entries(counts)) console.log(`  ${k}: ${v}`)
}

if (require.main === module) {
  main().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1) })
}
