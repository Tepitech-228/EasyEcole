import fs from "fs";
import path from "path";
import crypto from "crypto";
import { DocumentGed } from "../../modules/ged/models/DocumentGed";
import Domain from "../../modules/ged/models/Domain";
import DocumentType from "../../modules/ged/models/DocumentType";
import Folder from "../../modules/ged/models/Folder";
import { ProcessusGenerateur } from "../../modules/ged/models/ProcessusGenerateur";
import { ReferenceService } from "./ReferenceService";
import { AuditService } from "./AuditService";

const GED_DIR = "public/ged";
const PROCESSUS_CODES = {
  INSCRIPTION: 'INSCRIPTION',
  BORDEREAU: 'BORDEREAU',
  BULLETIN: 'BULLETIN',
  SCOLARITE_DEMANDE: 'SCOLARITE_DEMANDE',
  DELIBERATION: 'DELIBERATION',
  DIPLOME: 'DIPLOME'
} as const;

async function findFolder(domainId: number, parentNom: string, childNom?: string): Promise<number | undefined> {
  const parent = await Folder.findOne({ where: { nom: parentNom, domainId } })
  if (!parent) return undefined
  if (!childNom) return parent.id
  const child = await Folder.findOne({ where: { nom: childNom, domainId, parentId: parent.id } })
  return child?.id ?? parent.id
}

async function findOrCreateProcessus(code: string, libelle: string, moduleSource?: string): Promise<string> {
  const [processus] = await ProcessusGenerateur.findOrCreate({
    where: { code },
    defaults: { code, libelle, moduleSource: moduleSource || 'ged', isActif: true }
  });
  return processus.id;
}

function getCurrentSemestre(): string {
  const month = new Date().getMonth() + 1;
  return month >= 2 && month <= 7 ? 'semestre2' : 'semestre1';
}

export class ArchiveGedService {

  static async archiverDepuisFichier(params: {
    fichierSource: string;
    domaineCode: string;
    typeDocumentCode: string;
    processusCode: string;
    processusLibelle: string;
    processusModule: string;
    titre: string;
    dossierGed: string;
    sousDossierGed?: string;
    sourceType?: string;
    confidentialite?: string;
    cycleVie?: string;
    uploaderId?: number;
    anneeAcademiqueId?: number;
    parcoursId?: number;
    niveauEtudeId?: number;
    semestre?: string;
    classeId?: number;
    cursusApprenantId?: number;
    bulletinId?: number;
    bordereauId?: number;
    inscriptionDossierId?: number;
  }): Promise<DocumentGed | null> {
    const sourcePath = path.resolve(process.cwd(), params.fichierSource);
    if (!fs.existsSync(sourcePath)) return null;

    const domain = await Domain.findOne({ where: { code: params.domaineCode } });
    const docType = await DocumentType.findOne({ where: { code: params.typeDocumentCode } });
    if (!domain || !docType) return null;

    const year = new Date().getFullYear();
    const reference = await ReferenceService.generer(domain.code, docType.shortCode, year);

    const destDir = path.resolve(process.cwd(), GED_DIR);
    if (!fs.existsSync(destDir)) fs.mkdirSync(destDir, { recursive: true });
    const sourceBasename = path.basename(params.fichierSource);
    const destFilename = `${reference}_${sourceBasename}`;
    const destPath = path.join(destDir, destFilename);
    fs.copyFileSync(sourcePath, destPath);

    const fileBuffer = fs.readFileSync(destPath);
    const integrityHash = crypto.createHash('sha256').update(fileBuffer).digest('hex');
    const stats = fs.statSync(destPath);

    const classificationPath = [
      ...(params.anneeAcademiqueId ? [`annee:${params.anneeAcademiqueId}`] : []),
      ...(params.parcoursId ? [`parcours:${params.parcoursId}`] : []),
      ...(params.niveauEtudeId ? [`niveau:${params.niveauEtudeId}`] : []),
      ...(params.semestre ? [`semestre:${params.semestre}`] : []),
      ...(params.classeId ? [`classe:${params.classeId}`] : [])
    ].join('/');

    const folderId = await findFolder(domain.id, params.dossierGed, params.sousDossierGed);
    const processusGenerateurId = await findOrCreateProcessus(params.processusCode, params.processusLibelle, params.processusModule);

    const document = await DocumentGed.create({
      titre: params.titre,
      reference,
      type: 'PDF',
      statut: 'Disponible',
      fichier: destFilename,
      taille: `${(stats.size / 1024).toFixed(1)} Ko`,
      uploaderId: params.uploaderId || 1,
      folderId,
      domainId: domain.id,
      documentTypeId: docType.id,
      classificationPath: classificationPath || undefined,
      sourceType: (params.sourceType as any) || 'genere_application',
      receptionDate: new Date(),
      confidentialityLevel: (params.confidentialite as any) || 'interne',
      lifecycleStatus: (params.cycleVie as any) || 'courant',
      integrityHash,
      versionMajor: 1,
      versionMinor: 0,
      isCurrentVersion: true,
      isLocked: false,
      processusGenerateurId,
      storageLocation: 'local',
      anneeAcademiqueId: params.anneeAcademiqueId || undefined,
      parcoursId: params.parcoursId || undefined,
      niveauEtudeId: params.niveauEtudeId || undefined,
      semestre: params.semestre || undefined,
      classeId: params.classeId || undefined,
      cursusApprenantId: params.cursusApprenantId || undefined,
      bulletinId: params.bulletinId || undefined,
      bordereauId: params.bordereauId || undefined,
      inscriptionDossierId: params.inscriptionDossierId || undefined,
    });

    await AuditService.log(document.id, 1, 'archivage', {
      source: params.processusModule,
      reference: document.reference,
      typeDocument: params.typeDocumentCode
    });

    return document;
  }

