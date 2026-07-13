import { Request, Response } from "express";
import { CountOptions, FindOptions, InferAttributes } from "sequelize";
import { RolesUtilisateur } from "../../../core/enums/RolesUtilisateur";
import { CaissierBanque } from "../models/CaissierBanque";
import { AdresseCaissierBanque } from "../models/AdresseCaissierBanque";

export default class CaissierBanqueController {

    constructor() { }

    static async getAllCaissierBanques(req: Request, res: Response): Promise<Response> {
        let options: FindOptions<InferAttributes<CaissierBanque>> = {}

        try {
            let caissierbanques: CaissierBanque[];
            caissierbanques = await CaissierBanque.findAll();

            return res.status(200).send(caissierbanques);
        } catch (error) {
            return res.status(500).json({ success: false, error: error });
        }
    }

    static async getCaissierBanque(req: Request, res: Response): Promise<Response> {
        let options: FindOptions<InferAttributes<CaissierBanque>> = {}
        if ((req as any).utilisateurRole == RolesUtilisateur.CAISSIER_BANQUE) {
            options = { where: { utilisateurId: (req as any).utilisateurId }, }
        }
        else {
            return res.status(403).json({ success: false })
        }
        options.include = [
            CaissierBanque.associations.adresse,
        ]

        try {
            const caissierbanque: CaissierBanque | null = await CaissierBanque.findOne(options);

            if (caissierbanque == null)
                return res.sendStatus(204)

            return res.status(200).send(caissierbanque);
        } catch (error) {
            return res.status(500).json({ success: false, error: error });
        }
    }

    static async updateCaissierBanque(req: Request, res: Response): Promise<Response | null> {
        let options: FindOptions<InferAttributes<CaissierBanque>> = {}

        if ((req as any).utilisateurRole == RolesUtilisateur.CAISSIER_BANQUE) {
            options = { where: { utilisateurId: (req as any).utilisateurId } }
        }
        else {
            return res.status(403).json({ success: false })
        }

        let caissierbanque: CaissierBanque | null = await CaissierBanque.findOne(options);
        req.body.utilisateurId = (req as any).utilisateurRole == RolesUtilisateur.CAISSIER_BANQUE ? (req as any).utilisateurId : req.body.utilisateurId

        if (caissierbanque != null) {
            await caissierbanque.update({
                dateNaissance: req.body.dateNaissance,
                lieuNaissance: req.body.lieuNaissance,
                fonction: req.body.fonction,
            })
                .then(async (caissierbanque) => {
                    await AdresseCaissierBanque.update(req.body.adresse, { where: { caissierBanqueId: caissierbanque.id } })

                    return res.status(200).send(caissierbanque);
                })
                .catch((error) => {
                    return res.status(400).json({ success: false, error: error });
                });
        }
        else {
            await CaissierBanque.create({
                dateNaissance: req.body.dateNaissance,
                lieuNaissance: req.body.lieuNaissance,
                fonction: req.body.fonction,
                adresse: req.body.adresse,
                utilisateurId: req.body.utilisateurId
            }, {
                include: [
                    CaissierBanque.associations.adresse,
                ]
            })
                .then((caissierbanque) => {
                    return res.status(201).send(caissierbanque);
                })
                .catch((error) => {
                    return res.status(400).json({ success: false, error: error });
                });
        }

        return null
    }

    static async deleteCaissierBanque(req: Request, res: Response): Promise<Response | null> {
        let options: FindOptions<InferAttributes<CaissierBanque>> = {}
        if ((req as any).utilisateurRole == RolesUtilisateur.CAISSIER_BANQUE) {
            return res.status(403).json({ success: false })
        }
        else if ((req as any).utilisateurRole == RolesUtilisateur.CAISSIER_BANQUE) {
            options = { where: { id: req.params.id } }
        }

        let caissierbanque: CaissierBanque | null = await CaissierBanque.findOne({ where: { id: req.params.id } });
        if (caissierbanque) {
            await caissierbanque.destroy()
                .then(() => {
                    return res.status(200).json({ success: true, message: "Caissier supprimé" });
                })
                .catch((error) => {
                    return res.status(500).json({ success: false, error: error });
                });
        }
        else {
            return res.status(404).json({ success: false, message: "Caissier non trouvé" });
        }

        return null
    }

    static async getCount(req: Request, res: Response): Promise<Response | null> {
        let options: CountOptions<InferAttributes<CaissierBanque>> = {}

        if ((req as any).utilisateurRole == RolesUtilisateur.CAISSIER_BANQUE) {
            return res.status(403).json({ success: false })
        }

        await CaissierBanque.count(options)
            .then((value) => {
                return res.status(200).json({ success: true, count: value });
            })
            .catch((error) => {
                return res.status(500).json({ success: false, error: error });
            });

        return null
    }
}