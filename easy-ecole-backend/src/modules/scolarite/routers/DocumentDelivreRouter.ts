import express from "express"

import DocumentController from "../controllers/DocumentController"

const router = express.Router()

router
    /**
     * @openapi
     * /scolarite/typesDocument:
     *   get:
     *     tags: [Types de document]
     *     summary: Liste tous les types de document
     *     responses:
     *       200:
     *         description: Liste des types
     */
    .get('/', DocumentController.getAllTypesDocument)
    /**
     * @openapi
     * /scolarite/typesDocument:
     *   post:
     *     tags: [Types de document]
     *     summary: Crée un nouveau type de document
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             properties:
     *               libelle:
     *                 type: string
     *               frais:
     *                 type: number
     *               format:
     *                 type: string
     *     responses:
     *       201:
     *         description: Type créé
     */
    .post('/', DocumentController.createTypeDocument)
    /**
     * @openapi
     * /scolarite/typesDocument/{id}:
     *   get:
     *     tags: [Types de document]
     *     summary: Récupère un type de document par son ID
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: string
     *     responses:
     *       200:
     *         description: Détails du type
     */
    .get('/:id', DocumentController.getTypeDocument)
    /**
     * @openapi
     * /scolarite/typesDocument/{id}:
     *   put:
     *     tags: [Types de document]
     *     summary: Met à jour un type de document
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
     *     responses:
     *       200:
     *         description: Type mis à jour
     */
    .put('/:id', DocumentController.updateTypeDocument)
    /**
     * @openapi
     * /scolarite/typesDocument/{id}:
     *   delete:
     *     tags: [Types de document]
     *     summary: Supprime un type de document
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: string
     *     responses:
     *       200:
     *         description: Type supprimé
     */
    .delete('/:id', DocumentController.deleteTypeDocument)

export default router
