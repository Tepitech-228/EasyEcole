import express from "express"
import ValidationController from "../controllers/ValidationController"

const router = express.Router()

router
    /**
     * @openapi
     * /achats/validateurs:
     *   get:
     *     tags: [Achats - Validateurs]
     *     summary: Liste tous les validateurs actifs
     *     security: [{ bearerAuth: [] }]
     *     responses:
     *       200:
     *         description: Liste des validateurs
     */
    .get('/', ValidationController.getValidateurs)
    /**
     * @openapi
     * /achats/validateurs:
     *   post:
     *     tags: [Achats - Validateurs]
     *     summary: Ajoute un validateur
     *     security: [{ bearerAuth: [] }]
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             properties:
     *               utilisateurId:
     *                 type: integer
     *               niveau:
     *                 type: integer
     *               montantMax:
     *                 type: number
     *               actif:
     *                 type: boolean
     *     responses:
     *       201:
     *         description: Validateur créé
     */
    .post('/', ValidationController.createValidateur)
    /**
     * @openapi
     * /achats/validateurs/{id}:
     *   put:
     *     tags: [Achats - Validateurs]
     *     summary: Modifie un validateur
     *     security: [{ bearerAuth: [] }]
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: integer
     *     responses:
     *       200:
     *         description: Validateur modifié
     */
    .put('/:id', ValidationController.updateValidateur)
    /**
     * @openapi
     * /achats/validateurs/{id}:
     *   delete:
     *     tags: [Achats - Validateurs]
     *     summary: Supprime un validateur
     *     security: [{ bearerAuth: [] }]
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: integer
     *     responses:
     *       200:
     *         description: Validateur supprimé
     */
    .delete('/:id', ValidationController.deleteValidateur)

export default router