  static async archiverDocumentInscription(
    demandeInscriptionDossierId: number,
    sourceFilename: string,
    options: {
      titre: string;
      anneeAcademiqueId: number;
      parcoursId: number;
      niveauEtudeId: number;
      semestre?: string;
      classeId?: number;
      cursusApprenantId?: number;
      salleId?: number;
    }
  ): Promise<DocumentGed | null> {
    const sourcePath = path.resolve(process.cwd(), "public/inscription/dossiers", sourceFilename);
    if (!fs.existsSync(sourcePath)) return null;

    const domain = await Domain.findOne({ where: { code: 'SCOL' } });
    const docType = await DocumentType.findOne({ where: { code: 'fiche_inscription' } });
    if (!domain || !docType) return null;

    const year = new Date().getFullYear();
    const reference = await ReferenceService.generer(domain.code, docType.shortCode, year);

    const destDir = path.resolve(process.cwd(), GED_DIR);
    if (!fs.existsSync(destDir)) fs.mkdirSync(destDir, { recursive: true });
    const destFilename = `${reference}_${sourceFilename}`;
    const destPath = path.join(destDir, destFilename);
    fs.copyFileSync(sourcePath, destPath);

    const fileBuffer = fs.readFileSync(destPath);
    const integrityHash = crypto.createHash('sha256').update(fileBuffer).digest('hex');
    const stats = fs.statSync(destPath);

    const classificationPath = [
      `annee:${options.anneeAcademiqueId}`,
      `parcours:${options.parcoursId}`,
      `niveau:${options.niveauEtudeId}`,
      ...(options.semestre ? [`semestre:${options.semestre}`] : []),
      ...(options.classeId ? [`classe:${options.classeId}`] : [])
    ].join('/');

    const folderId = await findFolder(domain.id, 'Inscriptions', "Dossiers d'inscription")

    const processusGenerateurId = await findOrCreateProcessus(
      PROCESSUS_CODES.INSCRIPTION,
      "Inscription",
      "inscription"
    );

    const document = await DocumentGed.create({
      titre: options.titre,
      reference,
      type: 'PDF',
      statut: 'Disponible',
      fichier: destFilename,
      taille: `${(stats.size / 1024).toFixed(1)} Ko`,
      uploaderId: 1,
      folderId,
      domainId: domain.id,
      documentTypeId: docType.id,
      classificationPath,
      sourceType: 'numerise_interne',
      receptionDate: new Date(),
      confidentialityLevel: 'confidentiel',
      lifecycleStatus: 'courant',
      integrityHash,
      versionMajor: 1,
      versionMinor: 0,
      isCurrentVersion: true,
      isLocked: false,
      processusGenerateurId,
      storageLocation: 'local',
      anneeAcademiqueId: options.anneeAcademiqueId,
      parcoursId: options.parcoursId,
      niveauEtudeId: options.niveauEtudeId,
      semestre: options.semestre || getCurrentSemestre(),
      classeId: options.classeId || undefined,
      salleId: options.salleId || undefined,
      cursusApprenantId: options.cursusApprenantId || undefined,
      inscriptionDossierId: demandeInscriptionDossierId
    });

    await AuditService.log(document.id, 1, 'archivage', {
      source: 'inscription',
      reference: document.reference
    });

    return document;
  }

