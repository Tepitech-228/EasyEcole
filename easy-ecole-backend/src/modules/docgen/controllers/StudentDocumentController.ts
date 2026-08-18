import { Request, Response } from "express";
import { Op } from "sequelize";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import qrcode from "qrcode";
import { RolesUtilisateur } from "../../../core/enums/RolesUtilisateur";
import { DocGenDocument } from "../models/DocGenDocument";
import { DocGenType } from "../models/DocGenType";
import { DocGenTemplate } from "../models/DocGenTemplate";
import { ReferenceService } from "../services/ReferenceService";
import { DataResolverService } from "../services/DataResolverService";
import { TemplateEngine } from "../services/TemplateEngine";
import { PdfGeneratorService } from "../services/PdfGeneratorService";
import { CursusApprenant } from "../../inscription/models/CursusApprenant";

const DOCGEN_SECRET: string = process.env.DOCGEN_SECRET || '';
if (!DOCGEN_SECRET) {
  throw new Error('DOCGEN_SECRET environment variable is required');
}

const STORAGE_DIR = path.resolve(process.cwd(), 'storage', 'docgen');

const STUDENT_ALLOWED_TYPES = ['PRE001', 'ADM020'];

export default class StudentDocumentController {
  private static isApprenant(req: Request): boolean {
    return (req as any).utilisateurRole === RolesUtilisateur.APPRENANT;
  }

  private static async resolveOwnCursusId(utilisateurId: number, sourceId?: number | string): Promise<number | null> {
    const target = sourceId !== undefined && sourceId !== null ? Number(sourceId) : null;

    if (target === utilisateurId) {
      const cursus = await CursusApprenant.findOne({ where: { utilisateurId } });
      return cursus ? Number(cursus.id) : null;
    }

    if (target) {
      const cursus = await CursusApprenant.findOne({ where: { id: target, utilisateurId } });
      if (cursus) {
        return Number(cursus.id);
      }
    }

    const ownCursus = await CursusApprenant.findOne({ where: { utilisateurId } });
    return ownCursus ? Number(ownCursus.id) : null;
  }

  static async generateMyDocument(req: Request, res: Response): Promise<Response> {
    try {
      if (!StudentDocumentController.isApprenant(req)) {
        return res.status(403).json({ success: false, message: 'Accès réservé aux apprenants' });
      }

      const utilisateurId = (req as any).utilisateurId;
      const { typeCode, sourceType, sourceId, metadata, ...params } = req.body;

      if (!typeCode) {
        return res.status(400).json({ success: false, message: 'typeCode requis' });
      }

      if (!STUDENT_ALLOWED_TYPES.includes(typeCode)) {
        return res.status(400).json({
          success: false,
          message: `Type de document non autorisé. Types autorisés : ${STUDENT_ALLOWED_TYPES.join(', ')}`,
        });
      }

      const type = await DocGenType.findOne({ where: { code: typeCode } });
      if (!type) return res.status(404).json({ success: false, message: 'Type non trouvé' });

      const ownCursusId = await StudentDocumentController.resolveOwnCursusId(utilisateurId, sourceId);
      if (!ownCursusId) {
        return res.status(403).json({
          success: false,
          message: 'Aucun cursus trouvé pour cet apprenant',
        });
      }

      if (sourceId !== undefined && sourceId !== null && Number(sourceId) !== ownCursusId && Number(sourceId) !== utilisateurId) {
        return res.status(403).json({
          success: false,
          message: 'Le sourceId ne correspond pas à votre compte',
        });
      }

      params.cursusApprenantId = ownCursusId;

      const template = await DocGenTemplate.findOne({ where: { typeId: type.id, isDefault: true } });
      if (!template) return res.status(404).json({ success: false, message: 'Template par défaut non trouvé' });

      if (!fs.existsSync(STORAGE_DIR)) {
        fs.mkdirSync(STORAGE_DIR, { recursive: true });
      }

      const resolved = await DataResolverService.resolve(typeCode, params);
      if (!resolved.etudiants || resolved.etudiants.length === 0) {
        return res.status(404).json({ success: false, message: 'Aucun étudiant trouvé pour les critères donnés' });
      }

      const documents: DocGenDocument[] = [];
      const dateGeneration = new Date().toISOString().split('T')[0];

      for (const etudiant of resolved.etudiants) {
        const reference = await ReferenceService.generer(type.id);
        const verificationUrl = `${req.protocol}://${req.get('host')}/api/v1/verification/document/${etudiant.matricule}/${reference}`;
        const hmac = crypto.createHmac('sha256', DOCGEN_SECRET).update(verificationUrl).digest('hex');
        const qrDataUrl = await qrcode.toDataURL(`${verificationUrl}?token=${hmac}`);

        const context: Record<string, any> = {
          ...resolved,
          etudiant,
          etablissement: resolved.etablissement,
          dateGeneration,
          dateEdition: dateGeneration,
          reference,
          qrCodeDataUrl: qrDataUrl,
          anneeAcademique: etudiant.anneeAcademique || params.anneeAcademiqueId || '',
          semestre: params.semestre || '',
        };

        const html = TemplateEngine.render(template.contenu, context);
        const pdfBuffer = await PdfGeneratorService.generate(html, { ecoleNom: (resolved.etablissement as any).nom || 'ESA' });

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
          sourceType: sourceType || 'cursus',
          sourceId: ownCursusId,
          metadata: metadata ? JSON.stringify(metadata) : undefined,
          generatedById: utilisateurId,
        });
        documents.push(doc);
      }

      return res.status(201).json({ success: true, data: documents });
    } catch (error) {
      return res.status(500).json({ success: false, error: String(error) });
    }
  }

  static async getMyDocuments(req: Request, res: Response): Promise<Response> {
    try {
      if (!StudentDocumentController.isApprenant(req)) {
        return res.status(403).json({ success: false, message: 'Accès réservé aux apprenants' });
      }

      const utilisateurId = (req as any).utilisateurId;

      const cursus = await CursusApprenant.findOne({ where: { utilisateurId } });
      const sourceIds = [utilisateurId, ...(cursus ? [Number(cursus.id)] : [])];

      const documents = await DocGenDocument.findAll({
        where: {
          [Op.or]: [
            { sourceId: sourceIds },
            { generatedById: utilisateurId },
          ],
        },
        include: [
          { association: 'type' },
          { association: 'template' },
        ],
        order: [['createdAt', 'DESC']],
      });

      return res.status(200).json({ success: true, data: documents });
    } catch (error) {
      return res.status(500).json({ success: false, error: String(error) });
    }
  }
}
