import { Request, Response } from "express";
import { CountOptions, FindOptions, InferAttributes, Op } from "sequelize";
import { RolesUtilisateur } from "../../../core/enums/RolesUtilisateur";
import { Utilisateur } from "../models/Utilisateur";
import { PersonnelAdministratif } from "../models/PersonnelAdministratif";
import { Enseignant } from "../models/Enseignant";
import { Apprenant } from "../models/Apprenant";
import * as bcrypt from 'bcrypt';
import { DatabaseConnection } from "../../../core/helpers/DatabaseConnection";

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

        const userId = Number(req.params.id);
        if (!userId || isNaN(userId)) {
            return res.status(400).json({ success: false, message: "Identifiant utilisateur invalide" });
        }

        const requesterId = (req as any).utilisateurId;
        if (requesterId && Number(requesterId) === userId) {
            return res.status(400).json({ success: false, message: "Impossible de supprimer votre propre compte" });
        }

        const sequelize = DatabaseConnection.getInstance().sequelize;

        try {
            const utilisateur: Utilisateur | null = await Utilisateur.findByPk(userId);
            if (!utilisateur) {
                return res.status(404).json({ success: false, message: "Utilisateur non trouve" });
            }

            // Tables "bloquantes" (NO ACTION / RESTRICT) liées à de la donnée métier
            // sensible (parents, bourse, réductions, bulletins) : on refuse plutôt que de
            // détruire silencieusement ces données. Ces cas demandent une purge manuelle.
            const [blockers]: any = await sequelize.query(
                `SELECT
                    (SELECT COUNT(*) FROM par_parents_enfants WHERE parentUtilisateurId = :id) AS parents,
                    (SELECT COUNT(*) FROM brs_attributions WHERE valideParId = :id) AS attributions,
                    (SELECT COUNT(*) FROM cpt_reductions_frais WHERE validePar = :id) AS reductions,
                    (SELECT COUNT(*) FROM ins_bulletins WHERE utilisateurId = :id) AS bulletins,
                    (SELECT COUNT(*) FROM scol_clotures_caisse_old_v1 WHERE caissier_id = :id) AS clotures`,
                { replacements: { id: userId } }
            );
            const b = blockers[0];
            if (b && (b.parents || b.attributions || b.reductions || b.bulletins || b.clotures)) {
                const liens: string[] = [];
                if (b.parents) liens.push(`${b.parents} lien(s) parent-enfant`);
                if (b.attributions) liens.push(`${b.attributions} attribution(s) de bourse`);
                if (b.reductions) liens.push(`${b.reductions} réduction(s) de frais`);
                if (b.bulletins) liens.push(`${b.bulletins} bulletin(s)`);
                if (b.clotures) liens.push(`${b.clotures} clôture(s) de caisse (anciennes)`);
                return res.status(409).json({
                    success: false,
                    message: `Suppression impossible : cet utilisateur est lié à des données sensibles (${liens.join(', ')}). Un administrateur doit procéder à une purge manuelle ciblée.`
                });
            }

            await sequelize.transaction(async (t) => {
                const q = (sql: string, opts?: any) => sequelize.query(sql, { ...opts, transaction: t });

                // 1) Profils et leurs dépendances (supprime d'abord les lignes de profil
                //    pour que leurs enfants en SET NULL soient nettoyés, puis la ligne user).
                await q(`DELETE FROM aut_user_permissions WHERE utilisateurId = :id`, { replacements: { id: userId } });
                await q(`DELETE FROM aut_apprenants WHERE utilisateurId = :id`, { replacements: { id: userId } });
                await q(`DELETE FROM aut_enseignants WHERE utilisateurId = :id`, { replacements: { id: userId } });
                await q(`DELETE FROM aut_institutions WHERE utilisateurId = :id`, { replacements: { id: userId } });
                await q(`DELETE FROM aut_caissiers_banque WHERE utilisateurId = :id`, { replacements: { id: userId } });
                await q(`DELETE FROM aut_comite_orientations WHERE utilisateurId = :id`, { replacements: { id: userId } });
                await q(`DELETE FROM aut_personnel_administratif WHERE utilisateurId = :id`, { replacements: { id: userId } });
                await q(`DELETE FROM aut_user_roles WHERE utilisateurId = :id`, { replacements: { id: userId } });

                // 2) Suppression DÉFINITIVE de l'utilisateur (hard delete, ignore le soft delete)
                const [del]: any = await q(`DELETE FROM aut_utilisateurs WHERE id = :id`, { replacements: { id: userId } });
                if (!del || del.affectedRows === 0) {
                    throw new Error('USER_NOT_FOUND');
                }
            });

            return res.status(200).json({ success: true, message: "Utilisateur définitivement supprimé" });
        } catch (error: any) {
            if (error?.message === 'USER_NOT_FOUND') {
                return res.status(404).json({ success: false, message: "Utilisateur non trouve" });
            }
            // Erreur de clé étrangère (contrainte non couverte par le blocage ci-dessus)
            const code = error?.original?.code || error?.parent?.code || '';
            if (code === 'ER_ROW_IS_REFERENCED_2' || code === 'ER_ROW_IS_REFERENCED' || error?.name === 'SequelizeForeignKeyConstraintError') {
                return res.status(409).json({
                    success: false,
                    message: "Suppression impossible : l'utilisateur est référencé par d'autres données métier. L'administrateur doit procéder à une purge manuelle ciblée."
                });
            }
            console.error('Erreur suppression définitive utilisateur:', error?.message);
            return res.status(500).json({ success: false, message: "Erreur lors de la suppression" });
        }
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
