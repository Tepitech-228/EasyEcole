import express from "express"
import multer from "multer"

import ActualiteController from "../controllers/ActualiteController"

const router = express.Router()
const upload = multer({ dest: "public/communication/actualites/" });

router
    /**
     * @openapi
     * /communication/actualites:
     *   get:
     *     tags: [Actualités]
     *     summary: Liste toutes les actualités
     *     responses:
     *       200:
     *         description: Liste des actualités
     */
    .get('/', ActualiteController.getAllActualites)
    /**
     * @openapi
     * /communication/actualites:
     *   post:
     *     tags: [Actualités]
     *     summary: Crée une nouvelle actualité
     *     requestBody:
     *       required: true
     *       content:
     *         multipart/form-data:
     *           schema:
     *             type: object
     *             properties:
     *               titre:
     *                 type: string
     *               contenu:
     *                 type: string
     *               categorie:
     *                 type: string
     *               image:
     *                 type: string
     *                 format: binary
     *     responses:
     *       201:
     *         description: Actualité créée
     */
    .post('/', upload.single('image'), ActualiteController.createActualite)
    /**
     * @openapi
     * /communication/actualites/{id}:
     *   get:
     *     tags: [Actualités]
     *     summary: Récupère une actualité par son ID
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: string
     *     responses:
     *       200:
     *         description: Détails de l'actualité
     */
    .get('/:id', ActualiteController.getActualite)
    /**
     * @openapi
     * /communication/actualites/{id}:
     *   put:
     *     tags: [Actualités]
     *     summary: Met à jour une actualité
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
     *               titre:
     *                 type: string
     *               contenu:
     *                 type: string
     *               categorie:
     *                 type: string
     *               image:
     *                 type: string
     *                 format: binary
     *     responses:
     *       200:
     *         description: Actualité mise à jour
     */
    .put('/:id', upload.single('image'), ActualiteController.updateActualite)
    /**
     * @openapi
     * /communication/actualites/{id}:
     *   delete:
     *     tags: [Actualités]
     *     summary: Supprime une actualité
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: string
     *     responses:
     *       200:
     *         description: Actualité supprimée
     */
    .delete('/:id', ActualiteController.deleteActualite)
    /**
     * @openapi
     * /communication/actualites/statistics/count:
     *   get:
     *     tags: [Actualités]
     *     summary: Retourne le nombre total d'actualités
     *     responses:
     *       200:
     *         description: Nombre d'actualités
     */
    .get('/statistics/count', ActualiteController.getCount)

export default router
