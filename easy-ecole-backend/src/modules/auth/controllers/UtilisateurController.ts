import { Request, Response } from "express";
import { CountOptions, FindOptions, InferAttributes, Op } from "sequelize";
import { RolesUtilisateur } from "../../../core/enums/RolesUtilisateur";
import { Utilisateur } from "../models/Utilisateur";
import { PersonnelAdministratif } from "../models/PersonnelAdministratif";
import { Enseignant } from "../models/Enseignant";
import { Apprenant } from "../models/Apprenant";
import * as bcrypt from 'bcrypt';

export default class UtilisateurController {

    constructor() { }

    private static roleToFonction(role: string): string {
        const map: { [key: string]: string } = {
            [RolesUtilisateur.PERSONNEL_ADMINISTRATIF]: 'Personnel Administratif',
            [RolesUtilisateur.CAISSIER_BANQUE]: 'Caissier Banque',
            [RolesUtilisateur.COMITE_ORIENTATION]: "Comité d'Orientation",
            [RolesUtilisateur.CABINET_COMPTABLE]: 'Cabinet Comptable',
            [RolesUtilisateur.RESSOURCES_HUMAINES]: 'Ressources Humaines',
            [RolesUtilisateur.ESA_COMPTA]: 'ESA Compta',
            [RolesUtilisateur.SECRETAIRE]: 'Secrétaire',
        };
        return map[role] || role;
    }

    static async getAllUtilisateurs(req: Request, res: Response): Promise<Response> {
        if ((req as any).utilisateurRole == RolesUtilisateur.APPRENANT) {
            return res.status(403).json({ success: false })
        }

        let options: FindOptions<InferAttributes<Utilisateur>> = {
            attributes: ['id', 'nom', 'prenoms', 'identifiant', 'email', 'role', 'contact', 'photoDeProfil', 'createdAt']
        }

        try {
            const utilisateurs = await Utilisateur.findAll(options);
            return res.status(200).send(utilisateurs);
        } catch (error) {
            return res.status(500).json({ success: false, message: "Erreur interne du serveur" });
        }
    }

    static async getUtilisateur(req: Request, res: Response): Promise<Response> {
        let options: FindOptions<InferAttributes<Utilisateur>> = {}
        options = { 
            where: { id: (req as any).utilisateurId },
            attributes: ['nom', 'prenoms', 'identifiant', 'email', 'contact', 'photoDeProfil'],
            include: [Utilisateur.associations.apprenant, Utilisateur.associations.institution, Utilisateur.associations.caissierBanque]
        }

        try {
            const utilisateur: Utilisateur | null = await Utilisateur.findOne(options);

            if (utilisateur == null)
                return res.status(404).json({ success: false, message: "Utilisateur non trouve" });

            return res.status(200).send(utilisateur);
        } catch (error) {
            return res.status(500).json({ success: false, message: "Erreur interne du serveur" });
        }
    }

    static async updateUtilisateur(req: Request, res: Response): Promise<Response | null> {
        let options: FindOptions<InferAttributes<Utilisateur>> = { where: { id: (req as any).utilisateurId } }

        let utilisateur: Utilisateur | null = await Utilisateur.findOne(options);
        if (utilisateur != null) {
            let nomPrenomsAlreadyUsed: boolean = false
            if (utilisateur.nom != req.body.nom || utilisateur.prenoms != req.body.prenoms) {
                nomPrenomsAlreadyUsed = await Utilisateur.findOne({ where: { [Op.and]: [{ nom: req.body.nom }, { prenoms: req.body.prenoms }] } }) != null
            }

            if (nomPrenomsAlreadyUsed) {
                return res.status(400).json({ nomPrenomsAlreadyUsed: nomPrenomsAlreadyUsed });
            }

            await utilisateur.update({
                nom: req.body.nom,
                prenoms: req.body.prenoms,
                contact: req.body.contact,
            })
                .then(async (utilisateur) => {
                    return res.status(200).json({ success: true });
                })
                .catch((error) => {
                    return res.status(400).json({ success: false, message: "Erreur lors de la mise à jour" });
                });

            return null
        }
        else {
            return res.status(404).json({ success: false, message: "Utilisateur non trouvé" });
        }
    }

    static async adminUpdateUtilisateur(req: Request, res: Response): Promise<Response> {
        try {
            const role = (req as any).utilisateurRole;
            if (role !== RolesUtilisateur.ADMIN && role !== RolesUtilisateur.INSTITUTION) {
                return res.status(403).json({ success: false, message: "Réservé à l'administration" });
            }

            const utilisateur = await Utilisateur.findByPk(req.params.id);
            if (!utilisateur) {
                return res.status(404).json({ success: false, message: "Utilisateur non trouvé" });
            }

            const updateData: any = {};
            if (req.body.nom !== undefined) updateData.nom = req.body.nom;
            if (req.body.prenoms !== undefined) updateData.prenoms = req.body.prenoms;
            if (req.body.email !== undefined) updateData.email = req.body.email;
            if (req.body.identifiant !== undefined) updateData.identifiant = req.body.identifiant;
            if (req.body.contact !== undefined) updateData.contact = req.body.contact;
            if (req.body.role !== undefined) updateData.role = req.body.role;
            if (req.body.motDePasse) updateData.motDePasse = bcrypt.hashSync(req.body.motDePasse, 10);

            await utilisateur.update(updateData);
            return res.status(200).json({ success: true, message: "Utilisateur mis à jour" });
        } catch (error) {
            return res.status(500).json({ success: false, message: "Erreur interne du serveur" });
        }
    }