  static async archiverBordereau(
    bordereauId: number,
    sourceFilename: string,
    options: {
      titre: string;
      anneeAcademiqueId: number;
      parcoursId: number;
      niveauEtudeId: number;
      classeId?: number;
      semestre?: string;
      cursusApprenantId?: number;
    }
  ): Promise<DocumentGed | null> {
    const sourcePath = path.resolve(process.cwd(), "public/inscription/bordereaux", sourceFilename);
    if (!fs.existsSync(sourcePath)) return null;

    const domain = await Domain.findOne({ where: { code: 'FIN' } });
    const docType = await DocumentType.findOne({ where: { code: 'bordereau' } });
    if (!domain || !docType) return null;

    const year = new Date().getFullYear();
    const reference = await ReferenceService.generer(domain.code, docType.shortCode, year);

    const destDir = path.resolve(process.cwd(), GED_DIR);
    if (!fs.existsSync(destDir)) fs.mkdirSync(destDir, { recursive: true });
    const destFilename = `${reference}_${sourceFilename}`;
    const destPath = path.join(destDir, destFilename);
    fs.copyFileSync(sourcePath, destPath);

    const fileBuffer = fs.readFileSync(destPath);
    const integrityHash = crypto.createHash('sha256').update(fileBuffer).digest('hex');
    const stats = fs.statSync(destPath);

    const classificationPath = [
      `annee:${options.anneeAcademiqueId}`,
      `parcours:${options.parcoursId}`,
      `niveau:${options.niveauEtudeId}`,
      ...(options.classeId ? [`classe:${options.classeId}`] : []),
      ...(options.semestre ? [`semestre:${options.semestre}`] : [])
    ].join('/');

    const folderId = await findFolder(domain.id, 'Bordereaux de paiement')

    const processusGenerateurId = await findOrCreateProcessus(
      PROCESSUS_CODES.BORDEREAU,
      "Bordereau de paiement",
      "finance"
    );

    const document = await DocumentGed.create({
      titre: options.titre,
      reference,
      type: 'PDF',
      statut: 'Disponible',
      fichier: destFilename,
      taille: `${(stats.size / 1024).toFixed(1)} Ko`,
      uploaderId: 1,
      folderId,
      domainId: domain.id,
      documentTypeId: docType.id,
      classificationPath,
      sourceType: 'numerise_interne',
      receptionDate: new Date(),
      confidentialityLevel: 'confidentiel',
      lifecycleStatus: 'intermediaire',
      integrityHash,
      versionMajor: 1,
      versionMinor: 0,
      isCurrentVersion: true,
      isLocked: true,
      processusGenerateurId,
      storageLocation: 'local',
      anneeAcademiqueId: options.anneeAcademiqueId,
      parcoursId: options.parcoursId,
      niveauEtudeId: options.niveauEtudeId,
      classeId: options.classeId || undefined,
      semestre: options.semestre || getCurrentSemestre(),
      cursusApprenantId: options.cursusApprenantId || undefined,
      bordereauId
    });

    await AuditService.log(document.id, 1, 'archivage', {
      source: 'bordereau',
      reference: document.reference
    });

    return document;
  }

