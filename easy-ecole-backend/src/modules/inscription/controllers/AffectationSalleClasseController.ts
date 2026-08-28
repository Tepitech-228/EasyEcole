import { Request, Response } from "express";
import { CountOptions, FindOptions, InferAttributes, Op } from "sequelize";
import { RolesUtilisateur } from "../../../core/enums/RolesUtilisateur";
import { AffectationSalleClasse } from "../models/AffectationSalleClasse";
import { SalleDeClasse } from "../models/SalleDeClasse";
import { Classe } from "../models/Classe";
import { AnneeAcademique } from "../models/AnneeAcademique";

export default class AffectationSalleClasseController {

    constructor() { }

    private static baseIncludes() {
        return [
            { association: AffectationSalleClasse.associations.salle, required: false },
            { association: AffectationSalleClasse.associations.classe, required: false },
            { association: AffectationSalleClasse.associations.anneeAcademique, required: false },
            { association: AffectationSalleClasse.associations.etablissement, required: false },
        ];
    }

    /**
     * Détecte les affectations en conflit :
     *  - une même salle affectée à DEUX classes différentes sur une période qui se chevauche
     *  - une même classe affectée à DEUX salles différentes sur une période qui se chevauche
     */
    private static async verifierChevauchement(data: any, excludeId?: string): Promise<any[]> {
        const conflits: any[] = [];
        const { salleId, classeId, dateDebut, dateFin, regime } = data;
        if (!salleId || !classeId || !dateDebut || !dateFin) return conflits;

        const whereOverlap: any = {
            dateDebut: { [Op.lte]: dateFin },
            dateFin: { [Op.gte]: dateDebut },
        };
        if (excludeId) whereOverlap.id = { [Op.ne]: excludeId };
        if (regime && regime !== 'JOUR_ET_SOIR') {
            whereOverlap.regime = { [Op.in]: [regime, 'JOUR_ET_SOIR'] };
        }

        // Même salle affectée à une AUTRE classe (salleId identique, classeId différent)
        const salleConflits = await AffectationSalleClasse.findAll({
            where: { ...whereOverlap, salleId, classeId: { [Op.ne]: classeId } },
            include: AffectationSalleClasseController.baseIncludes()
        });
        for (const aff of salleConflits) {
            const s = aff as any;
            conflits.push({
                type: 'salle',
                message: `La salle "${s.salle?.libelle ?? s.salleId}" est déjà affectée à une autre classe sur cette période (${s.dateDebut} → ${s.dateFin})`,
                affectation: aff
            });
        }

        // Même classe affectée sur une AUTRE salle (classeId identique, salleId différent)
        const classeConflits = await AffectationSalleClasse.findAll({
            where: { ...whereOverlap, classeId, salleId: { [Op.ne]: salleId } },
            include: AffectationSalleClasseController.baseIncludes()
        });
        for (const aff of classeConflits) {
            const s = aff as any;
            conflits.push({
                type: 'classe',
                message: `La classe "${s.classe?.libelle ?? s.classeId}" est déjà affectée à une autre salle sur cette période (${s.dateDebut} → ${s.dateFin})`,
                affectation: aff
            });
        }

        return conflits;
    }

    static async getAllAffectations(req: Request, res: Response): Promise<Response> {
        let options: FindOptions<InferAttributes<AffectationSalleClasse>> = {
            include: AffectationSalleClasseController.baseIncludes()
        };

        let where: any = {}
        if (req.query.salleId) where.salleId = req.query.salleId as string;
        if (req.query.classeId) where.classeId = req.query.classeId as string;
        if (req.query.anneeAcademiqueId) where.anneeAcademiqueId = req.query.anneeAcademiqueId as string;
        if (req.query.regime) where.regime = req.query.regime as string;
        if (req.query.etablissementId) where.etablissementId = req.query.etablissementId as string;
        if (Object.keys(where).length > 0) options = { ...options, where };

        try {
            const affectations: AffectationSalleClasse[] = await AffectationSalleClasse.findAll(options);
            return res.status(200).send(affectations);
        } catch (error) {
            console.error('Erreur', error);
            return res.status(500).json({ success: false, message: 'Erreur interne' });
        }
    }

    static async getAffectation(req: Request, res: Response): Promise<Response> {
        let options: FindOptions<InferAttributes<AffectationSalleClasse>> = {
            where: { id: req.params.id },
            include: AffectationSalleClasseController.baseIncludes()
        };

        try {
            const affectation: AffectationSalleClasse | null = await AffectationSalleClasse.findOne(options);
            if (affectation == null)
                return res.status(404).json({ success: false, message: "Affectation non trouvée" });
            return res.status(200).send(affectation);
        } catch (error) {
            console.error('Erreur', error);
            return res.status(500).json({ success: false, message: 'Erreur interne' });
        }
    }

