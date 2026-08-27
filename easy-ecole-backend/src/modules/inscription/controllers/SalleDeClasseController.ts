import { Request, Response } from "express";
import { CountOptions, FindOptions, InferAttributes, Op } from "sequelize";
import { RolesUtilisateur } from "../../../core/enums/RolesUtilisateur";
import { SalleDeClasse } from "../models/SalleDeClasse";
import { Localisation } from "../../immobilisation/models/Localisation";
import { Batiment } from "../../immobilisation/models/Batiment";
import { Site } from "../../immobilisation/models/Site";

export default class SalleDeClasseController {

    constructor() { }

    static async getAllSallesDeClasse(req: Request, res: Response): Promise<Response> {
        let options: FindOptions<InferAttributes<SalleDeClasse>> = {
            include: [{
                association: SalleDeClasse.associations.localisation,
                include: [{
                    association: 'batiment' as any,
                    include: [{
                        association: 'site' as any
                    }]
                }]
            }, {
                association: SalleDeClasse.associations.classe
            }, {
                association: SalleDeClasse.associations.parcours
            }, {
                association: SalleDeClasse.associations.etablissement
            }]
        }

        let where: any = {}
        if (req.query.classeId) {
            where.classeId = req.query.classeId as string
        }
        if (req.query.parcoursId) {
            where.parcoursId = req.query.parcoursId as string
        }
        if (req.query.etablissementId) {
            where.etablissementId = req.query.etablissementId as string
        }
        if (req.query.type) {
            where.type = req.query.type as string
        }
        if (req.query.regime) {
            where.regime = req.query.regime as string
        }
        if (req.query.statut) {
            where.statut = req.query.statut as string
        }
        if (req.query.recherche) {
            const terme = (req.query.recherche as string).trim();
            if (terme !== '') {
                where[Op.or] = [
                    { libelle: { [Op.like]: `%${terme}%` } },
                    { code: { [Op.like]: `%${terme}%` } },
                ];
            }
        }
        if (Object.keys(where).length > 0) {
            options = {
                ...options,
                where
            }
        }

        try {
            let sallesDeClasse: SalleDeClasse[];
            sallesDeClasse = await SalleDeClasse.findAll(options);

            return res.status(200).send(sallesDeClasse);
        } catch (error) {
            console.error('Erreur', error);
            return res.status(500).json({ success: false, message: 'Erreur interne' });
        }
    }

    static async getSalleDeClasse(req: Request, res: Response): Promise<Response> {
        let options: FindOptions<InferAttributes<SalleDeClasse>> = {}
        options = {
            where: { id: req.params.id },
            include: [{
                association: SalleDeClasse.associations.localisation,
                include: [{
                    association: 'batiment' as any,
                    include: [{
                        association: 'site' as any
                    }]
                }]
            }, {
                association: SalleDeClasse.associations.classe
            }, {
                association: SalleDeClasse.associations.parcours
            }, {
                association: SalleDeClasse.associations.etablissement
            }]
        }

        try {
            const salledeclasse: SalleDeClasse | null = await SalleDeClasse.findOne(options);

            if (salledeclasse == null)
                return res.status(404).json({ success: false, message: "SalleDeClasse non trouvée" });

            return res.status(200).send(salledeclasse);
        } catch (error) {
            console.error('Erreur', error);
            return res.status(500).json({ success: false, message: 'Erreur interne' });
        }
    }

    static async createSalleDeClasse(req: Request, res: Response): Promise<Response | null> {

        if ((req as any).utilisateurRole == RolesUtilisateur.APPRENANT) {
            return res.status(403).json({ success: false })
        }

        let salledeclasse: SalleDeClasse | null = await SalleDeClasse.findOne({ where: { libelle: req.body.libelle } });

        if (salledeclasse != null) {
            return res.status(400).json({ success: false, alreadyExists: true });
        }
        else {
            let salledeclasse: SalleDeClasse = new SalleDeClasse();
            salledeclasse.code = req.body.code ?? null
            salledeclasse.libelle = req.body.libelle
            salledeclasse.description = req.body.description
            salledeclasse.etage = req.body.etage ?? null
            salledeclasse.type = req.body.type ?? null
            salledeclasse.regime = req.body.regime ?? null
            salledeclasse.statut = req.body.statut ?? null
            salledeclasse.capacite = req.body.capacite
            salledeclasse.equipements = req.body.equipements ? JSON.stringify(req.body.equipements) : null
            salledeclasse.localisationId = req.body.localisationId
            salledeclasse.classeId = req.body.classeId
            salledeclasse.parcoursId = req.body.parcoursId
            salledeclasse.etablissementId = req.body.etablissementId

            await salledeclasse.save()
                .then((salledeclasse) => {
                    return res.status(201).send(salledeclasse);
                })
                .catch((error) => {
                    return res.status(400).json({ success: false, error: error });
                });
        }

        return null
    }

