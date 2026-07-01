import { Request, Response } from "express";
import { CountOptions, FindOptions, InferAttributes } from "sequelize";
import { RolesUtilisateur } from "../../../core/enums/RolesUtilisateur";
import { Parcours } from "../models/Parcours";
import { PrerequisParcours } from "../models/PrerequisParcours";

export default class ParcoursController {

    constructor() { }

    static async getAllParcours(req: Request, res: Response): Promise<Response> {
        let options: FindOptions<InferAttributes<Parcours>> = {
            // include: [{model: Categorie, as: 'categorie'}, {model: NiveauEtude, as: 'niveauEtude'}, {model: DeboucheParcours, as: "debouchesParcours"}]
            include: [Parcours.associations.categorie, Parcours.associations.niveauEtude]
        }

        try {
            let parcours: Parcours[];
            parcours = await Parcours.findAll(options);

            return res.status(200).send(parcours);
        } catch (error) {
            return res.status(500).json({ success: false, error: error });
        }
    }

    static async getParcours(req: Request, res: Response): Promise<Response> {
        let options: FindOptions<InferAttributes<Parcours>> = {}
        options = { where: { id: req.params.id }, include: [Parcours.associations.categorie, Parcours.associations.niveauEtude, Parcours.associations.debouchesParcours, {model: PrerequisParcours, as: 'prerequisParcours', include: [PrerequisParcours.associations.matierePrerequis, PrerequisParcours.associations.niveauEtude]}] }

        try {
            const parcours: Parcours | null = await Parcours.findOne(options);

            if (parcours == null)
                return res.status(404).json({ success: false, message: "Filière non trouvée" });

            return res.status(200).send(parcours);
        } catch (error) {
            return res.status(500).json({ success: false, error: error });
        }
    }

    static async createParcours(req: Request, res: Response): Promise<Response | null> {

        if ((req as any).utilisateurRole == RolesUtilisateur.APPRENANT) {
            return res.status(403).json({ success: false })
        }

        let parcours: Parcours | null = await Parcours.findOne({ where: { titre: req.body.titre } });

        if (parcours != null) {
            return res.status(400).json({ success: false, alreadyExists: true });
        }
        else {
            // let parcours: Parcours = JSON.parse(req.body.parcours)
            // await Parcours.create({
            //     titre: req.body.titre,
            //     dureeDeFormation: req.body.dureeDeFormation,
            //     image: req.file?.filename,
            //     videoExplicative: req.body.videoExplicative,
            //     contenu: req.body.contenu,
            //     debouchesParcours: req.body.debouchesParcours,
            //     categorieId: req.body.categorieId,
            //     niveauEtudeId: req.body.niveauEtudeId,
            // },
            //     { include: [Parcours.associations.debouchesParcours] }
            // )
            parcours = new Parcours();
            parcours.titre = req.body.titre
            parcours.dureeDeFormation = req.body.dureeDeFormation

            let files: any = req.files
            if(files) {
                if(files['image']) {
                    let imageFile: Express.Multer.File | undefined = (files['image'])[0] as Express.Multer.File | undefined
                    if(imageFile) {
                        parcours.image = imageFile.filename
                    }
                }

                if(files['video']) {
                    let videoFile: Express.Multer.File | undefined = (files['video'])[0] as Express.Multer.File | undefined
                    if(videoFile) {
                        parcours.videoExplicative = videoFile.filename
                    }
                }
            }
            parcours.contenu = req.body.contenu
            parcours.categorieId = req.body.categorieId
            parcours.niveauEtudeId = req.body.niveauEtudeId
            parcours.type = req.body.type

            await parcours.save()
                .then(async (parcours) => {
                    // await req.body.prerequisParcours.forEach(async (prerequis: PrerequisParcours) => {
                    //     await PrerequisParcours.create({
                    //         noteRequise: prerequis.noteRequise,
                    //         periodeEvaluation: prerequis.periodeEvaluation,
                    //         typeEvaluation: prerequis.typeEvaluation,
                    //         parcoursId: parcours.id,
                    //         niveauEtudeId: prerequis.niveauEtudeId,
                    //         matierePrerequisId: prerequis.matierePrerequisId,
                    //     })
                    // })
                    
                    return res.status(201).send(parcours)
                })
                .catch((error) => {
                    console.log(error);
                    
                    return res.status(400).json({ success: false, error: error });
                });
        }

        return null
    }

    static async updateParcours(req: Request, res: Response): Promise<Response | null> {
        let options: FindOptions<InferAttributes<Parcours>> = {}
        if ((req as any).utilisateurRole == RolesUtilisateur.APPRENANT) {
            return res.status(403).json({ success: false })
        }
        else if ((req as any).utilisateurRole == RolesUtilisateur.INSTITUTION) {
            options = { where: { id: req.params.id } }
        }

        let parcours: Parcours | null = await Parcours.findOne(options);
        if (parcours != null) {
            if (req.body.titre) {
                if (await Parcours.findOne({ where: { titre: req.body.titre } })) {
                    return res.status(400).json({ success: false, message: "Filière déjà existante" });
                }
            }

            await parcours.update({
                titre: req.body.titre,
                dureeDeFormation: req.body.dureeDeFormation,
                videoExplicative: req.body.videoExplicative,
                categorieId: req.body.categorieId,
                niveauEtudeId: req.body.niveauEtudeId,
                type: req.body.type,
                contenu: req.body.contenu,
            })
                .then(async (parcours) => {
                    return res.status(200).send(parcours);
                })
                .catch((error) => {
                    return res.status(400).json({ success: false, error: error });
                });
        }
        else {
            return res.status(404).json({ success: false, message: "Parcours non trouvé" });
        }

        return null
    }

    static async deleteParcours(req: Request, res: Response): Promise<Response | null> {
        let options: FindOptions<InferAttributes<Parcours>> = {}
        if ((req as any).utilisateurRole == RolesUtilisateur.APPRENANT) {
            return res.status(403).json({ success: false })
        }
        else if ((req as any).utilisateurRole == RolesUtilisateur.INSTITUTION) {
            options = { where: { id: req.params.id } }
        }

        let parcours: Parcours | null = await Parcours.findOne({ where: { id: req.params.id } });
        if (parcours) {
            await parcours.destroy()
                .then(() => {
                    return res.status(200).json({ success: true, message: "Filière supprimée" });
                })
                .catch((error) => {
                    return res.status(500).json({ success: false, error: error });
                });
        }
        else {
            return res.status(404).json({ success: false, message: "Parcours non trouvé" });
        }

        return null
    }

    static async getCount(req: Request, res: Response): Promise<Response | null> {
        let options: CountOptions<InferAttributes<Parcours>> = {}

        if ((req as any).utilisateurRole == RolesUtilisateur.APPRENANT) {
            return res.status(403).json({ success: false })
        }

        await Parcours.count(options)
            .then((value) => {
                return res.status(200).json({ success: true, count: value });
            })
            .catch((error) => {
                return res.status(500).json({ success: false, error: error });
            });

        return null
    }
}