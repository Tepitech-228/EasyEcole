import { Request, Response } from "express";
import { unlinkSync } from "fs";
import { CountOptions, FindOptions, InferAttributes } from "sequelize";
import { RolesUtilisateur } from "../../../core/enums/RolesUtilisateur";
import { DossierInscription } from "../models/DossierInscription";
import { DemandeInscriptionDossier } from "../models/DemandeInscriptionDossier";

export default class DossierInscriptionController {

    constructor() { }

    static async getAllDossiersInscription(req: Request, res: Response): Promise<Response> {
        let options: FindOptions<InferAttributes<DossierInscription>> = {}

        try {
            let dossiersInscription: DossierInscription[];
            dossiersInscription = await DossierInscription.findAll(options);

            return res.status(200).send(dossiersInscription);
        } catch (error) {
            return res.status(500).json({ success: false, error: error });
        }
    }

    static async getDossierInscription(req: Request, res: Response): Promise<Response> {
        let options: FindOptions<InferAttributes<DossierInscription>> = {}
        options = { where: { id: req.params.id } }

        try {
            const dossierInscription: DossierInscription | null = await DossierInscription.findOne(options);

            if (dossierInscription == null)
                return res.status(404).json({ success: false, message: "Dossier non trouvée" });

            return res.status(200).send(dossierInscription);
        } catch (error) {
            return res.status(500).json({ success: false, error: error });
        }
    }

    static async createDossierInscription(req: Request, res: Response): Promise<Response | null> {
        let options: FindOptions<InferAttributes<DossierInscription>> = {}
        if ((req as any).utilisateurRole == RolesUtilisateur.INSTITUTION) {
            options = { where: { titre: req.body.titre, sessionId: req.body.sessionId } }
        }
        else {
            return res.status(403).json({ success: false })
        }

        let dossierInscription: DossierInscription | null = await DossierInscription.findOne(options);
        if (dossierInscription == null) {
            let dossierInscription: DossierInscription = new DossierInscription();
            dossierInscription.titre = req.body.titre
            dossierInscription.description = req.body.description
            dossierInscription.tailleMax = req.body.tailleMax
            dossierInscription.sessionId = req.body.sessionId

            await dossierInscription.save()
                .then(async (dossierInscription) => {
                    return res.status(201).send(dossierInscription);
                })
                .catch((error) => {
                    return res.status(400).json({ success: false, error: error });
                });
        }
        else {
            return res.status(400).json({ alreadyExists: true });
        }

        return null
    }

    static async uploadDossierInscription(req: Request, res: Response): Promise<Response | null> {
        let options: FindOptions<InferAttributes<DemandeInscriptionDossier>> = {}
        if ((req as any).utilisateurRole == RolesUtilisateur.APPRENANT) {
            options = { where: { dossierId: req.body.dossierId, demandeId: req.body.demandeId } }
        }
        else if ((req as any).utilisateurRole == RolesUtilisateur.INSTITUTION) {
            return res.status(403).json({ success: false })
        }


        let files: any = req.files
        if (files && files['fichier']) {
            let fichier: Express.Multer.File | undefined = (files['fichier'])[0] as Express.Multer.File | undefined

            if (fichier) {
                let demandeInscriptionDossier: DemandeInscriptionDossier | null = await DemandeInscriptionDossier.findOne(options);
                if (demandeInscriptionDossier == null) {
                    let demandeInscriptionDossier: DemandeInscriptionDossier = new DemandeInscriptionDossier()
                    demandeInscriptionDossier.nomFichier = fichier.filename
                    demandeInscriptionDossier.dossierId = req.body.dossierId
                    demandeInscriptionDossier.demandeId = req.body.demandeId

                    await demandeInscriptionDossier.save()
                        .then(async (demandeInscriptionDossier) => {
                            return res.status(201).send(demandeInscriptionDossier);
                        })
                        .catch((error) => {
                            return res.status(400).json({ success: false, error: error });
                        });
                }
                else {
                    //TODO:: remove old file
                    await demandeInscriptionDossier.update({
                        nomFichier: fichier.filename,
                    })
                        .then(async (demandeInscriptionDossier) => {
                            // unlinkSync
                            return res.status(200).send(demandeInscriptionDossier);
                        })
                        .catch((error) => {
                            return res.status(400).json({ success: false, error: error });
                        });
                }
            }
            else {
                return res.status(400).json({ success: false });
            }
        }
        else {
            return res.status(400).json({ success: false });
        }

        return null
    }

    static async updateDossierInscription(req: Request, res: Response): Promise<Response | null> {
        let options: FindOptions<InferAttributes<DossierInscription>> = {}
        if ((req as any).utilisateurRole == RolesUtilisateur.APPRENANT) {
            return res.status(403).json({ success: false })
        }
        else if ((req as any).utilisateurRole == RolesUtilisateur.INSTITUTION) {
            options = { where: { id: req.params.id } }
        }

        let dossierInscription: DossierInscription | null = await DossierInscription.findOne(options);
        if (dossierInscription != null) {

            if (dossierInscription.titre != req.body.titre && await DossierInscription.findOne({ where: { titre: req.body.titre, sessionId: req.body.sessionId } }) != null) {
                return res.status(400).json({ success: false, alreadyExists: true });
            }
            else {

                await dossierInscription.update({
                    titre: req.body.titre,
                    tailleMax: req.body.tailleMax,
                    description: req.body.description,
                })
                    .then(async (dossierInscription) => {
                        return res.status(200).send(dossierInscription);
                    })
                    .catch((error) => {
                        return res.status(400).json({ success: false, error: error });
                    });
            }
        }
        else {
            return res.status(404).json({ success: false, message: "Dossier d'inscription non trouvé" });
        }

        return null
    }

    static async deleteDossierInscription(req: Request, res: Response): Promise<Response | null> {
        let options: FindOptions<InferAttributes<DossierInscription>> = {}
        if ((req as any).utilisateurRole == RolesUtilisateur.INSTITUTION) {
            options = { where: { id: req.params.id } }
        }
        else {
            return res.status(403).json({ success: false })
        }

        let dossierInscription: DossierInscription | null = await DossierInscription.findOne({ where: { id: req.params.id } });
        if (dossierInscription) {
            await dossierInscription.destroy()
                .then(() => {
                    return res.status(200).json({ success: true, message: "Dossier supprimée" });
                })
                .catch((error) => {
                    return res.status(500).json({ success: false, error: error });
                });
        }
        else {
            return res.status(404).json({ success: false, message: "Dossier non trouvée" });
        }

        return null
    }

    static async getCount(req: Request, res: Response): Promise<Response | null> {
        let options: CountOptions<InferAttributes<DossierInscription>> = {}

        if ((req as any).utilisateurRole == RolesUtilisateur.APPRENANT) {
            return res.status(403).json({ success: false })
        }

        await DossierInscription.count(options)
            .then((value) => {
                return res.status(200).json({ success: true, count: value });
            })
            .catch((error) => {
                return res.status(500).json({ success: false, error: error });
            });

        return null
    }
}