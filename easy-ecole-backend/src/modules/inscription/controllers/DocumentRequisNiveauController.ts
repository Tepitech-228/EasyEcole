import { Request, Response } from "express";
import { RolesUtilisateur } from "../../../core/enums/RolesUtilisateur";
import { DocumentRequisNiveau } from "../models/DocumentRequisNiveau";

/**
 * GET /inscription/documents-requis-niveau — liste les documents obligatoires.
 * Filtre par ?niveau= (ex: LICENCE 1, MASTER…) et/ou ?code=.
 * Lecture ouverte à tout utilisateur authentifié (utilisé par le wizard).
 */
async function getAll(req: Request, res: Response): Promise<Response> {
    try {
        const where: any = {};
        if (req.query.niveau) where.niveau = String(req.query.niveau).toUpperCase();
        if (req.query.code) where.code = String(req.query.code);

        const docs = await DocumentRequisNiveau.findAll({
            where,
            order: [['niveau', 'ASC'], ['ordre', 'ASC'], ['id', 'ASC']],
        });
        return res.status(200).json({ success: true, data: docs });
    } catch (error) {
        console.error('Erreur getAll documents-requis-niveau', error);
        return res.status(500).json({ success: false, message: 'Erreur interne' });
    }
}

/**
 * GET /inscription/documents-requis-niveau/:id — un document par id.
 */
async function getOne(req: Request, res: Response): Promise<Response> {
    try {
        const doc = await DocumentRequisNiveau.findByPk(req.params.id);
        if (!doc) return res.status(404).json({ success: false, message: 'Document introuvable' });
        return res.status(200).json({ success: true, data: doc });
    } catch (error) {
        console.error('Erreur getOne documents-requis-niveau', error);
        return res.status(500).json({ success: false, message: 'Erreur interne' });
    }
}

/** Rôles autorisés à gérer (créer/modifier/supprimer) le référentiel. */
const ROLES_GESTION = [
    RolesUtilisateur.ADMIN,
    RolesUtilisateur.PERSONNEL_ADMINISTRATIF,
    RolesUtilisateur.SECRETAIRE,
    RolesUtilisateur.INSTITUTION,
];

/**
 * POST /inscription/documents-requis-niveau — crée un document obligatoire.
 * Réservé à la gestion (admin / personnel administratif / secrétariat).
 */
async function create(req: Request, res: Response): Promise<Response> {
    const role = (req as any).utilisateurRole;
    if (!ROLES_GESTION.includes(role)) {
        return res.status(403).json({ success: false, message: 'Accès refusé' });
    }

    const { code, libelle, niveau, description, ordre, obligatoire } = req.body || {};
    if (!code || !libelle || !niveau) {
        return res.status(400).json({ success: false, message: 'code, libelle et niveau sont requis' });
    }

    try {
        const doc = await DocumentRequisNiveau.create({
            code,
            libelle,
            niveau: String(niveau).toUpperCase(),
            description: description != null ? String(description) : null,
            ordre: Number.isInteger(ordre) ? ordre : 0,
            obligatoire: obligatoire !== false,
        });
        return res.status(201).json({ success: true, data: doc });
    } catch (error: any) {
        if (error?.name === 'SequelizeUniqueConstraintError') {
            return res.status(400).json({ success: false, message: 'Ce document existe déjà pour ce niveau' });
        }
        console.error('Erreur create documents-requis-niveau', error);
        return res.status(500).json({ success: false, message: 'Erreur interne' });
    }
}

/**
 * PUT /inscription/documents-requis-niveau/:id — met à jour un document.
 * Réservé à la gestion.
 */
async function update(req: Request, res: Response): Promise<Response> {
    const role = (req as any).utilisateurRole;
    if (!ROLES_GESTION.includes(role)) {
        return res.status(403).json({ success: false, message: 'Accès refusé' });
    }

    try {
        const doc = await DocumentRequisNiveau.findByPk(req.params.id);
        if (!doc) return res.status(404).json({ success: false, message: 'Document introuvable' });

        const { code, libelle, niveau, description, ordre, obligatoire } = req.body || {};
        if (code != null) doc.code = code;
        if (libelle != null) doc.libelle = libelle;
        if (niveau != null) doc.niveau = String(niveau).toUpperCase();
        if (description !== undefined) doc.description = description != null ? String(description) : null;
        if (ordre !== undefined) doc.ordre = Number.isInteger(ordre) ? ordre : doc.ordre;
        if (obligatoire !== undefined) doc.obligatoire = !!obligatoire;

        await doc.save();
        return res.status(200).json({ success: true, data: doc });
    } catch (error: any) {
        if (error?.name === 'SequelizeUniqueConstraintError') {
            return res.status(400).json({ success: false, message: 'Doublon : code déjà utilisé pour ce niveau' });
        }
        console.error('Erreur update documents-requis-niveau', error);
        return res.status(500).json({ success: false, message: 'Erreur interne' });
    }
}

/**
 * DELETE /inscription/documents-requis-niveau/:id — supprime un document.
 * Réservé à la gestion.
 */
async function remove(req: Request, res: Response): Promise<Response> {
    const role = (req as any).utilisateurRole;
    if (!ROLES_GESTION.includes(role)) {
        return res.status(403).json({ success: false, message: 'Accès refusé' });
    }

    try {
        const doc = await DocumentRequisNiveau.findByPk(req.params.id);
        if (!doc) return res.status(404).json({ success: false, message: 'Document introuvable' });
        await doc.destroy();
        return res.status(200).json({ success: true, message: 'Document supprimé' });
    } catch (error) {
        console.error('Erreur remove documents-requis-niveau', error);
        return res.status(500).json({ success: false, message: 'Erreur interne' });
    }
}

export default { getAll, getOne, create, update, remove };
