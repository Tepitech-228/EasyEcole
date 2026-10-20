import { Request, Response } from "express";
import { CountOptions, FindOptions, InferAttributes, Op } from "sequelize";
import { RolesUtilisateur } from "../../../core/enums/RolesUtilisateur";
import { Enseignant } from "../models/Enseignant";
import { AdresseEnseignant } from "../models/AdresseEnseignant";
import { Cours } from "../../inscription/models/Cours";
import * as path from "path";
import * as fs from "fs";
import { EnseignantBadgeService } from "../services/EnseignantBadgeService";
import { SiteUtilisateur } from "../models/SiteUtilisateur";

export default class EnseignantController {

    constructor() { }

    static async getAllEnseignants(req: Request, res: Response): Promise<Response> {
        let options: FindOptions<InferAttributes<Enseignant>> = {
            include: [Enseignant.associations.utilisateur]
        }

        try {
            const etablissementId = (req as any).etablissementId;
            if (etablissementId) {
                const affectations = await SiteUtilisateur.findAll({
                    where: { etablissementId },
                    attributes: ['utilisateurId']
                });
                options.where = {
                    utilisateurId: { [Op.in]: affectations.map(affectation => affectation.utilisateurId) }
                } as any;
            } else if ((req as any).utilisateurRole !== RolesUtilisateur.ADMIN) {
                return res.status(403).json({ success: false, message: "Aucun site actif sélectionné" });
            }

            let enseignants: Enseignant[];
            enseignants = await Enseignant.findAll(options);

            return res.status(200).send(enseignants);
        } catch (error) {
            console.error('Erreur', error);
            return res.status(500).json({ success: false, message: 'Erreur interne' });
        }
    }

    static async getEnseignant(req: Request, res: Response): Promise<Response> {
        let options: FindOptions<InferAttributes<Enseignant>> = {}
        if ((req as any).utilisateurRole == RolesUtilisateur.ENSEIGNANT) {
            options = { where: { utilisateurId: (req as any).utilisateurId }, }
        }
        else if ((req as any).utilisateurRole == RolesUtilisateur.INSTITUTION) {
            let enseignantId = req.params.id

            if (enseignantId) {
                options = { where: { id: req.params.id } }
            }
            else {
                options = { where: { utilisateurId: req.body.utilisateurId } }
            }
        }
        options.include = [
            Enseignant.associations.adresse,
            Enseignant.associations.utilisateur,
            { association: Enseignant.associations.cours, include: [Cours.associations.classe] }
        ]

        try {
            const enseignant: Enseignant | null = await Enseignant.findOne(options);

            if (enseignant == null)
                return res.sendStatus(204)

            return res.status(200).send(enseignant);
        } catch (error) {
            console.error('Erreur', error);
            return res.status(500).json({ success: false, message: 'Erreur interne' });
        }
    }

    static async updateEnseignant(req: Request, res: Response): Promise<Response | null> {
        let options: FindOptions<InferAttributes<Enseignant>> = {}

        if ((req as any).utilisateurRole == RolesUtilisateur.ENSEIGNANT) {
            options = { where: { utilisateurId: (req as any).utilisateurId } }
        }
        else if ((req as any).utilisateurRole == RolesUtilisateur.INSTITUTION) {
            options = { where: { utilisateurId: req.body.utilisateurId } }
        }

        let enseignant: Enseignant | null = await Enseignant.findOne(options);
        req.body.utilisateurId = (req as any).utilisateurRole == RolesUtilisateur.ENSEIGNANT ? (req as any).utilisateurId : req.body.utilisateurId
        // console.log((req as any).utilisateurId)

        if (enseignant != null) {
            await enseignant.update({
                matricule: req.body.matricule,
                gradeAcademique: req.body.gradeAcademique,
                specialite: req.body.specialite,
                statut: req.body.statut,
                fonctionAdministrative: req.body.fonctionAdministrative,
                anneeExperience: req.body.anneeExperience,
                heureTheoriqueAnnuelle: req.body.heureTheoriqueAnnuelle,
                heureReelleAnnuelle: req.body.heureReelleAnnuelle,
                cni: req.body.cni,
                nifOtr: req.body.nifOtr,
                dateNaissance: req.body.dateNaissance,
                lieuNaissance: req.body.lieuNaissance,
                sexe: ['M', 'F', 'Autre'].includes(req.body.sexe) ? req.body.sexe : 'M',
                nationalite: req.body.nationalite,
                contact: req.body.contact,
                plusHautDiplome: req.body.plusHautDiplome,
                statutHandicap: req.body.statutHandicap,
                natureHandicap: req.body.natureHandicap,
            })
                .then(async (enseignant) => {
                    await AdresseEnseignant.update(req.body.adresse, { where: { enseignantId: enseignant.id } })

                    if (enseignant.utilisateurId && req.body.utilisateur) {
                        const { Utilisateur } = require('../models/Utilisateur')
                        await Utilisateur.update(req.body.utilisateur, { where: { id: enseignant.utilisateurId } })
                    }

                    await EnseignantBadgeService.ensureIdentity(enseignant, (req as any).etablissementId || null);
                    return res.status(200).send(enseignant);
                })
                .catch((error) => {
                    return res.status(400).json({ success: false, error: error });
                });
        }
        else {
            const enseignant = await Enseignant.create({
                fonctionAdministrative: req.body.fonction,
                dateNaissance: req.body.dateNaissance,
                lieuNaissance: req.body.lieuNaissance,
                adresse: req.body.adresse,
                utilisateurId: req.body.utilisateurId
            }, {
                include: [
                    Enseignant.associations.adresse,
                ]
            });
            const badge = await EnseignantBadgeService.ensureIdentity(
                enseignant,
                (req as any).etablissementId || null,
            );
            return res.status(201).send({ ...enseignant.toJSON(), ...badge });
        }

        return null
    }