    static async adminCreateUtilisateur(req: Request, res: Response): Promise<Response> {
        try {
            const role = (req as any).utilisateurRole;
            if (role !== RolesUtilisateur.ADMIN && role !== RolesUtilisateur.INSTITUTION) {
                return res.status(403).json({ success: false, message: "Réservé à l'administration" });
            }

            const existe = await Utilisateur.findOne({
                where: { [Op.or]: [{ email: req.body.email }, { identifiant: req.body.identifiant }] }
            });
            if (existe) {
                return res.status(400).json({ success: false, message: "Email ou identifiant déjà utilisé" });
            }

            if (!req.body.motDePasse || req.body.motDePasse.length < 6) {
                return res.status(400).json({ success: false, message: "Mot de passe requis (min 6 caractères)" });
            }

            const utilisateur = await Utilisateur.create({
                nom: req.body.nom,
                prenoms: req.body.prenoms,
                email: req.body.email,
                identifiant: req.body.identifiant,
                motDePasse: bcrypt.hashSync(req.body.motDePasse, 10),
                role: req.body.role || RolesUtilisateur.APPRENANT,
                contact: req.body.contact || null,
            });

            // Création du profil lié selon le rôle
            // Hors apprenant/enseignant/parent → tous = PersonnelAdministratif (fonction = rôle)
            const userRole = req.body.role || RolesUtilisateur.APPRENANT;
            const isStaff =![
                RolesUtilisateur.PERSONNEL_ADMINISTRATIF,
                RolesUtilisateur.CAISSIER_BANQUE,
                RolesUtilisateur.COMITE_ORIENTATION,
                RolesUtilisateur.CABINET_COMPTABLE,
                RolesUtilisateur.RESSOURCES_HUMAINES,
                RolesUtilisateur.ESA_COMPTA,
                RolesUtilisateur.SECRETAIRE,
            ].includes(userRole);

            try {
                if (userRole === RolesUtilisateur.APPRENANT) {
                    await Apprenant.create({
                        utilisateurId: utilisateur.id,
                        dateNaissance: req.body.dateNaissance || new Date(),
                        lieuNaissance: req.body.lieuNaissance || '',
                        sexe: req.body.sexe || 'M',
                        nationalite: req.body.nationalite || 'Ivoirienne',
                        cni: req.body.cni || null,
                        statutEtudiant: req.body.statutEtudiant || 'nouveau',
                        periode: req.body.periode || 'matin',
                    });
                } else if (userRole === RolesUtilisateur.ENSEIGNANT) {
                    await Enseignant.create({
                        utilisateurId: utilisateur.id,
                        specialite: req.body.specialite || null,
                        gradeAcademique: req.body.gradeAcademique || null,
                        matricule: req.body.matricule || null,
                        statut: req.body.statut || 'Permanent',
                        fonctionAdministrative: req.body.fonctionAdministrative || null,
                        anneeExperience: req.body.anneeExperience || 0,
                        cni: req.body.cni || null,
                        dateNaissance: req.body.dateNaissance || null,
                        lieuNaissance: req.body.lieuNaissance || null,
                        sexe: req.body.sexe || 'M',
                        nationalite: req.body.nationalite || 'Ivoirienne',
                        contact: req.body.contact || null,
                        plusHautDiplome: req.body.plusHautDiplome || null,
                    });
                } else if (isStaff) {
                    // Tous les rôles staff → profil PersonnelAdministratif, fonction = libellé du rôle
                    await PersonnelAdministratif.create({
                        utilisateurId: utilisateur.id,
                        fonction: req.body.fonction || this.roleToFonction(userRole),
                        matricule: req.body.matricule || null,
                        statut: req.body.statut || 'Permanent',
                        directionService: req.body.directionService || null,
                        cni: req.body.cni || null,
                        dateNaissance: req.body.dateNaissance || null,
                        lieuNaissance: req.body.lieuNaissance || null,
                        sexe: req.body.sexe || 'M',
                        nationalite: req.body.nationalite || 'Ivoirienne',
                    });
                }
            } catch (profileError: any) {
                console.error('Erreur création profil:', profileError?.message);
            }

            return res.status(201).json({ success: true, utilisateur });
        } catch (error) {
            return res.status(500).json({ success: false, message: "Erreur interne du serveur" });
        }
    }

    static async deleteUtilisateur(req: Request, res: Response): Promise<Response | null> {
        const role = (req as any).utilisateurRole;
        if (role !== RolesUtilisateur.ADMIN && role !== RolesUtilisateur.INSTITUTION) {
            return res.status(403).json({ success: false, message: "Réservé à l'administration" });
        }

        let utilisateur: Utilisateur | null = await Utilisateur.findOne({ where: { id: req.params.id } });
        if (utilisateur) {
            await utilisateur.destroy()
                .then(() => {
                    return res.status(200).json({ success: true, message: "Utilisateur supprime" });
                })
                .catch((error) => {
                    return res.status(500).json({ success: false, message: "Erreur lors de la suppression" });
                });
        }
        else {
            return res.status(404).json({ success: false, message: "Utilisateur non trouve" });
        }

        return null
    }

    static async getCount(req: Request, res: Response): Promise<Response | null> {
        let options: CountOptions<InferAttributes<Utilisateur>> = {}

        if ((req as any).utilisateurRole == RolesUtilisateur.APPRENANT) {
            return res.status(403).json({ success: false })
        }

        await Utilisateur.count(options)
            .then((value) => {
                return res.status(200).json({ success: true, count: value });
            })
            .catch((error) => {
                return res.status(500).json({ success: false, message: "Erreur lors du comptage" });
            });

        return null
    }
}