  static async archiverBulletin(
    bulletin: {
      id: number;
      anneeAcademiqueId: number;
      parcoursId: number;
      niveauEtudeId: number;
      classeId: number;
      semestre: string;
      cursusApprenantId?: number;
      salleId?: number;
      mention?: string | null;
      moyenneGenerale?: number | null;
    },
    pdfBuffer?: Buffer
  ): Promise<DocumentGed | null> {
    const domain = await Domain.findOne({ where: { code: 'SCOL' } });
    let docType = await DocumentType.findOne({ where: { code: 'bulletin' } });
    if (!docType) {
      docType = await DocumentType.findOne({ where: { code: 'releve_notes' } });
    }
    if (!domain || !docType) return null;

    const year = new Date().getFullYear();
    const reference = await ReferenceService.generer(domain.code, docType.shortCode, year);

    const destDir = path.resolve(process.cwd(), GED_DIR);
    if (!fs.existsSync(destDir)) fs.mkdirSync(destDir, { recursive: true });
    const destFilename = `${reference}_bulletin_${bulletin.id}.pdf`;
    const destPath = path.join(destDir, destFilename);

    if (pdfBuffer) {
      fs.writeFileSync(destPath, pdfBuffer);
    } else {
      const placeholderContent = `Bulletin #${bulletin.id}`;
      fs.writeFileSync(destPath, placeholderContent);
    }

    const fileBuffer = fs.readFileSync(destPath);
    const integrityHash = crypto.createHash('sha256').update(fileBuffer).digest('hex');
    const stats = fs.statSync(destPath);

    const classificationPath = [
      `annee:${bulletin.anneeAcademiqueId}`,
      `parcours:${bulletin.parcoursId}`,
      `niveau:${bulletin.niveauEtudeId}`,
      `semestre:${bulletin.semestre}`,
      `classe:${bulletin.classeId}`
    ].join('/');

    const folderId = await findFolder(domain.id, 'Scolarité', 'Bulletins et relevés de notes')

    const processusGenerateurId = await findOrCreateProcessus(
      PROCESSUS_CODES.BULLETIN,
      "Bulletin de notes",
      "scolarite"
    );

    const document = await DocumentGed.create({
      titre: `Bulletin - ${bulletin.mention || 'Non mentionne'} - ${bulletin.moyenneGenerale || ''}/20`,
      reference,
      type: 'PDF',
      statut: 'Disponible',
      fichier: destFilename,
      taille: `${(stats.size / 1024).toFixed(1)} Ko`,
      uploaderId: 1,
      folderId,
      domainId: domain.id,
      documentTypeId: docType.id,
      classificationPath,
      sourceType: 'genere_application',
      receptionDate: new Date(),
      confidentialityLevel: 'restreint',
      lifecycleStatus: 'definitif',
      integrityHash,
      versionMajor: 1,
      versionMinor: 0,
      isCurrentVersion: true,
      isLocked: true,
      processusGenerateurId,
      storageLocation: 'local',
      anneeAcademiqueId: bulletin.anneeAcademiqueId,
      parcoursId: bulletin.parcoursId,
      niveauEtudeId: bulletin.niveauEtudeId,
      semestre: bulletin.semestre,
      classeId: bulletin.classeId,
      salleId: bulletin.salleId || undefined,
      cursusApprenantId: bulletin.cursusApprenantId || undefined,
      bulletinId: bulletin.id
    });

    await AuditService.log(document.id, 1, 'archivage', {
      source: 'bulletin',
      reference: document.reference
    });

    return document;
  }