    static async updateSalleDeClasse(req: Request, res: Response): Promise<Response | null> {
        let options: FindOptions<InferAttributes<SalleDeClasse>> = {}
        if ((req as any).utilisateurRole == RolesUtilisateur.APPRENANT) {
            return res.status(403).json({ success: false })
        }
        else if ((req as any).utilisateurRole == RolesUtilisateur.INSTITUTION) {
            options = { where: { id: req.params.id } }
        }

        let salledeclasse: SalleDeClasse | null = await SalleDeClasse.findOne(options);
        if (salledeclasse != null) {

            await salledeclasse.update({
                code: req.body.code ?? salledeclasse.code,
                libelle: req.body.libelle ?? salledeclasse.libelle,
                description: req.body.description ?? salledeclasse.description,
                etage: req.body.etage ?? salledeclasse.etage,
                type: req.body.type ?? salledeclasse.type,
                regime: req.body.regime ?? salledeclasse.regime,
                statut: req.body.statut ?? salledeclasse.statut,
                capacite: req.body.capacite ?? salledeclasse.capacite,
                equipements: req.body.equipements ? JSON.stringify(req.body.equipements) : (req.body.equipements === null ? null : salledeclasse.equipements),
                localisationId: req.body.localisationId ?? salledeclasse.localisationId,
                classeId: req.body.classeId ?? salledeclasse.classeId,
                parcoursId: req.body.parcoursId ?? salledeclasse.parcoursId,
                etablissementId: req.body.etablissementId ?? salledeclasse.etablissementId,
            })
                .then(async (salledeclasse) => {
                    return res.status(200).send(salledeclasse);
                })
                .catch((error) => {
                    return res.status(400).json({ success: false, error: error });
                });
        }
        else {
            return res.status(404).json({ success: false, message: "SalleDeClasse non trouvée" });
        }

        return null
    }

    static async deleteSalleDeClasse(req: Request, res: Response): Promise<Response | null> {
        let options: FindOptions<InferAttributes<SalleDeClasse>> = {}
        if ((req as any).utilisateurRole == RolesUtilisateur.APPRENANT) {
            return res.status(403).json({ success: false })
        }
        else if ((req as any).utilisateurRole == RolesUtilisateur.INSTITUTION) {
            options = { where: { id: req.params.id } }
        }

        let salledeclasse: SalleDeClasse | null = await SalleDeClasse.findOne({ where: { id: req.params.id } });
        if (salledeclasse) {
            await salledeclasse.destroy()
                .then(() => {
                    return res.status(200).json({ success: true, message: "SalleDeClasse supprimée" });
                })
                .catch((error) => {
                    console.error('Erreur', error);
                    return res.status(500).json({ success: false, message: 'Erreur interne' });
                });
        }
        else {
            return res.status(404).json({ success: false, message: "SalleDeClasse non trouvée" });
        }

        return null
    }

    static async getCount(req: Request, res: Response): Promise<Response | null> {
        let options: CountOptions<InferAttributes<SalleDeClasse>> = {}

        if ((req as any).utilisateurRole == RolesUtilisateur.APPRENANT) {
            return res.status(403).json({ success: false })
        }

        await SalleDeClasse.count(options)
            .then((value) => {
                return res.status(200).json({ success: true, count: value });
            })
            .catch((error) => {
                console.error('Erreur', error);
                return res.status(500).json({ success: false, message: 'Erreur interne' });
            });

        return null
    }
}