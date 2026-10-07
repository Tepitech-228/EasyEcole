import { Request, Response } from "express";
import { FindOptions, InferAttributes } from "sequelize";
import { RolesUtilisateur } from "../../../core/enums/RolesUtilisateur";
import { TypeDocument } from "../models/TypeDocument";

function validerPiecesRequises(value: unknown): Array<{ cle: string; libelle: string; obligatoire: boolean }> | null {
    if (value === undefined) return null;
    if (!Array.isArray(value) || value.length > 20) return null;

    const pieces: Array<{ cle: string; libelle: string; obligatoire: boolean }> = [];
    const cles = new Set<string>();
    for (const piece of value) {
        if (!piece || typeof piece.cle !== 'string' || typeof piece.libelle !== 'string') return null;
        const cle = piece.cle.trim();
        const libelle = piece.libelle.trim();
        if (!/^[a-z0-9_-]{1,80}$/.test(cle) || !libelle || libelle.length > 160 || cles.has(cle)) return null;
        cles.add(cle);
        pieces.push({ cle, libelle, obligatoire: piece.obligatoire !== false });
    }
    return pieces;
}

export default class DocumentController {

    constructor() { }

    static async getAllTypesDocument(req: Request, res: Response): Promise<Response> {
        try {
            const where = (req as any).utilisateurRole === RolesUtilisateur.APPRENANT
                ? { actif: true }
                : {};
            const types = await TypeDocument.findAll({ where });

            return res.status(200).send(types);
        } catch (error) {
            return res.status(500).json({ success: false, error: error });
        }
    }

    static async getTypeDocument(req: Request, res: Response): Promise<Response> {
        try {
            const type: TypeDocument | null = await TypeDocument.findOne({ where: { id: req.params.id } });

            if (type == null)
                return res.status(404).json({ success: false, message: "Type de document non trouvé" });

            return res.status(200).send(type);
        } catch (error) {
            return res.status(500).json({ success: false, error: error });
        }
    }

    static async createTypeDocument(req: Request, res: Response): Promise<Response | null> {
        if (![RolesUtilisateur.INSTITUTION, RolesUtilisateur.SECRETAIRE, RolesUtilisateur.ADMIN].includes((req as any).utilisateurRole)) {
            return res.status(403).json({ success: false })
        }

        let type: TypeDocument = new TypeDocument();
        type.libelle = req.body.libelle
        type.frais = req.body.frais || 0
        type.format = req.body.format
        const piecesRequises = validerPiecesRequises(req.body.piecesRequises);
        if (req.body.piecesRequises !== undefined && piecesRequises === null) {
            return res.status(400).json({ success: false, message: "La liste des pièces requises est invalide" });
        }
        if (piecesRequises !== null) type.piecesRequises = piecesRequises;

        await type.save()
            .then(async (type) => {
                return res.status(201).send(type);
            })
            .catch((error) => {
                return res.status(400).json({ success: false, error: error });
            });

        return null
    }

    static async updateTypeDocument(req: Request, res: Response): Promise<Response | null> {
        if (![RolesUtilisateur.INSTITUTION, RolesUtilisateur.SECRETAIRE, RolesUtilisateur.ADMIN].includes((req as any).utilisateurRole)) {
            return res.status(403).json({ success: false })
        }

        let type: TypeDocument | null = await TypeDocument.findOne({ where: { id: req.params.id } });
        if (type != null) {
            const piecesRequises = validerPiecesRequises(req.body.piecesRequises);
            if (req.body.piecesRequises !== undefined && piecesRequises === null) {
                return res.status(400).json({ success: false, message: "La liste des pièces requises est invalide" });
            }
            await type.update({
                libelle: req.body.libelle,
                frais: req.body.frais,
                format: req.body.format,
                ...(piecesRequises !== null ? { piecesRequises } : {})
            })
                .then(async (type) => {
                    return res.status(200).send(type);
                })
                .catch((error) => {
                    return res.status(400).json({ success: false, error: error });
                });
        } else {
            return res.status(404).json({ success: false, message: "Type de document non trouvé" });
        }

        return null
    }

    static async deleteTypeDocument(req: Request, res: Response): Promise<Response | null> {
        if (![RolesUtilisateur.INSTITUTION, RolesUtilisateur.SECRETAIRE, RolesUtilisateur.ADMIN].includes((req as any).utilisateurRole)) {
            return res.status(403).json({ success: false })
        }

        let type: TypeDocument | null = await TypeDocument.findOne({ where: { id: req.params.id } });
        if (type) {
            await type.destroy()
                .then(() => {
                    return res.status(200).json({ success: true, message: "Type de document supprimé" });
                })
                .catch((error) => {
                    return res.status(500).json({ success: false, error: error });
                });
        } else {
            return res.status(404).json({ success: false, message: "Type de document non trouvé" });
        }

        return null
    }
}