  static async archiverDocumentScolarite(
    params: {
      titre: string;
      documentTypeCode: string;
      fichier: string;
      pdfBuffer?: Buffer;
      anneeAcademiqueId: number;
      parcoursId: number;
      niveauEtudeId: number;
      classeId?: number;
      semestre?: string;
      cursusApprenantId?: number;
      uploaderId?: number;
    }
  ): Promise<DocumentGed | null> {
    const domain = await Domain.findOne({ where: { code: 'SCOL' } });
    const docType = await DocumentType.findOne({ where: { code: params.documentTypeCode } });
    if (!domain || !docType) return null;

    const year = new Date().getFullYear();
    const reference = await ReferenceService.generer(domain.code, docType.shortCode, year);

    const destDir = path.resolve(process.cwd(), GED_DIR);
    if (!fs.existsSync(destDir)) fs.mkdirSync(destDir, { recursive: true });
    const destFilename = `${reference}_${params.fichier}`;
    const destPath = path.join(destDir, destFilename);

    if (params.pdfBuffer) {
      fs.writeFileSync(destPath, params.pdfBuffer);
    } else {
      const placeholderContent = `${params.titre}`;
      fs.writeFileSync(destPath, placeholderContent);
    }

    const fileBuffer = fs.readFileSync(destPath);
    const integrityHash = crypto.createHash('sha256').update(fileBuffer).digest('hex');
    const stats = fs.statSync(destPath);

    const classificationPath = [
      `annee:${params.anneeAcademiqueId}`,
      `parcours:${params.parcoursId}`,
      `niveau:${params.niveauEtudeId}`,
      ...(params.classeId ? [`classe:${params.classeId}`] : []),
      ...(params.semestre ? [`semestre:${params.semestre}`] : [])
    ].join('/');

    const folderId = await findFolder(domain.id, 'Scolarité', 'Documents de scolarité')

    const processusGenerateurId = await findOrCreateProcessus(
      PROCESSUS_CODES.SCOLARITE_DEMANDE,
      "Demande de scolarité",
      "scolarite"
    );

    const document = await DocumentGed.create({
      titre: params.titre,
      reference,
      type: 'PDF',
      statut: 'Disponible',
      fichier: destFilename,
      taille: `${(stats.size / 1024).toFixed(1)} Ko`,
      uploaderId: params.uploaderId || 1,
      folderId,
      domainId: domain.id,
      documentTypeId: docType.id,
      classificationPath,
      sourceType: 'genere_application',
      receptionDate: new Date(),
      confidentialityLevel: 'interne',
      lifecycleStatus: 'courant',
      integrityHash,
      versionMajor: 1,
      versionMinor: 0,
      isCurrentVersion: true,
      isLocked: false,
      processusGenerateurId,
      storageLocation: 'local',
      anneeAcademiqueId: params.anneeAcademiqueId,
      parcoursId: params.parcoursId,
      niveauEtudeId: params.niveauEtudeId,
      classeId: params.classeId || undefined,
      semestre: params.semestre || getCurrentSemestre(),
      cursusApprenantId: params.cursusApprenantId || undefined
    });

    await AuditService.log(document.id, 1, 'archivage', {
      source: 'scolarite',
      reference: document.reference,
      documentTypeCode: params.documentTypeCode
    });

    return document;
  }

  static async archiverDocumentDeliberation(
    params: {
      titre: string;
      fichier: string;
      pdfBuffer?: Buffer;
      anneeAcademiqueId: number;
      parcoursId: number;
      niveauEtudeId: number;
      classeId?: number;
      semestre?: string;
      uploaderId?: number;
    }
  ): Promise<DocumentGed | null> {
    const domain = await Domain.findOne({ where: { code: 'SCOL' } });
    const docType = await DocumentType.findOne({ where: { code: 'pv_jury' } });
    if (!domain || !docType) return null;

    const year = new Date().getFullYear();
    const reference = await ReferenceService.generer(domain.code, docType.shortCode, year);

    const destDir = path.resolve(process.cwd(), GED_DIR);
    if (!fs.existsSync(destDir)) fs.mkdirSync(destDir, { recursive: true });
    const destFilename = `${reference}_${params.fichier}`;
    const destPath = path.join(destDir, destFilename);

    if (params.pdfBuffer) {
      fs.writeFileSync(destPath, params.pdfBuffer);
    } else {
      fs.writeFileSync(destPath, `Délibération - ${params.titre}`);
    }

    const fileBuffer = fs.readFileSync(destPath);
    const integrityHash = crypto.createHash('sha256').update(fileBuffer).digest('hex');
    const stats = fs.statSync(destPath);

    const classificationPath = [
      `annee:${params.anneeAcademiqueId}`,
      `parcours:${params.parcoursId}`,
      `niveau:${params.niveauEtudeId}`,
      ...(params.classeId ? [`classe:${params.classeId}`] : []),
      ...(params.semestre ? [`semestre:${params.semestre}`] : [])
    ].join('/');

    const folderId = await findFolder(domain.id, 'Scolarité', 'Délibérations et PV de jury')

    const processusGenerateurId = await findOrCreateProcessus(
      PROCESSUS_CODES.DELIBERATION,
      "Délibération",
      "scolarite"
    );

    const document = await DocumentGed.create({
      titre: params.titre,
      reference,
      type: 'PDF',
      statut: 'Disponible',
      fichier: destFilename,
      taille: `${(stats.size / 1024).toFixed(1)} Ko`,
      uploaderId: params.uploaderId || 1,
      folderId,
      domainId: domain.id,
      documentTypeId: docType.id,
      classificationPath,
      sourceType: 'genere_application',
      receptionDate: new Date(),
      confidentialityLevel: 'restreint',
      lifecycleStatus: 'definitif',
      integrityHash,
      versionMajor: 1,
      versionMinor: 0,
      isCurrentVersion: true,
      isLocked: true,
      processusGenerateurId,
      storageLocation: 'local',
      anneeAcademiqueId: params.anneeAcademiqueId,
      parcoursId: params.parcoursId,
      niveauEtudeId: params.niveauEtudeId,
      classeId: params.classeId || undefined,
      semestre: params.semestre || getCurrentSemestre()
    });

    await AuditService.log(document.id, 1, 'archivage', {
      source: 'deliberation',
      reference: document.reference
    });

    return document;
  }

