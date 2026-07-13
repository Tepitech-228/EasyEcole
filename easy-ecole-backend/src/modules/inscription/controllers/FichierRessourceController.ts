import { Request, Response } from "express";
import * as path from "path";
import * as fs from "fs/promises";
import { CountOptions, FindOptions, InferAttributes } from "sequelize";
import { RolesUtilisateur } from "../../../core/enums/RolesUtilisateur";
import { FichierRessource } from "../models/FichierRessource";

export default class FichierRessourceController {

    constructor() { }

    static async getAllFichierRessources(req: Request, res: Response): Promise<Response> {
        let options: FindOptions<InferAttributes<FichierRessource>> = {
            include: [FichierRessource.associations.ressource]
        }

        try {
            let fichiersRessource: FichierRessource[];
            fichiersRessource = await FichierRessource.findAll(options);

            return res.status(200).send(fichiersRessource);
        } catch (error) {
            return res.status(500).json({ success: false, error: error });
        }
    }

    static async getFichierRessource(req: Request, res: Response): Promise<Response> {
        let options: FindOptions<InferAttributes<FichierRessource>> = {}
        options = { where: { id: req.params.id }, include: [FichierRessource.associations.ressource] }

        try {
            const fichierRessource: FichierRessource | null = await FichierRessource.findOne(options);

            if (fichierRessource == null)
                return res.status(404).json({ success: false, message: "FichierRessource non trouvé" });

            return res.status(200).send(fichierRessource);
        } catch (error) {
            return res.status(500).json({ success: false, error: error });
        }
    }

    static async downloadFichierRessource(req: Request, res: Response): Promise<Response | null> {
        let options: FindOptions<InferAttributes<FichierRessource>> = {}
        options = { where: { id: req.params.id }, include: [FichierRessource.associations.ressource] }

        try {
            const fichierRessource: FichierRessource | null = await FichierRessource.findOne(options);

            if (fichierRessource == null)
                return res.status(404).json({ success: false, message: "FichierRessource non trouvé" });

            let nomFichierRessource: string = fichierRessource.fichier!
            if(fichierRessource.titre) {
                if(path.extname(fichierRessource.titre) == '') {
                    nomFichierRessource = fichierRessource.titre + path.extname(fichierRessource.fichier!)
                }
                else {
                    nomFichierRessource = fichierRessource.titre
                }
            }
            const fichierRessourcePath = path.resolve('public/cours/ressources/' + fichierRessource.fichier)
            const data = await fs.readFile(fichierRessourcePath);

            res.setHeader('Content-Disposition', `attachment; filename=${nomFichierRessource}`);
            res.setHeader('Content-Type', 'application/octet-stream');
            return res.status(200).send(data);
        } catch (error) {
            return res.status(500).json({ success: false, error: error });
        }
    }

    static async createFichierRessource(req: Request, res: Response): Promise<Response | null> {

        if ((req as any).utilisateurRole != RolesUtilisateur.ENSEIGNANT) {
            return res.status(403).json({ success: false })
        }

        let files: any = req.files
        if (files && files['fichier']) {
            let fichier: Express.Multer.File | undefined = (files['fichier'])[0] as Express.Multer.File | undefined

            if (fichier) {
                let fichierRessource: FichierRessource = new FichierRessource();
                fichierRessource.titre = req.body.titre
                fichierRessource.description = req.body.description
                fichierRessource.fichier = fichier.filename
                fichierRessource.ressourceId = req.body.ressourceId

                await fichierRessource.save()
                    .then((fichierRessource) => {
                        return res.status(201).send(fichierRessource);
                    })
                    .catch((error) => {
                        return res.status(400).json({ success: false, error: error });
                    });
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

    static async updateFichierRessource(req: Request, res: Response): Promise<Response | null> {
        let options: FindOptions<InferAttributes<FichierRessource>> = {}
        if ((req as any).utilisateurRole != RolesUtilisateur.ENSEIGNANT) {
            return res.status(403).json({ success: false })
        }
        else {
            options = { where: { id: req.params.id } }
        }

        let fichierRessource: FichierRessource | null = await FichierRessource.findOne(options);
        if (fichierRessource != null) {
            await fichierRessource.update({
                titre: req.body.titre,
                description: req.body.description,
                fichier: req.body.fichier,
                ressourceId: req.body.ressourceId,
            })
                .then(async (fichierRessource) => {
                    return res.status(200).send(fichierRessource);
                })
                .catch((error) => {
                    return res.status(400).json({ success: false, error: error });
                });
        }
        else {
            return res.status(404).json({ success: false, message: "FichierRessource non trouvé" });
        }

        return null
    }

    static async deleteFichierRessource(req: Request, res: Response): Promise<Response | null> {
        let options: FindOptions<InferAttributes<FichierRessource>> = {}
        if ((req as any).utilisateurRole != RolesUtilisateur.ENSEIGNANT) {
            return res.status(403).json({ success: false })
        }
        else {
            options = { where: { id: req.params.id } }
        }

        let fichierRessource: FichierRessource | null = await FichierRessource.findOne({ where: { id: req.params.id } });
        if (fichierRessource) {
            await fichierRessource.destroy()
                .then(() => {
                    return res.status(200).json({ success: true, message: "FichierRessource supprimé" });
                })
                .catch((error) => {
                    return res.status(500).json({ success: false, error: error });
                });
        }
        else {
            return res.status(404).json({ success: false, message: "FichierRessource non trouvé" });
        }

        return null
    }

    static async getCount(req: Request, res: Response): Promise<Response | null> {
        let options: CountOptions<InferAttributes<FichierRessource>> = {}

        if ((req as any).utilisateurRole != RolesUtilisateur.ENSEIGNANT) {
            return res.status(403).json({ success: false })
        }

        await FichierRessource.count(options)
            .then((value) => {
                return res.status(200).json({ success: true, count: value });
            })
            .catch((error) => {
                return res.status(500).json({ success: false, error: error });
            });

        return null
    }
}