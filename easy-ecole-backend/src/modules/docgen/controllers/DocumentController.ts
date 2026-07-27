import { Request, Response } from "express";
import { DocGenDocument } from "../models/DocGenDocument";
import { DocGenType } from "../models/DocGenType";
import { DocGenTemplate } from "../models/DocGenTemplate";
import { ReferenceService } from "../services/ReferenceService";
import { DataResolverService } from "../services/DataResolverService";
import { TemplateEngine } from "../services/TemplateEngine";
import { PdfGeneratorService } from "../services/PdfGeneratorService";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import qrcode from "qrcode";

const DOCGEN_SECRET = process.env.DOCGEN_SECRET || 'docgen_secret_default';
const STORAGE_DIR = path.resolve(process.cwd(), 'storage', 'docgen');

export default class DocumentController {
  static async getAll(req: Request, res: Response): Promise<Response> {
    try {
      const where: any = {};
      if (req.query.typeId) where.typeId = Number(req.query.typeId);
      if (req.query.statut) where.statut = String(req.query.statut);
      if (req.query.sourceType) where.sourceType = String(req.query.sourceType);
      const documents = await DocGenDocument.findAll({
        where,
        include: [
          { association: 'type' },
          { association: 'template' }
        ],
        order: [['createdAt', 'DESC']]
      });
      return res.status(200).json(documents);
    } catch (error) {
      return res.status(500).json({ success: false, error });
    }
  }

  static async getById(req: Request, res: Response): Promise<Response> {
    try {
      const document = await DocGenDocument.findByPk(req.params.id, {
        include: [
          { association: 'type' },
          { association: 'template' }
        ]
      });
      if (!document) return res.status(404).json({ success: false, message: 'Document non trouvé' });
      return res.status(200).json(document);
    } catch (error) {
      return res.status(500).json({ success: false, error });
    }
  }

  static async generate(req: Request, res: Response): Promise<Response> {
    try {
      const { typeCode, sourceType, sourceId, metadata, ...params } = req.body;

      const type = await DocGenType.findOne({ where: { code: typeCode } });
      if (!type) return res.status(404).json({ success: false, message: 'Type non trouvé' });

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
          sourceType: sourceType || undefined,
          sourceId: sourceId || undefined,
          metadata: metadata ? JSON.stringify(metadata) : undefined,
          generatedById: (req as any).utilisateurId,
        });
        documents.push(doc);
      }

      return res.status(201).json({ success: true, data: documents });
    } catch (error) {
      return res.status(500).json({ success: false, error: String(error) });
    }
  }

  static async download(req: Request, res: Response): Promise<void> {
    try {
      const document = await DocGenDocument.findByPk(req.params.id);
      if (!document) {
        res.status(404).json({ success: false, message: 'Document non trouvé' });
        return;
      }
      if (!document.filePath) {
        res.status(404).json({ success: false, message: 'Fichier introuvable' });
        return;
      }
      const filePath = path.resolve(process.cwd(), document.filePath);
      if (!fs.existsSync(filePath)) {
        res.status(404).json({ success: false, message: 'Fichier introuvable sur le disque' });
        return;
      }
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${document.reference || 'document'}.pdf"`);
      const stream = fs.createReadStream(filePath);
      stream.pipe(res);
    } catch (error) {
      res.status(500).json({ success: false, error });
    }
  }

  static async delete(req: Request, res: Response): Promise<Response> {
    try {
      const document = await DocGenDocument.findByPk(req.params.id);
      if (!document) return res.status(404).json({ success: false, message: 'Document non trouvé' });
      if (document.filePath) {
        const filePath = path.resolve(process.cwd(), document.filePath);
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      }
      await document.destroy();
      return res.status(200).json({ success: true });
    } catch (error) {
      return res.status(500).json({ success: false, error });
    }
  }
}
