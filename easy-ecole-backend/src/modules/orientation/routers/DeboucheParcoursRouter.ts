import express from "express"
import multer from "multer"

import DeboucheParcoursController from "../controllers/DeboucheParcoursController"
import { AuthInstitution } from "../../../core/middlewares/AuthInstitution";
import CheckPermission from "../../../core/middlewares/CheckPermission";

const router = express.Router()
const upload = multer({ dest: "public/orientation/debouches/" });

router
    /**
     * @openapi
     * /orientation/debouches-parcours:
     *   get:
     *     tags: [Débouchés]
     *     summary: Liste tous les débouchés de parcours
     *     responses:
     *       200:
     *         description: Liste des débouchés
     */
    .get('/', DeboucheParcoursController.getAllDebouchesParcours)
    /**
     * @openapi
     * /orientation/debouches-parcours:
     *   post:
     *     tags: [Débouchés]
     *     summary: Crée un nouveau débouché de parcours
     *     security: [{ bearerAuth: [] }]
     *     requestBody:
     *       required: true
     *       content:
     *         multipart/form-data:
     *           schema:
     *             type: object
     *             properties:
     *               video:
     *                 type: string
     *                 format: binary
     *               titre:
     *                 type: string
     *               description:
     *                 type: string
     *     responses:
     *       201:
     *         description: Débouché créé
     */
    .post('/', [AuthInstitution, CheckPermission('action.orientation.debouche.creer'), upload.single('video')], DeboucheParcoursController.createDeboucheParcours)
    /**
     * @openapi
     * /orientation/debouches-parcours/{id}:
     *   get:
     *     tags: [Débouchés]
     *     summary: Récupère un débouché par son ID
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: string
     *     responses:
     *       200:
     *         description: Détails du débouché
     */
    .get('/:id', DeboucheParcoursController.getDeboucheParcours)
    /**
     * @openapi
     * /orientation/debouches-parcours/{id}:
     *   put:
     *     tags: [Débouchés]
     *     summary: Met à jour un débouché de parcours
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
     *         multipart/form-data:
     *           schema:
     *             type: object
     *             properties:
     *               video:
     *                 type: string
     *                 format: binary
     *               titre:
     *                 type: string
     *               description:
     *                 type: string
     *     responses:
     *       200:
     *         description: Débouché mis à jour
     */
    .put('/:id', [AuthInstitution, CheckPermission('action.orientation.debouche.modifier'), upload.single('video')], DeboucheParcoursController.updateDeboucheParcours)
    /**
     * @openapi
     * /orientation/debouches-parcours/{id}:
     *   delete:
     *     tags: [Débouchés]
     *     summary: Supprime un débouché de parcours
     *     security: [{ bearerAuth: [] }]
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: string
     *     responses:
     *       200:
     *         description: Débouché supprimé
     */
    .delete('/:id', [AuthInstitution, CheckPermission('action.orientation.debouche.supprimer')], DeboucheParcoursController.deleteDeboucheParcours)
    /**
     * @openapi
     * /orientation/debouches-parcours/statistics/count:
     *   get:
     *     tags: [Débouchés]
     *     summary: Retourne le nombre total de débouchés
     *     security: [{ bearerAuth: [] }]
     *     responses:
     *       200:
     *         description: Nombre de débouchés
     */
    .get('/statistics/count', [AuthInstitution], DeboucheParcoursController.getCount)

export default router