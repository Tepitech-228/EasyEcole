import { Request, Response } from "express";
import { RolesUtilisateur } from "../../../core/enums/RolesUtilisateur";
import { DesignationMemoire } from "../models/DesignationMemoire";
import { CursusApprenant } from "../models/CursusApprenant";
import { Utilisateur } from "../../auth/models/Utilisateur";

const STATUTS_VALIDES = ['propose', 'confirme', 'rejete'];

export default class DesignationMemoireController {

    constructor() { }

    private static buildInclude(): any[] {
        return [
            {
                association: DesignationMemoire.associations.cursusApprenant,
                include: [
                    { association: CursusApprenant.associations.utilisateur },
                    { association: CursusApprenant.associations.classe },
                    { association: CursusApprenant.associations.parcours }
                ]
            },
            { association: DesignationMemoire.associations.superviseur }
        ];
    }

    private static hasAccesLectureComplet(req: Request): boolean {
        const role = (req as any).utilisateurRole;
        return role === RolesUtilisateur.INSTITUTION
            || role === RolesUtilisateur.ADMIN
            || role === RolesUtilisateur.COMITE_ORIENTATION
            || role === RolesUtilisateur.CABINET_COMPTABLE;
    }

    private static estApprenant(req: Request): boolean {
        return (req as any).utilisateurRole === RolesUtilisateur.APPRENANT;
    }

    private static estEntierPositif(value: any): boolean {
        return Number.isInteger(Number(value)) && Number(value) > 0;
    }

    static async getAll(req: Request, res: Response): Promise<Response> {
        if (!DesignationMemoireController.hasAccesLectureComplet(req) && !DesignationMemoireController.estApprenant(req)) {
            return res.status(403).json({ success: false, message: "Accès réservé à l'administration, au comité d'orientation, au cabinet comptable et aux apprenants concernés" });
        }

        const page = Math.max(1, parseInt(String(req.query.page)) || 1);
        const limit = Math.min(100, Math.max(1, parseInt(String(req.query.limit)) || 20));
        const offset = (page - 1) * limit;

        const where: any = {};

        // Un apprenant ne voit que ses propres désignations
        if (DesignationMemoireController.estApprenant(req)) {
            where['$cursusApprenant.utilisateurId$'] = (req as any).utilisateurId;
        }

        // Filtre par classe via l'association cursusApprenant.classeId
        if (req.query.classeId) {
            where['$cursusApprenant.classeId$'] = req.query.classeId;
        }

        try {
            const { count, rows } = await DesignationMemoire.findAndCountAll({
                where,
                include: DesignationMemoireController.buildInclude(),
                order: [['createdAt', 'DESC']],
                limit,
                offset,
                distinct: true,
                subQuery: false
            });

            return res.status(200).json({
                data: rows,
                pagination: {
                    page,
                    limit,
                    total: count,
                    totalPages: Math.ceil(count / limit)
                }
            });
        } catch (error) {
            console.error('Erreur', error);
            return res.status(500).json({ success: false, message: 'Erreur interne' });
        }
    }

    static async getById(req: Request, res: Response): Promise<Response> {
        if (!DesignationMemoireController.hasAccesLectureComplet(req) && !DesignationMemoireController.estApprenant(req)) {
            return res.status(403).json({ success: false, message: "Accès réservé à l'administration, au comité d'orientation, au cabinet comptable et aux apprenants concernés" });
        }

        const id = Number(req.params.id);
        if (!DesignationMemoireController.estEntierPositif(id)) {
            return res.status(400).json({ success: false, message: "Identifiant de désignation invalide" });
        }

        const where: any = { id };

        // Un apprenant ne peut consulter que ses propres désignations
        if (DesignationMemoireController.estApprenant(req)) {
            where['$cursusApprenant.utilisateurId$'] = (req as any).utilisateurId;
        }

        try {
            const designation = await DesignationMemoire.findOne({
                where,
                include: DesignationMemoireController.buildInclude()
            });

            if (designation == null) {
                return res.status(404).json({ success: false, message: "Désignation de directeur de mémoire non trouvée" });
            }

            return res.status(200).send(designation);
        } catch (error) {
            console.error('Erreur', error);
            return res.status(500).json({ success: false, message: 'Erreur interne' });
        }
    }

