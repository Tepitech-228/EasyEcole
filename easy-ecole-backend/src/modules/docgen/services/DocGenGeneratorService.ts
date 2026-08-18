import { Request, Response } from "express";
import { DocGenType } from "../models/DocGenType";
import { DocGenTemplate } from "../models/DocGenTemplate";
import { DocGenDocument } from "../models/DocGenDocument";
import { DataResolverService } from "../services/DataResolverService";
import { ReferenceService } from "../services/ReferenceService";
import { TemplateEngine } from "../services/TemplateEngine";
import { PdfGeneratorService } from "../services/PdfGeneratorService";
import { DocGenLogoService } from "../services/DocGenLogoService";
import { ArchiveGedService } from "../../../core/services/ArchiveGedService";
import { CursusApprenant } from "../../inscription/models/CursusApprenant";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import qrcode from "qrcode";

const STORAGE_DIR = path.resolve(process.cwd(), 'storage', 'docgen');

export interface DocGenGenerateOptions {
  typeCode: string;
  sourceType?: string;
  sourceId?: number | string;
  metadata?: Record<string, any>;
  utilisateurId?: number;
  params?: Record<string, any>;
}

export interface DocGenResult {
  reference: string;
  filePath: string;
  hash: string;
  documentId?: number;
}

export class DocGenGeneratorService {
  static async generer(options: DocGenGenerateOptions, req?: Request): Promise<DocGenResult> {
    const { typeCode, sourceType, sourceId, metadata, utilisateurId, params = {} } = options;

    const type = await DocGenType.findOne({ where: { code: typeCode } });
    if (!type) throw new Error(`Type de document non trouvé: ${typeCode}`);

    const template = await DocGenTemplate.findOne({ where: { typeId: type.id, isDefault: true } });
    if (!template) throw new Error(`Template par défaut non trouvé pour: ${typeCode}`);

    if (!fs.existsSync(STORAGE_DIR)) {
      fs.mkdirSync(STORAGE_DIR, { recursive: true });
    }

    const resolved = await DataResolverService.resolve(typeCode, {
      typeCode,
      ...params,
      sourceId: sourceId as any,
    });

    if (!resolved.etudiants || resolved.etudiants.length === 0) {
      if (!resolved.sujet) {
        throw new Error('Aucun étudiant trouvé pour les critères donnés');
      }
    }

    const etudiant = resolved.etudiants?.[0] || resolved.sujet!;
    const reference = await ReferenceService.generer(type.id);

    const host = req?.get('host') || 'localhost:3000';
    const protocol = req?.protocol || 'http';
    const verificationUrl = `${protocol}://${host}/api/v1/verification/document/${etudiant.matricule || 'GEN'}/${reference}`;
    const hmac = crypto.createHmac('sha256', process.env.DOCGEN_SECRET || '').update(verificationUrl).digest('hex');
    const qrCodeDataUrl = await qrcode.toDataURL(`${verificationUrl}?token=${hmac}`);

    const dateGeneration = new Date().toISOString().split('T')[0];
    const context: Record<string, any> = {
      ...resolved,
      etudiant,
      sujet: resolved.sujet || etudiant,
      etablissement: resolved.etablissement,
      dateGeneration,
      dateEdition: dateGeneration,
      reference,
      qrCodeDataUrl,
      anneeAcademique: etudiant.anneeAcademique || params.anneeAcademiqueId || '',
      semestre: params.semestre || '',
    };

    const html = DocGenLogoService.injectLogo(template.contenu);
    const htmlRendu = TemplateEngine.render(html, context);
    const pdfBuffer = await PdfGeneratorService.generate(htmlRendu, {
      ecoleNom: (resolved.etablissement as any).nom || 'ESA',
      orientation: params.orientation,
      format: params.format,
      margins: params.margins,
    });

    const hash = crypto.createHash('sha256').update(pdfBuffer).digest('hex');
    const fileName = `${reference}.pdf`;
    const filePath = path.join(STORAGE_DIR, fileName);
    fs.writeFileSync(filePath, pdfBuffer);

    const doc = await DocGenDocument.create({
      typeId: type.id,
      templateId: template.id,
      reference,
      statut: 'genere',
      filePath,
      hash,
      sourceType: sourceType || undefined,
      // NB : DocGenDocument.sourceId est typée INTEGER.UNSIGNED (cf. modèle). On ne peut donc
      // y stocker que des identifiants numériques. Les sourceId chaînes (UUID, référence ...)
      // ne sont pas persistés dans cette colonne ; ils restent consultables via metadata si besoin.
      sourceId: typeof sourceId === 'number' ? sourceId : undefined,
      metadata: metadata ? JSON.stringify(metadata) : undefined,
      generatedById: utilisateurId || req?.utilisateurId || 1,
    });

    try {
      const codePrefix = typeCode.substring(0, 3);
      const anneeAcademiqueId = Number(params.anneeAcademiqueId) || undefined;
      const semestre = params.semestre || undefined;
      let parcoursId: number | undefined;
      let niveauEtudeId: number | undefined;
      let classeId: number | undefined = Number(params.classeId) || undefined;
      let cursusApprenantId: number | undefined = Number(params.cursusApprenantId) || undefined;

      if (params.cursusApprenantId || params.etudiantId || sourceId) {
        const cursusWhere: any = {};
        if (params.cursusApprenantId) cursusWhere.id = params.cursusApprenantId;
        else if (params.etudiantId) cursusWhere.utilisateurId = params.etudiantId;
        else if (sourceId) cursusWhere.id = sourceId;
        const cursus = await CursusApprenant.findOne({
          where: cursusWhere,
          include: [{ association: 'parcours' }, { association: 'niveauEtude' }]
        }) as any;
        if (cursus) {
          parcoursId = Number(cursus.parcoursId) || undefined;
          niveauEtudeId = Number(cursus.niveauEtudeId) || undefined;
          classeId = classeId || Number(cursus.classeId) || undefined;
          cursusApprenantId = cursusApprenantId || cursus.id;
        }
      }

      if (codePrefix === 'DIP' && anneeAcademiqueId && parcoursId && niveauEtudeId) {
        await ArchiveGedService.archiverDocumentDiplome({
          titre: `Diplôme - ${etudiant.nom} ${etudiant.prenom}`,
          fichier: fileName,
          pdfBuffer,
          anneeAcademiqueId,
          parcoursId,
          niveauEtudeId,
          cursusApprenantId: cursusApprenantId!,
          uploaderId: utilisateurId || req?.utilisateurId || 1,
        });
      } else if (['SCO', 'INS', 'CER', 'API', 'PRE', 'ADM', 'MEM'].includes(codePrefix) && anneeAcademiqueId && parcoursId && niveauEtudeId) {
        await ArchiveGedService.archiverDocumentScolarite({
          titre: `${type?.libelle || 'Document'} - ${etudiant.nom} ${etudiant.prenom}`,
          documentTypeCode: 'attestation',
          fichier: fileName,
          pdfBuffer,
          anneeAcademiqueId,
          parcoursId,
          niveauEtudeId,
          classeId: classeId!,
          semestre,
          cursusApprenantId: cursusApprenantId!,
          uploaderId: utilisateurId || req?.utilisateurId || 1,
        });
      }
    } catch (archivalErr) {
      console.error('Erreur archivage GED (DocGenGeneratorService):', archivalErr);
    }

    return {
      reference,
      filePath,
      hash,
      documentId: doc.id,
    };
  }
}
