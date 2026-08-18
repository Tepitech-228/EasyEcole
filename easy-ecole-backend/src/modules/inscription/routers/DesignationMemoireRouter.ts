import express from "express";
import DesignationMemoireController from "../controllers/DesignationMemoireController";
import { AuthInstitution } from "../../../core/middlewares/AuthInstitution";
import Authenticate from "../../../core/middlewares/Authenticate";

const router = express.Router();

router
    /**
     * @openapi
     * /inscription/designation-memoires:
     *   get:
     *     tags: [Désignations Directeurs de Mémoire]
     *     summary: Liste paginée des désignations de directeur de mémoire (classeId, page, limit)
     *     security: [{ bearerAuth: [] }]
     *     parameters:
     *       - in: query
     *         name: classeId
     *         required: false
     *         schema: { type: integer }
     *         description: Filtre les désignations par classe (via le cursus de l'apprenant)
     *       - in: query
     *         name: page
     *         required: false
     *         schema: { type: integer, default: 1 }
     *       - in: query
     *         name: limit
     *         required: false
     *         schema: { type: integer, default: 20, maximum: 100 }
     *     responses:
     *       200:
     *         description: Liste paginée des désignations
     *       403:
     *         description: Accès refusé (rôle non autorisé)
     */
    .get('/', [Authenticate], DesignationMemoireController.getAll)
    /**
     * @openapi
     * /inscription/designation-memoires/{id}:
     *   get:
     *     tags: [Désignations Directeurs de Mémoire]
     *     summary: Récupère le détail d'une désignation de directeur de mémoire
     *     security: [{ bearerAuth: [] }]
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema: { type: integer }
     *     responses:
     *       200:
     *         description: Détail de la désignation (avec cursusApprenant et superviseur)
     *       404:
     *         description: Désignation non trouvée
     *       403:
     *         description: Accès refusé (rôle non autorisé)
     */
    .get('/:id', [Authenticate], DesignationMemoireController.getById)
    /**
     * @openapi
     * /inscription/designation-memoires:
     *   post:
     *     tags: [Désignations Directeurs de Mémoire]
     *     summary: Crée une désignation de directeur de mémoire (institution/admin uniquement)
     *     security: [{ bearerAuth: [] }]
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             required:
     *               - cursusApprenantId
     *               - sujet
     *               - superviseurId
     *               - gradeSuperviseur
     *             properties:
     *               cursusApprenantId:
     *                 type: integer
     *               sujet:
     *                 type: string
     *               superviseurId:
     *                 type: integer
     *                 description: Id de l'utilisateur superviseur (enseignant)
     *               gradeSuperviseur:
     *                 type: string
     *               emailSuperviseur:
     *                 type: string
     *               telephoneSuperviseur:
     *                 type: string
     *               dateDesignation:
     *                 type: string
     *                 format: date
     *               statut:
     *                 type: string
     *                 enum: [propose, confirme, rejete]
     *                 default: propose
     *               commentaire:
     *                 type: string
     *     responses:
     *       201:
     *         description: Désignation créée
     *       400:
     *         description: Données invalides ou références introuvables
     *       403:
     *         description: Accès refusé (rôle non autorisé)
     */
    .post('/', [AuthInstitution], DesignationMemoireController.create)
    /**
     * @openapi
     * /inscription/designation-memoires/{id}:
     *   put:
     *     tags: [Désignations Directeurs de Mémoire]
     *     summary: Met à jour une désignation de directeur de mémoire (institution/admin uniquement)
     *     security: [{ bearerAuth: [] }]
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema: { type: integer }
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             properties:
     *               cursusApprenantId:
     *                 type: integer
     *               sujet:
     *                 type: string
     *               superviseurId:
     *                 type: integer
     *               gradeSuperviseur:
     *                 type: string
     *               emailSuperviseur:
     *                 type: string
     *                 nullable: true
     *               telephoneSuperviseur:
     *                 type: string
     *                 nullable: true
     *               dateDesignation:
     *                 type: string
     *                 format: date
     *                 nullable: true
     *               statut:
     *                 type: string
     *                 enum: [propose, confirme, rejete]
     *               commentaire:
     *                 type: string
     *                 nullable: true
     *     responses:
     *       200:
     *         description: Désignation mise à jour
     *       400:
     *         description: Données invalides
     *       404:
     *         description: Désignation non trouvée
     *       403:
     *         description: Accès refusé (rôle non autorisé)
     */
    .put('/:id', [AuthInstitution], DesignationMemoireController.update)
    /**
     * @openapi
     * /inscription/designation-memoires/{id}:
     *   delete:
     *     tags: [Désignations Directeurs de Mémoire]
     *     summary: Supprime (soft) une désignation de directeur de mémoire (institution/admin uniquement)
     *     security: [{ bearerAuth: [] }]
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema: { type: integer }
     *     responses:
     *       200:
     *         description: Désignation supprimée
     *       404:
     *         description: Désignation non trouvée
     *       403:
     *         description: Accès refusé (rôle non autorisé)
     */
    .delete('/:id', [AuthInstitution], DesignationMemoireController.delete)

export default router