    static async create(req: Request, res: Response): Promise<Response> {
        const { cursusApprenantId, sujet, superviseurId, gradeSuperviseur } = req.body || {};

        if (!DesignationMemoireController.estEntierPositif(cursusApprenantId)) {
            return res.status(400).json({ success: false, message: "cursusApprenantId est requis (identifiant entier positif)" });
        }
        if (!sujet || !String(sujet).trim()) {
            return res.status(400).json({ success: false, message: "Le sujet du mémoire est requis" });
        }
        if (!DesignationMemoireController.estEntierPositif(superviseurId)) {
            return res.status(400).json({ success: false, message: "superviseurId est requis (identifiant utilisateur entier positif)" });
        }
        if (!gradeSuperviseur || !String(gradeSuperviseur).trim()) {
            return res.status(400).json({ success: false, message: "Le grade du superviseur est requis" });
        }

        const statut = req.body.statut ?? 'propose';
        if (!STATUTS_VALIDES.includes(statut)) {
            return res.status(400).json({ success: false, message: "Statut invalide. Valeurs autorisées : propose, confirme, rejete" });
        }

        try {
            const cursus = await CursusApprenant.findByPk(cursusApprenantId);
            if (cursus == null) {
                return res.status(400).json({ success: false, message: "Cursus apprenant introuvable" });
            }

            const superviseur = await Utilisateur.findByPk(superviseurId);
            if (superviseur == null) {
                return res.status(400).json({ success: false, message: "Superviseur (utilisateur) introuvable" });
            }

            const payload: any = {
                cursusApprenantId,
                sujet: String(sujet).trim(),
                superviseurId,
                gradeSuperviseur: String(gradeSuperviseur).trim(),
                statut
            };
            if (req.body.emailSuperviseur) payload.emailSuperviseur = String(req.body.emailSuperviseur).trim();
            if (req.body.telephoneSuperviseur) payload.telephoneSuperviseur = String(req.body.telephoneSuperviseur).trim();
            if (req.body.dateDesignation) payload.dateDesignation = req.body.dateDesignation;
            if (req.body.commentaire) payload.commentaire = String(req.body.commentaire).trim();

            const designation = await DesignationMemoire.create(payload);

            const created = await DesignationMemoire.findByPk(designation.id, {
                include: DesignationMemoireController.buildInclude()
            });

            return res.status(201).send(created);
        } catch (error) {
            console.error('Erreur', error);
            return res.status(500).json({ success: false, message: 'Erreur interne' });
        }
    }

    static async update(req: Request, res: Response): Promise<Response> {
        const id = Number(req.params.id);
        if (!DesignationMemoireController.estEntierPositif(id)) {
            return res.status(400).json({ success: false, message: "Identifiant de désignation invalide" });
        }

        try {
            const designation = await DesignationMemoire.findByPk(id);
            if (designation == null) {
                return res.status(404).json({ success: false, message: "Désignation de directeur de mémoire non trouvée" });
            }

            const updates: any = {};

            if (req.body.cursusApprenantId !== undefined) {
                if (!DesignationMemoireController.estEntierPositif(req.body.cursusApprenantId)) {
                    return res.status(400).json({ success: false, message: "cursusApprenantId doit être un identifiant entier positif" });
                }
                const cursus = await CursusApprenant.findByPk(req.body.cursusApprenantId);
                if (cursus == null) {
                    return res.status(400).json({ success: false, message: "Cursus apprenant introuvable" });
                }
                updates.cursusApprenantId = req.body.cursusApprenantId;
            }

            if (req.body.sujet !== undefined) {
                if (!String(req.body.sujet).trim()) {
                    return res.status(400).json({ success: false, message: "Le sujet du mémoire est requis" });
                }
                updates.sujet = String(req.body.sujet).trim();
            }

            if (req.body.superviseurId !== undefined) {
                if (!DesignationMemoireController.estEntierPositif(req.body.superviseurId)) {
                    return res.status(400).json({ success: false, message: "superviseurId doit être un identifiant utilisateur entier positif" });
                }
                const superviseur = await Utilisateur.findByPk(req.body.superviseurId);
                if (superviseur == null) {
                    return res.status(400).json({ success: false, message: "Superviseur (utilisateur) introuvable" });
                }
                updates.superviseurId = req.body.superviseurId;
            }

            if (req.body.gradeSuperviseur !== undefined) {
                if (!String(req.body.gradeSuperviseur).trim()) {
                    return res.status(400).json({ success: false, message: "Le grade du superviseur est requis" });
                }
                updates.gradeSuperviseur = String(req.body.gradeSuperviseur).trim();
            }

            if (req.body.emailSuperviseur !== undefined) {
                updates.emailSuperviseur = req.body.emailSuperviseur ? String(req.body.emailSuperviseur).trim() : null;
            }

            if (req.body.telephoneSuperviseur !== undefined) {
                updates.telephoneSuperviseur = req.body.telephoneSuperviseur ? String(req.body.telephoneSuperviseur).trim() : null;
            }

            if (req.body.dateDesignation !== undefined) {
                updates.dateDesignation = req.body.dateDesignation || null;
            }

            if (req.body.statut !== undefined) {
                if (!STATUTS_VALIDES.includes(req.body.statut)) {
                    return res.status(400).json({ success: false, message: "Statut invalide. Valeurs autorisées : propose, confirme, rejete" });
                }
                updates.statut = req.body.statut;
            }

            if (req.body.commentaire !== undefined) {
                updates.commentaire = req.body.commentaire === null ? null : String(req.body.commentaire).trim();
            }

            await designation.update(updates);

            const updated = await DesignationMemoire.findByPk(id, {
                include: DesignationMemoireController.buildInclude()
            });

            return res.status(200).send(updated);
        } catch (error) {
            console.error('Erreur', error);
            return res.status(500).json({ success: false, message: 'Erreur interne' });
        }
    }

    static async delete(req: Request, res: Response): Promise<Response> {
        const id = Number(req.params.id);
        if (!DesignationMemoireController.estEntierPositif(id)) {
            return res.status(400).json({ success: false, message: "Identifiant de désignation invalide" });
        }

        try {
            const designation = await DesignationMemoire.findByPk(id);
            if (designation == null) {
                return res.status(404).json({ success: false, message: "Désignation de directeur de mémoire non trouvée" });
            }

            await designation.destroy();

            return res.status(200).json({ success: true, message: "Désignation de directeur de mémoire supprimée" });
        } catch (error) {
            console.error('Erreur', error);
            return res.status(500).json({ success: false, message: 'Erreur interne' });
        }
    }
}
