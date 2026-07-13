import express from "express"
import multer from "multer"

import ParcoursController from "../controllers/ParcoursController"
import { AuthInstitution } from "../../../core/middlewares/AuthInstitution";
import CheckPermission from "../../../core/middlewares/CheckPermission";

const router = express.Router()
const upload = multer({ dest: "public/orientation/parcours/" });

router
    /**
     * @openapi
     * /orientation/parcours:
     *   get:
     *     tags: [Parcours]
     *     summary: Liste tous les parcours
     *     responses:
     *       200:
     *         description: Liste des parcours
     */
    .get('/', ParcoursController.getAllParcours)
    /**
     * @openapi
     * /orientation/parcours:
     *   post:
     *     tags: [Parcours]
     *     summary: Crée un nouveau parcours avec image et/ou vidéo
     *     security: [{ bearerAuth: [] }]
     *     requestBody:
     *       required: true
     *       content:
     *         multipart/form-data:
     *           schema:
     *             type: object
     *             properties:
     *               image:
     *                 type: string
     *                 format: binary
     *               video:
     *                 type: string
     *                 format: binary
     *               titre:
     *                 type: string
     *               description:
     *                 type: string
     *               categorieId:
     *                 type: string
     *     responses:
     *       201:
     *         description: Parcours créé
     */
    .post('/', [AuthInstitution, CheckPermission('action.orientation.parcours.creer'), upload.fields([{name: 'image', maxCount: 1}, {name: 'video', maxCount: 1}])], ParcoursController.createParcours)
    /**
     * @openapi
     * /orientation/parcours/{id}:
     *   get:
     *     tags: [Parcours]
     *     summary: Récupère un parcours par son ID
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: string
     *     responses:
     *       200:
     *         description: Détails du parcours
     */
    .get('/:id', ParcoursController.getParcours)
    /**
     * @openapi
     * /orientation/parcours/{id}:
     *   put:
     *     tags: [Parcours]
     *     summary: Met à jour un parcours avec image et/ou vidéo
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
     *               image:
     *                 type: string
     *                 format: binary
     *               video:
     *                 type: string
     *                 format: binary
     *               titre:
     *                 type: string
     *               description:
     *                 type: string
     *     responses:
     *       200:
     *         description: Parcours mis à jour
     */
    .put('/:id', [AuthInstitution, CheckPermission('action.orientation.parcours.modifier'), upload.fields([{name: 'image', maxCount: 1}, {name: 'video', maxCount: 1}])], ParcoursController.updateParcours)
    /**
     * @openapi
     * /orientation/parcours/{id}:
     *   delete:
     *     tags: [Parcours]
     *     summary: Supprime un parcours
     *     security: [{ bearerAuth: [] }]
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: string
     *     responses:
     *       200:
     *         description: Parcours supprimé
     */
    .delete('/:id', [AuthInstitution, CheckPermission('action.orientation.parcours.supprimer')], ParcoursController.deleteParcours)
    /**
     * @openapi
     * /orientation/parcours/statistics/count:
     *   get:
     *     tags: [Parcours]
     *     summary: Retourne le nombre total de parcours
     *     security: [{ bearerAuth: [] }]
     *     responses:
     *       200:
     *         description: Nombre de parcours
     */
    .get('/statistics/count', [AuthInstitution], ParcoursController.getCount)

export default router