import { Request, Response } from "express";
import { DocumentGed } from "../../modules/ged/models/DocumentGed";
import { PermissionService } from "../../modules/ged/services/PermissionService";

export const AuthConfidentiality = async (req: Request, res: Response, next: Function) => {
  try {
    const documentId = req.params.id;
    if (!documentId) return next();

    const document = await DocumentGed.findByPk(documentId, {
      attributes: ["id", "confidentialityLevel", "uploaderId", "processusGenerateurId", "domainId"]
    });

    if (!document) return next();

    const userId = (req as any).utilisateurId;

    const method = req.method.toLowerCase();
    let action: 'read' | 'write' | 'delete' | 'download' = 'read';
    if (method === 'post' || method === 'put' || method === 'patch') action = 'write';
    else if (method === 'delete') action = 'delete';
    else if (method === 'get' && req.path.endsWith('/download')) action = 'download';

    const hasPermission = await PermissionService.checkPermission(userId, action, document);

    if (hasPermission) return next();

    return res.status(403).json({ success: false, message: "Accès non autorisé à ce document" });
  } catch (error) {
    return res.status(500).json({ success: false, error });
  }
};
