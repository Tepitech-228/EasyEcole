import express from "express"
import multer from "multer"
import RhOffreEmploiController from "../controllers/RhOffreEmploiController"
import { AuthRessourcesHumaines } from "../../../core/middlewares/AuthRessourcesHumaines"
import Authenticate from "../../../core/middlewares/Authenticate"

const router = express.Router()
const upload = multer({ dest: "public/rh/offres/" })

router
  /**
   * @openapi
   * /rh/offres-emploi:
   *   get:
   *     tags: [RH - Offres d'emploi]
   *     summary: Liste toutes les offres d'emploi
   *     security: [{ bearerAuth: [] }]
   *     responses:
   *       200:
   *         description: Liste des offres d'emploi
   */
  .get('/', [Authenticate, AuthRessourcesHumaines], RhOffreEmploiController.getAll)
  /**
   * @openapi
   * /rh/offres-emploi/{id}:
   *   get:
   *     tags: [RH - Offres d'emploi]
   *     summary: Récupère une offre d'emploi par son ID
   *     security: [{ bearerAuth: [] }]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Détails de l'offre d'emploi
   */
  .get('/:id', [Authenticate, AuthRessourcesHumaines], RhOffreEmploiController.get)
  /**
   * @openapi
   * /rh/offres-emploi:
   *   post:
   *     tags: [RH - Offres d'emploi]
   *     summary: Crée une nouvelle offre d'emploi
   *     security: [{ bearerAuth: [] }]
   *     requestBody:
   *       required: true
   *       content:
   *         multipart/form-data:
   *           schema:
   *             type: object
   *             properties:
   *               posteId:
   *                 type: string
   *               description:
   *                 type: string
   *               dateCloture:
   *                 type: string
   *                 format: date
   *               document:
   *                 type: string
   *                 format: binary
   *     responses:
   *       201:
   *         description: Offre d'emploi créée
   */
  .post('/', [Authenticate, AuthRessourcesHumaines, upload.single('document')], RhOffreEmploiController.create)
  /**
   * @openapi
   * /rh/offres-emploi/{id}:
   *   put:
   *     tags: [RH - Offres d'emploi]
   *     summary: Met à jour une offre d'emploi
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
   *               description:
   *                 type: string
   *               dateCloture:
   *                 type: string
   *                 format: date
   *               statut:
   *                 type: string
   *     responses:
   *       200:
   *         description: Offre d'emploi mise à jour
   */
  .put('/:id', [Authenticate, AuthRessourcesHumaines], RhOffreEmploiController.update)
  /**
   * @openapi
   * /rh/offres-emploi/{id}:
   *   delete:
   *     tags: [RH - Offres d'emploi]
   *     summary: Supprime une offre d'emploi
   *     security: [{ bearerAuth: [] }]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Offre d'emploi supprimée
   */
  .delete('/:id', [Authenticate, AuthRessourcesHumaines], RhOffreEmploiController.delete)

export default router
