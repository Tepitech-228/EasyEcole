import express from "express";

import DocumentRequisNiveauController from "../controllers/DocumentRequisNiveauController";
import Authenticate from "../../../core/middlewares/Authenticate";

const router = express.Router()

/**
 * @openapi
 * /inscription/documents-requis-niveau:
 *   get:
 *     tags: [Documents Requis par Niveau]
 *     summary: Liste les documents obligatoires d'inscription (filtre ?niveau=)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: niveau
 *         schema:
 *           type: string
 *         description: "Niveau (ex: LICENCE 1, MASTER) — optionnel"
 *     responses:
 *       200:
 *         description: Liste des documents requis
 */
router.get('/', [Authenticate], DocumentRequisNiveauController.getAll)

/**
 * @openapi
 * /inscription/documents-requis-niveau:
 *   post:
 *     tags: [Documents Requis par Niveau]
 *     summary: Crée un document obligatoire pour un niveau (gestion)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [code, libelle, niveau]
 *             properties:
 *               code: { type: string }
 *               libelle: { type: string }
 *               niveau: { type: string }
 *               ordre: { type: number }
 *               obligatoire: { type: boolean }
 *     responses:
 *       201:
 *         description: Document créé
 *       403:
 *         description: Accès refusé
 */
router.post('/', [Authenticate], DocumentRequisNiveauController.create)

/**
 * @openapi
 * /inscription/documents-requis-niveau/{id}:
 *   get:
 *     tags: [Documents Requis par Niveau]
 *     summary: Récupère un document requis par id
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Document trouvé
 */
router.get('/:id', [Authenticate], DocumentRequisNiveauController.getOne)

/**
 * @openapi
 * /inscription/documents-requis-niveau/{id}:
 *   put:
 *     tags: [Documents Requis par Niveau]
 *     summary: Met à jour un document requis (gestion)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Document mis à jour
 *       403:
 *         description: Accès refusé
 */
router.put('/:id', [Authenticate], DocumentRequisNiveauController.update)

/**
 * @openapi
 * /inscription/documents-requis-niveau/{id}:
 *   delete:
 *     tags: [Documents Requis par Niveau]
 *     summary: Supprime un document requis (gestion)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Document supprimé
 *       403:
 *         description: Accès refusé
 */
router.delete('/:id', [Authenticate], DocumentRequisNiveauController.remove)

export default router