    static async createAffectation(req: Request, res: Response): Promise<Response | null> {
        if ((req as any).utilisateurRole !== RolesUtilisateur.INSTITUTION &&
            (req as any).utilisateurRole !== RolesUtilisateur.ADMIN) {
            return res.status(403).json({ success: false, message: "Réservé à l'institution" });
        }

        const { salleId, classeId, dateDebut, dateFin, regime } = req.body;
        if (!salleId || !classeId || !dateDebut || !dateFin) {
            return res.status(400).json({ success: false, message: "salleId, classeId, dateDebut et dateFin requis" });
        }
        if (new Date(dateFin).getTime() < new Date(dateDebut).getTime()) {
            return res.status(400).json({ success: false, message: "dateFin doit être >= dateDebut" });
        }

        const conflits = await AffectationSalleClasseController.verifierChevauchement(req.body);
        if (conflits.length > 0) {
            return res.status(409).json({ success: false, message: "Conflits détectés", conflits });
        }

        let affectation: AffectationSalleClasse = new AffectationSalleClasse();
        affectation.salleId = salleId;
        affectation.classeId = classeId;
        affectation.anneeAcademiqueId = req.body.anneeAcademiqueId ?? null;
        affectation.regime = regime ?? 'JOUR_ET_SOIR';
        affectation.dateDebut = dateDebut;
        affectation.dateFin = dateFin;
        affectation.etablissementId = req.body.etablissementId ?? null;

        try {
            await affectation.save();
            const created = await AffectationSalleClasse.findOne({
                where: { id: affectation.id },
                include: AffectationSalleClasseController.baseIncludes()
            });
            return res.status(201).send(created);
        } catch (error) {
            console.error('Erreur', error);
            return res.status(400).json({ success: false, error });
        }
    }

    static async updateAffectation(req: Request, res: Response): Promise<Response | null> {
        if ((req as any).utilisateurRole !== RolesUtilisateur.INSTITUTION &&
            (req as any).utilisateurRole !== RolesUtilisateur.ADMIN) {
            return res.status(403).json({ success: false, message: "Réservé à l'institution" });
        }

        let affectation: AffectationSalleClasse | null = await AffectationSalleClasse.findOne({ where: { id: req.params.id } });
        if (affectation == null) {
            return res.status(404).json({ success: false, message: "Affectation non trouvée" });
        }

        const merged = {
            salleId: req.body.salleId ?? affectation.salleId,
            classeId: req.body.classeId ?? affectation.classeId,
            regime: req.body.regime ?? affectation.regime,
            dateDebut: req.body.dateDebut ?? affectation.dateDebut,
            dateFin: req.body.dateFin ?? affectation.dateFin,
            anneeAcademiqueId: req.body.anneeAcademiqueId ?? affectation.anneeAcademiqueId,
        };
        if (new Date(merged.dateFin).getTime() < new Date(merged.dateDebut).getTime()) {
            return res.status(400).json({ success: false, message: "dateFin doit être >= dateDebut" });
        }

        const conflits = await AffectationSalleClasseController.verifierChevauchement(merged, req.params.id);
        if (conflits.length > 0) {
            return res.status(409).json({ success: false, message: "Conflits détectés", conflits });
        }

        try {
            await affectation.update(merged as any);
            return res.status(200).send(affectation);
        } catch (error) {
            console.error('Erreur', error);
            return res.status(400).json({ success: false, error });
        }
    }

    static async deleteAffectation(req: Request, res: Response): Promise<Response | null> {
        if ((req as any).utilisateurRole !== RolesUtilisateur.INSTITUTION &&
            (req as any).utilisateurRole !== RolesUtilisateur.ADMIN) {
            return res.status(403).json({ success: false, message: "Réservé à l'institution" });
        }

        let affectation: AffectationSalleClasse | null = await AffectationSalleClasse.findOne({ where: { id: req.params.id } });
        if (affectation) {
            try {
                await affectation.destroy();
                return res.status(200).json({ success: true, message: "Affectation supprimée" });
            } catch (error) {
                console.error('Erreur', error);
                return res.status(500).json({ success: false, message: 'Erreur interne' });
            }
        } else {
            return res.status(404).json({ success: false, message: "Affectation non trouvée" });
        }
    }

    static async getCount(req: Request, res: Response): Promise<Response | null> {
        try {
            const value = await AffectationSalleClasse.count({});
            return res.status(200).json({ success: true, count: value });
        } catch (error) {
            console.error('Erreur', error);
            return res.status(500).json({ success: false, message: 'Erreur interne' });
        }
    }
}