  static async archiverDocumentDiplome(
    params: {
      titre: string;
      fichier: string;
      pdfBuffer?: Buffer;
      anneeAcademiqueId: number;
      parcoursId: number;
      niveauEtudeId: number;
      cursusApprenantId?: number;
      uploaderId?: number;
    }
  ): Promise<DocumentGed | null> {
    const domain = await Domain.findOne({ where: { code: 'SCOL' } });
    const docType = await DocumentType.findOne({ where: { code: 'diplome' } });
    if (!domain || !docType) return null;

    const year = new Date().getFullYear();
    const reference = await ReferenceService.generer(domain.code, docType.shortCode, year);

    const destDir = path.resolve(process.cwd(), GED_DIR);
    if (!fs.existsSync(destDir)) fs.mkdirSync(destDir, { recursive: true });
    const destFilename = `${reference}_${params.fichier}`;
    const destPath = path.join(destDir, destFilename);

    if (params.pdfBuffer) {
      fs.writeFileSync(destPath, params.pdfBuffer);
    } else {
      fs.writeFileSync(destPath, `Diplôme - ${params.titre}`);
    }

    const fileBuffer = fs.readFileSync(destPath);
    const integrityHash = crypto.createHash('sha256').update(fileBuffer).digest('hex');
    const stats = fs.statSync(destPath);

    const classificationPath = [
      `annee:${params.anneeAcademiqueId}`,
      `parcours:${params.parcoursId}`,
      `niveau:${params.niveauEtudeId}`
    ].join('/');

    const folderId = await findFolder(domain.id, 'Scolarité', 'Diplômes')

    const processusGenerateurId = await findOrCreateProcessus(
      PROCESSUS_CODES.DIPLOME,
      "Diplôme",
      "scolarite"
    );

    const document = await DocumentGed.create({
      titre: params.titre,
      reference,
      type: 'PDF',
      statut: 'Disponible',
      fichier: destFilename,
      taille: `${(stats.size / 1024).toFixed(1)} Ko`,
      uploaderId: params.uploaderId || 1,
      folderId,
      domainId: domain.id,
      documentTypeId: docType.id,
      classificationPath,
      sourceType: 'genere_application',
      receptionDate: new Date(),
      confidentialityLevel: 'confidentiel',
      lifecycleStatus: 'definitif',
      integrityHash,
      versionMajor: 1,
      versionMinor: 0,
      isCurrentVersion: true,
      isLocked: true,
      processusGenerateurId,
      storageLocation: 'local',
      anneeAcademiqueId: params.anneeAcademiqueId,
      parcoursId: params.parcoursId,
      niveauEtudeId: params.niveauEtudeId,
      cursusApprenantId: params.cursusApprenantId || undefined
    });

    await AuditService.log(document.id, 1, 'archivage', {
      source: 'diplome',
      reference: document.reference
    });

    return document;
  }
}
