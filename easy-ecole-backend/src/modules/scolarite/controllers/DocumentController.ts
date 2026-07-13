import { Request, Response } from "express";
import { FindOptions, InferAttributes } from "sequelize";
import { RolesUtilisateur } from "../../../core/enums/RolesUtilisateur";
import { TypeDocument } from "../models/TypeDocument";

export default class DocumentController {

    constructor() { }

    static async getAllTypesDocument(req: Request, res: Response): Promise<Response> {
        try {
            let types: TypeDocument[];
            types = await TypeDocument.findAll();

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
        if ((req as any).utilisateurRole != RolesUtilisateur.INSTITUTION) {
            return res.status(403).json({ success: false })
        }

        let type: TypeDocument = new TypeDocument();
        type.libelle = req.body.libelle
        type.frais = req.body.frais || 0
        type.format = req.body.format

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
        if ((req as any).utilisateurRole != RolesUtilisateur.INSTITUTION) {
            return res.status(403).json({ success: false })
        }

        let type: TypeDocument | null = await TypeDocument.findOne({ where: { id: req.params.id } });
        if (type != null) {
            await type.update({
                libelle: req.body.libelle,
                frais: req.body.frais,
                format: req.body.format
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
        if ((req as any).utilisateurRole != RolesUtilisateur.INSTITUTION) {
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
