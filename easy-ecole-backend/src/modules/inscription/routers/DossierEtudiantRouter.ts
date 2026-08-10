import express from "express"

import DossierEtudiantController from "../controllers/DossierEtudiantController"
import { AuthInstitution } from "../../../core/middlewares/AuthInstitution";
import CheckPermission from "../../../core/middlewares/CheckPermission";

const router = express.Router()

router
    /**
     * @openapi
     * /inscription/dossiers:
     *   get:
     *     tags: [Dossiers Étudiants]
     *     summary: Liste tous les dossiers étudiants
     *     security: [{ bearerAuth: [] }]
     *     responses:
     *       200:
     *         description: Liste des dossiers
     */
    .get('/', DossierEtudiantController.getAllDossiers)
    /**
     * @openapi
     * /inscription/dossiers/arbre:
     *   get:
     *     tags: [Dossiers Étudiants]
     *     summary: Renvoie l'arbre hiérarchique complet des dossiers étudiants (institution/admin uniquement)
     *     security: [{ bearerAuth: [] }]
     *     responses:
     *       200:
     *         description: Arbre hiérarchique des dossiers (années > filières > niveaux > classes > dossiers)
     *       403:
     *         description: Accès refusé (rôle non autorisé)
     */
    .get('/arbre', [AuthInstitution], DossierEtudiantController.getArbreDossiers)
    /**
     * @openapi
     * /inscription/dossiers/mon-dossier:
     *   get:
     *     tags: [Dossiers Étudiants]
     *     summary: Récupère le dossier de l'étudiant connecté
     *     security: [{ bearerAuth: [] }]
     *     responses:
     *       200:
     *         description: Dossier de l'étudiant
     */
    .get('/mon-dossier', DossierEtudiantController.getMonDossier)
    /**
     * @openapi
     * /inscription/dossiers/generer:
     *   post:
     *     tags: [Dossiers Étudiants]
     *     summary: Crée un dossier étudiant (institution uniquement)
     *     security: [{ bearerAuth: [] }]
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             required:
     *               - utilisateurId
     *               - fraisScolarite
     *               - demarrageParcours
     *             properties:
     *               utilisateurId:
     *                 type: string
     *               photo:
     *                 type: string
     *               fraisScolarite:
     *                 type: number
     *               modePaiement:
     *                 type: string
     *                 enum: [unique, mensuel]
     *               nbMensualites:
     *                 type: integer
     *               demarrageParcours:
     *                 type: string
     *                 format: date
     *     responses:
     *       201:
     *         description: Dossier créé
     */
    .post('/generer', [AuthInstitution, CheckPermission('action.inscription.dossier.generer')], DossierEtudiantController.genererDossier)
    /**
     * @openapi
     * /inscription/dossiers/{matricule}/statut:
     *   get:
     *     tags: [Dossiers Étudiants]
     *     summary: Vérifie le statut d'un étudiant par matricule (pour scanner)
     *     parameters:
     *       - in: path
     *         name: matricule
     *         required: true
     *         schema:
     *           type: string
     *     responses:
     *       200:
     *         description: Statut de l'étudiant (vert/rouge)
     */
    .get('/:matricule/statut', DossierEtudiantController.getStatutByMatricule)
    /**
     * @openapi
     * /inscription/dossiers/{id}:
     *   get:
     *     tags: [Dossiers Étudiants]
     *     summary: Récupère un dossier par son ID
     *     security: [{ bearerAuth: [] }]
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: string
     *     responses:
     *       200:
     *         description: Détails du dossier
     */
    .get('/:id/complet', DossierEtudiantController.getDossierComplet)
    .get('/:id', DossierEtudiantController.getDossier)
    /**
     * @openapi
     * /inscription/dossiers/{id}/carte:
     *   get:
     *     tags: [Dossiers Étudiants]
     *     summary: Télécharge la carte étudiante PDF
     *     security: [{ bearerAuth: [] }]
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema: { type: integer }
     *     responses:
     *       200:
     *         description: Fichier PDF de la carte étudiante
     *         content:
     *           application/pdf:
     *             schema:
     *               type: string
     *               format: binary
     *   post:
     *     tags: [Dossiers Étudiants]
     *     summary: Régénère la carte étudiante avec QR code
     *     security: [{ bearerAuth: [] }]
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema: { type: integer }
     *     responses:
     *       200:
     *         description: Carte régénérée
     */
    .get('/:id/carte', DossierEtudiantController.telechargerCarte)
    .post('/:id/regenerer-carte', [AuthInstitution, CheckPermission('action.inscription.dossier.modifier-statut')], DossierEtudiantController.regenererCarte)
    /**
     * @openapi
     * /inscription/dossiers/{id}:
     *   put:
     *     tags: [Dossiers Étudiants]
     *     summary: Met à jour le statut d'un dossier (institution uniquement)
     *     security: [{ bearerAuth: [] }]
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: string
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             properties:
     *               statut:
     *                 type: string
     *                 enum: [actif, suspendu, archive]
     *               photo:
     *                 type: string
     *     responses:
     *       200:
     *         description: Dossier mis à jour
     */
    .put('/:id', [AuthInstitution, CheckPermission('action.inscription.dossier.modifier-statut')], DossierEtudiantController.updateStatut)

export default router
