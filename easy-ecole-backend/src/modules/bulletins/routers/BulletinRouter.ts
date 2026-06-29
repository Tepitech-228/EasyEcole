import { Router } from "express";
import BulletinController from "../controllers/BulletinController";
import Authenticate from "../../../core/middlewares/Authenticate";
import { AuthApprenant } from "../../../core/middlewares/AuthApprenant";
import { AuthEnseignant } from "../../../core/middlewares/AuthEnseignant";
import { AuthInstitution } from "../../../core/middlewares/AuthInstitution";
import CheckPermission from "../../../core/middlewares/CheckPermission";
import { validerGeneration, validerUpdate, validerPagination } from "../validators/BulletinValidator";

const router = Router();
const controller = new BulletinController();

/**
 * @openapi
 * /inscription/bulletins/generer:
 *   post:
 *     tags: [Bulletins]
 *     summary: Générer les bulletins
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               classeId:
 *                 type: string
 *               periodeId:
 *                 type: string
 *     responses:
 *       201:
 *         description: Bulletins générés
 *       401:
 *         description: Non autorisé
 */
router.post('/bulletins/generer', [AuthInstitution, CheckPermission('action.evaluation.bulletin.generer'), validerGeneration], controller.generer.bind(controller));
/**
 * @openapi
 * /inscription/bulletins:
 *   get:
 *     tags: [Bulletins]
 *     summary: Liste tous les bulletins
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Liste des bulletins
 *       401:
 *         description: Non autorisé
 */
router.get('/bulletins', [Authenticate], validerPagination, controller.getAll.bind(controller));
/**
 * @openapi
 * /inscription/bulletins/mon-releve:
 *   get:
 *     tags: [Bulletins]
 *     summary: Obtenir le relevé de notes de l'apprenant connecté
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Relevé de notes
 *       401:
 *         description: Non autorisé
 */
router.get('/bulletins/mon-releve', [Authenticate, AuthApprenant], controller.monReleve.bind(controller));
router.get('/bulletins/moyennes', [Authenticate], controller.getMoyennes.bind(controller));
/**
 * @openapi
 * /inscription/bulletins/{id}:
 *   get:
 *     tags: [Bulletins]
 *     summary: Obtenir un bulletin par ID
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Bulletin trouvé
 *       404:
 *         description: Bulletin non trouvé
 */
router.get('/bulletins/:id', [Authenticate], controller.getOne.bind(controller));
/**
 * @openapi
 * /inscription/bulletins/{id}:
 *   put:
 *     tags: [Bulletins]
 *     summary: Mettre à jour un bulletin
 *     security:
 *       - bearerAuth: []
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
 *               note:
 *                 type: number
 *     responses:
 *       200:
 *         description: Bulletin mis à jour
 *       401:
 *         description: Non autorisé
 */
router.put('/bulletins/:id', [AuthInstitution, CheckPermission('action.evaluation.bulletin.modifier'), validerUpdate], controller.update.bind(controller));
/**
 * @openapi
 * /inscription/bulletins/{id}/publier:
 *   put:
 *     tags: [Bulletins]
 *     summary: Publier un bulletin
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Bulletin publié
 *       401:
 *         description: Non autorisé
 */
router.put('/bulletins/:id/publier', [AuthInstitution, CheckPermission('action.evaluation.bulletin.publier')], controller.publier.bind(controller));
/**
 * @openapi
 * /inscription/bulletins/{id}:
 *   delete:
 *     tags: [Bulletins]
 *     summary: Supprimer un bulletin
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Bulletin supprimé
 *       401:
 *         description: Non autorisé
 */
router.delete('/bulletins/:id', [AuthInstitution, CheckPermission('action.evaluation.bulletin.supprimer')], controller.delete.bind(controller));

export default router;
