import { Request, Response } from "express";
import { FindOptions, InferAttributes, Op } from "sequelize";
import { DatabaseConnection } from "../../../core/helpers/DatabaseConnection";
import { RegistreAcademique } from "../models/RegistreAcademique";
import { Deliberation } from "../../bulletins/models/Deliberation";
import { ResultatDeliberation } from "../../bulletins/models/ResultatDeliberation";
import { CursusApprenant } from "../../inscription/models/CursusApprenant";
import { Classe } from "../../inscription/models/Classe";
import { AnneeAcademique } from "../../inscription/models/AnneeAcademique";
import { Parcours } from "../../inscription/models/Parcours";
import { NiveauEtude } from "../../inscription/models/NiveauEtude";

export default class RegistreAcademiqueController {

    constructor() { }

    static async getAll(req: Request, res: Response): Promise<Response> {
        try {
            const page = Math.max(1, parseInt(req.query.page as string) || 1);
            const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));
            const offset = (page - 1) * limit;

            const { anneeScolaire, classe, decision, filiere, niveau, search } = req.query;

            const where: any = {};

            if (anneeScolaire) where.anneeScolaire = anneeScolaire;
            if (classe) where.classe = classe;
            if (filiere) where.filiere = filiere;
            if (niveau) where.niveau = niveau;
            if (decision) where.decision = decision;
            if (search) {
                where[Op.or] = [
                    { etudiant: { [Op.substring]: search } },
                    { matricule: { [Op.substring]: search } }
                ];
            }

            const { count, rows } = await RegistreAcademique.findAndCountAll({
                where,
                offset,
                limit,
                order: [['anneeScolaire', 'DESC'], ['classe', 'ASC'], ['etudiant', 'ASC']]
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
            return res.status(500).json({ success: false, error: error });
        }
    }

    static async batchStatut(req: Request, res: Response): Promise<Response> {
        try {
            const { ids, decision } = req.body;
            if (!ids || !Array.isArray(ids) || ids.length === 0) {
                return res.status(400).json({ success: false, message: "IDs requis" });
            }
            if (!decision) {
                return res.status(400).json({ success: false, message: "Décision requise" });
            }

            const [count] = await RegistreAcademique.update(
                { decision },
                { where: { id: ids } }
            );

            return res.status(200).json({ success: true, count });
        } catch (error) {
            return res.status(500).json({ success: false, error: error });
        }
    }

    /**
     * Génère / met à jour automatiquement les registres académiques à partir
     * des résultats d'une délibération (statut 'cloturee' ou 'publiee').
     * UPSERT par couple (matricule, anneeScolaire) pour éviter les doublons.
     * POST /scolarite/registres/generer  { deliberationId }
     */
    static async generer(req: Request, res: Response): Promise<Response> {
        const transaction = await DatabaseConnection.getInstance().sequelize.transaction();
        try {
            const { deliberationId } = req.body;

            if (!deliberationId) {
                await transaction.rollback();
                return res.status(400).json({ success: false, message: "deliberationId requis" });
            }

            const deliberation = await Deliberation.findByPk(deliberationId, {
                transaction,
                include: [
                    { model: Classe, as: 'classe' },
                    { model: AnneeAcademique, as: 'anneeAcademique' }
                ]
            });

            if (!deliberation) {
                await transaction.rollback();
                return res.status(404).json({ success: false, message: "Délibération non trouvée" });
            }

            if (!['cloturee', 'publiee'].includes(deliberation.statut)) {
                await transaction.rollback();
                return res.status(400).json({
                    success: false,
                    message: "La délibération doit être clôturée (cloturee) ou publiée (publiee) pour générer le registre"
                });
            }

            const resultats = await ResultatDeliberation.findAll({
                where: { deliberationId },
                transaction,
                include: [{
                    model: CursusApprenant,
                    as: 'cursusApprenant',
                    include: [
                        { model: Parcours, as: 'parcours' },
                        { model: NiveauEtude, as: 'niveauEtude' }
                    ]
                }]
            });

            const anneeScolaire = deliberation.anneeAcademique?.libelle ?? '';
            const classeLibelle = deliberation.classe?.libelle ?? '';

            let crees = 0;
            let maj = 0;

            for (const r of resultats) {
                const cursus = r.cursusApprenant;

                const values = {
                    etudiant: [r.nom, r.prenoms].filter(Boolean).join(' ').trim(),
                    matricule: r.matricule,
                    classe: classeLibelle,
                    filiere: cursus?.intituleParcours || cursus?.parcours?.titre || null,
                    niveau: cursus?.niveauEtude?.libelle || null,
                    moyenne: r.moyenne ?? 0,
                    rang: r.rang ?? 0,
                    decision: r.decision,
                    anneeScolaire,
                    cursusApprenantId: cursus?.id ?? null
                };

                const [registre, created] = await RegistreAcademique.findOrCreate({
                    where: { matricule: r.matricule, anneeScolaire },
                    defaults: values,
                    transaction
                });

                if (created) {
                    crees++;
                } else {
                    await registre.update(values, { transaction });
                    maj++;
                }
            }

            await transaction.commit();
            return res.status(200).json({ success: true, crees, maj, total: resultats.length });
        } catch (error) {
            await transaction.rollback();
            return res.status(500).json({ success: false, error: error });
        }
    }

    static async getOne(req: Request, res: Response): Promise<Response> {
        try {
            const registre = await RegistreAcademique.findOne({ where: { id: req.params.id } });
            if (registre == null)
                return res.status(404).json({ success: false, message: "Registre non trouvé" });
            return res.status(200).send(registre);
        } catch (error) {
            return res.status(500).json({ success: false, error: error });
        }
    }

    static async create(req: Request, res: Response): Promise<Response | null> {
        let registre = new RegistreAcademique();
        registre.etudiant = req.body.etudiant;
        registre.matricule = req.body.matricule;
        registre.classe = req.body.classe;
        registre.moyenne = req.body.moyenne;
        registre.rang = req.body.rang;
        registre.decision = req.body.decision;
        registre.anneeScolaire = req.body.anneeScolaire;

        await registre.save()
            .then(async (registre) => {
                return res.status(201).send(registre);
            })
            .catch((error) => {
                return res.status(400).json({ success: false, error: error });
            });

        return null;
    }

    static async update(req: Request, res: Response): Promise<Response | null> {
        let registre = await RegistreAcademique.findOne({ where: { id: req.params.id } });
        if (registre != null) {
            await registre.update(req.body)
                .then(async (registre) => {
                    return res.status(200).send(registre);
                })
                .catch((error) => {
                    return res.status(400).json({ success: false, error: error });
                });
        } else {
            return res.status(404).json({ success: false, message: "Registre non trouvé" });
        }

        return null;
    }

    static async delete(req: Request, res: Response): Promise<Response | null> {
        let registre = await RegistreAcademique.findOne({ where: { id: req.params.id } });
        if (registre) {
            await registre.destroy()
                .then(() => {
                    return res.status(200).json({ success: true, message: "Registre supprimé" });
                })
                .catch((error) => {
                    return res.status(500).json({ success: false, error: error });
                });
        } else {
            return res.status(404).json({ success: false, message: "Registre non trouvé" });
        }

        return null;
    }
}