    static async updatePhoto(req: Request, res: Response): Promise<Response | null> {
        let options: FindOptions<InferAttributes<Enseignant>> = {}
        if ((req as any).utilisateurRole == RolesUtilisateur.ENSEIGNANT) {
            options = { where: { utilisateurId: (req as any).utilisateurId } }
        }
        else if ((req as any).utilisateurRole == RolesUtilisateur.INSTITUTION
            || (req as any).utilisateurRole == RolesUtilisateur.ADMIN) {
            // L'institution / l'admin peut renseigner la photo d'un prof (création / fiche),
            // indispensable pour l'affichage photo au terminal de pointage.
            const enseignantId = req.body.enseignantId || req.params.id
            if (!enseignantId) {
                return res.status(400).json({ success: false, message: "enseignantId requis" })
            }
            options = { where: { id: enseignantId } }
        }
        else {
            return res.status(403).json({ success: false })
        }

        let files: any = req.files
        if (files && files['photo']) {
            let photo: Express.Multer.File | undefined = (files['photo'])[0] as Express.Multer.File | undefined

            if (photo) {
                let enseignant: Enseignant | null = await Enseignant.findOne(options);
                if (enseignant != null) {
                    try {
                        await enseignant.update({ photo: photo.filename });
                    } catch (error) {
                        console.error(`[Profil] Échec d’enregistrement de la photo de l’enseignant ${enseignant.id}:`, error);
                        return res.status(500).json({ success: false, message: "La photo de l’enseignant n’a pas pu être enregistrée." });
                    }
                    try {
                        const { default: HikvisionEnrollmentService } = await import("../../inscription/services/HikvisionEnrollmentService");
                        const enrollmentCount = enseignant.utilisateurId
                            ? await HikvisionEnrollmentService.enqueueStaffProfile(Number(enseignant.utilisateurId))
                            : 0;
                        return res.status(200).json({ success: true, enrollmentQueued: enrollmentCount > 0 });
                    } catch (error) {
                        console.error(`[Hikvision] Photo enregistrée mais enrôlement impossible pour l’enseignant ${enseignant.id}:`, error);
                        return res.status(500).json({
                            success: false,
                            message: "La photo a été reçue, mais l’enrôlement Hikvision n’a pas pu être planifié."
                        });
                    }
                }
                else {
                    return res.status(404).json({ success: false, message: "Enseignant non trouvé" });
                }
            }
            else {
                return res.status(400).json({ success: false });
            }
        }
        else {
            return res.status(400).json({ success: false });
        }
    }

    static async deleteEnseignant(req: Request, res: Response): Promise<Response | null> {
        let options: FindOptions<InferAttributes<Enseignant>> = {}
        if ((req as any).utilisateurRole == RolesUtilisateur.ENSEIGNANT) {
            return res.status(403).json({ success: false })
        }
        else if ((req as any).utilisateurRole == RolesUtilisateur.ENSEIGNANT) {
            options = { where: { id: req.params.id } }
        }

        let enseignant: Enseignant | null = await Enseignant.findOne({ where: { id: req.params.id } });
        if (enseignant) {
            await enseignant.destroy()
                .then(() => {
                    return res.status(200).json({ success: true, message: "Enseignant supprimé" });
                })
                .catch((error) => {
                    console.error('Erreur', error);
                    return res.status(500).json({ success: false, message: 'Erreur interne' });
                });
        }
        else {
            return res.status(404).json({ success: false, message: "Enseignant non trouvé" });
        }

        return null
    }

    static async generateQrCodes(req: Request, res: Response): Promise<Response | null> {
        try {
            let whereClause: any = {}
            if (req.body.enseignantId) {
                whereClause.id = req.body.enseignantId
            }

            const enseignants: Enseignant[] = await Enseignant.findAll({
                where: whereClause,
                include: [Enseignant.associations.utilisateur]
            })

            const results: { enseignantId: string, userId: string, matricule: string, qrCode: string }[] = []

            for (const enseignant of enseignants) {
                if (!enseignant.utilisateur) continue

                const userId = String(enseignant.utilisateur.id)
                const badge = await EnseignantBadgeService.ensureIdentity(enseignant)

                results.push({
                    enseignantId: enseignant.id,
                    userId: userId,
                    matricule: badge.matricule,
                    qrCode: badge.qrCode,
                })
            }

            return res.status(200).json({ success: true, data: results })
        } catch (error) {
            console.error('Erreur', error);
            return res.status(500).json({ success: false, message: 'Erreur interne' });
        }
    }

    static async getCount(req: Request, res: Response): Promise<Response | null> {
        let options: CountOptions<InferAttributes<Enseignant>> = {}

        if ((req as any).utilisateurRole == RolesUtilisateur.ENSEIGNANT) {
            return res.status(403).json({ success: false })
        }

        await Enseignant.count(options)
            .then((value) => {
                return res.status(200).json({ success: true, count: value });
            })
            .catch((error) => {
                console.error('Erreur', error);
                return res.status(500).json({ success: false, message: 'Erreur interne' });
            });

        return null
    }

    static async getQrCode(req: Request, res: Response): Promise<Response | null> {
        const { fileName } = req.params;
        if (!/^[\w-]+\.png$/i.test(fileName)) {
            return res.status(400).json({ success: false, message: 'Nom de QR code invalide' });
        }

        const dir = path.resolve(process.cwd(), 'storage', 'qr-codes', 'enseignants');
        const filePath = path.join(dir, fileName);

        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ success: false, message: 'QR code non trouvé' });
        }

        res.setHeader('Content-Type', 'image/png');
        res.sendFile(filePath);
        return null;
    }
}