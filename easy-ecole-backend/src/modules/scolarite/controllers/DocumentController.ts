import { Request, Response } from "express";
import { FindOptions, InferAttributes } from "sequelize";
import { RolesUtilisateur } from "../../../core/enums/RolesUtilisateur";
import { ROLES_RECOUVREMENT } from "../../../core/middlewares/AuthRecouvrement";
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
            const role = (req as any).utilisateurRole;
            const where = role === RolesUtilisateur.APPRENANT
                ? { actif: true }
                : {};
            const types = await TypeDocument.findAll({ where });
            if ([RolesUtilisateur.SECRETAIRE, RolesUtilisateur.PERSONNEL_ADMINISTRATIF].includes(role)) {
                return res.status(200).send(types.map(type => {
                    const data = type.toJSON() as Record<string, unknown>;
                    delete data.frais;
                    return data;
                }));
            }

            return res.status(200).send(types);
        } catch (error) {
            return res.status(500).json({ success: false, error: error });
        }
    }

    static async getTarifsTypesDocument(_req: Request, res: Response): Promise<Response> {
        try {
            const types = await TypeDocument.findAll({
                attributes: ['id', 'libelle', 'frais'],
                order: [['libelle', 'ASC']]
            });
            return res.status(200).send(types);
        } catch (error) {
            return res.status(500).json({ success: false, error });
        }
    }

    static async updateTarifTypeDocument(req: Request, res: Response): Promise<Response> {
        const role = (req as any).utilisateurRole;
        if (!ROLES_RECOUVREMENT.includes(role)) {
            return res.status(403).json({ success: false });
        }

        const body = req.body as Record<string, unknown> | undefined;
        const keys = body ? Object.keys(body) : [];
        const value = body?.frais;
        if (
            keys.length !== 1
            || keys[0] !== 'frais'
            || (typeof value !== 'number' && typeof value !== 'string')
            || (typeof value === 'string' && value.trim() === '')
        ) {
            return res.status(400).json({ success: false, message: "Le montant des frais est invalide" });
        }

        const frais = Number(value);
        if (!Number.isFinite(frais) || frais < 0) {
            return res.status(400).json({ success: false, message: "Le montant doit être un nombre positif ou nul" });
        }

        try {
            const type = await TypeDocument.findByPk(req.params.id);
            if (!type) {
                return res.status(404).json({ success: false, message: "Type de document non trouvé" });
            }

            await type.update({ frais });
            return res.status(200).send({ id: type.id, libelle: type.libelle, frais: type.frais });
        } catch (error) {
            return res.status(500).json({ success: false, error });
        }
    }

    static async getTypeDocument(req: Request, res: Response): Promise<Response> {
        try {
            const type: TypeDocument | null = await TypeDocument.findOne({ where: { id: req.params.id } });

            if (type == null)
                return res.status(404).json({ success: false, message: "Type de document non trouvé" });

            if ([RolesUtilisateur.SECRETAIRE, RolesUtilisateur.PERSONNEL_ADMINISTRATIF].includes((req as any).utilisateurRole)) {
                const data = type.toJSON() as Record<string, unknown>;
                delete data.frais;
                return res.status(200).send(data);
            }
            return res.status(200).send(type);
        } catch (error) {
            return res.status(500).json({ success: false, error: error });
        }
    }

    static async createTypeDocument(req: Request, res: Response): Promise<Response | null> {
        const role = (req as any).utilisateurRole;
        if (![RolesUtilisateur.INSTITUTION, RolesUtilisateur.SECRETAIRE, RolesUtilisateur.ADMIN].includes(role)) {
            return res.status(403).json({ success: false })
        }
        if (role === RolesUtilisateur.SECRETAIRE && Number(req.body.frais || 0) !== 0) {
            return res.status(403).json({ success: false, message: "La définition des tarifs est réservée au service de recouvrement" });
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
        const role = (req as any).utilisateurRole;
        if (![RolesUtilisateur.INSTITUTION, RolesUtilisateur.SECRETAIRE, RolesUtilisateur.ADMIN].includes(role)) {
            return res.status(403).json({ success: false })
        }

        let type: TypeDocument | null = await TypeDocument.findOne({ where: { id: req.params.id } });
        if (type != null) {
            if (role === RolesUtilisateur.SECRETAIRE
                && req.body.frais !== undefined
                && Number(req.body.frais) !== Number(type.frais)) {
                return res.status(403).json({ success: false, message: "La définition des tarifs est réservée au service de recouvrement" });
            }
            const piecesRequises = validerPiecesRequises(req.body.piecesRequises);
            if (req.body.piecesRequises !== undefined && piecesRequises === null) {
                return res.status(400).json({ success: false, message: "La liste des pièces requises est invalide" });
            }
            const modifications: Record<string, unknown> = {
                libelle: req.body.libelle,
                format: req.body.format,
                ...(piecesRequises !== null ? { piecesRequises } : {})
            };
            if (role !== RolesUtilisateur.SECRETAIRE && req.body.frais !== undefined) {
                modifications.frais = req.body.frais;
            }
            await type.update(modifications)
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
        const role = (req as any).utilisateurRole;
        if (![RolesUtilisateur.INSTITUTION, RolesUtilisateur.SECRETAIRE, RolesUtilisateur.ADMIN].includes(role)) {
            return res.status(403).json({ success: false })
        }

        let type: TypeDocument | null = await TypeDocument.findOne({ where: { id: req.params.id } });
        if (type) {
            if (role === RolesUtilisateur.SECRETAIRE && Number(type.frais) > 0) {
                return res.status(403).json({ success: false, message: "La suppression d'un document payant est réservée au service de recouvrement" });
            }
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
