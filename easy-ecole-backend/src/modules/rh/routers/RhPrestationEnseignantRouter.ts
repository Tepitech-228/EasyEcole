import express from "express"
import RhPrestationEnseignantController from "../controllers/RhPrestationEnseignantController"
import { AuthRessourcesHumaines } from "../../../core/middlewares/AuthRessourcesHumaines"
import Authenticate from "../../../core/middlewares/Authenticate"

const router = express.Router()

router
  /**
   * @openapi
   * /rh/prestations-enseignant:
   *   get:
   *     tags: [RH - Prestations enseignant]
   *     summary: Liste toutes les prestations des enseignants
   *     security: [{ bearerAuth: [] }]
   *     responses:
   *       200:
   *         description: Liste des prestations
   */
  .get('/', [Authenticate, AuthRessourcesHumaines], RhPrestationEnseignantController.getAll)
  /**
   * @openapi
   * /rh/prestations-enseignant/{id}:
   *   get:
   *     tags: [RH - Prestations enseignant]
   *     summary: Récupère une prestation par son ID
   *     security: [{ bearerAuth: [] }]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Détails de la prestation
   */
  .get('/:id', [Authenticate, AuthRessourcesHumaines], RhPrestationEnseignantController.get)
  /**
   * @openapi
   * /rh/prestations-enseignant:
   *   post:
   *     tags: [RH - Prestations enseignant]
   *     summary: Crée une nouvelle prestation enseignant
   *     security: [{ bearerAuth: [] }]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               enseignantId:
   *                 type: string
   *               coursId:
   *                 type: string
   *               mois:
   *                 type: integer
   *               annee:
   *                 type: integer
   *               nombreHeures:
   *                 type: number
   *               tauxHoraire:
   *                 type: number
   *     responses:
   *       201:
   *         description: Prestation créée
   */
  .post('/', [Authenticate, AuthRessourcesHumaines], RhPrestationEnseignantController.create)
  /**
   * @openapi
   * /rh/prestations-enseignant/{id}:
   *   put:
   *     tags: [RH - Prestations enseignant]
   *     summary: Met à jour une prestation enseignant
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
   *               nombreHeures:
   *                 type: number
   *               tauxHoraire:
   *                 type: number
   *     responses:
   *       200:
   *         description: Prestation mise à jour
   */
  .put('/:id', [Authenticate, AuthRessourcesHumaines], RhPrestationEnseignantController.update)
  /**
   * @openapi
   * /rh/prestations-enseignant/{id}:
   *   delete:
   *     tags: [RH - Prestations enseignant]
   *     summary: Supprime une prestation enseignant
   *     security: [{ bearerAuth: [] }]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Prestation supprimée
   */
  .delete('/:id', [Authenticate, AuthRessourcesHumaines], RhPrestationEnseignantController.delete)
  /**
   * @openapi
   * /rh/prestations-enseignant/{id}/valider:
   *   patch:
   *     tags: [RH - Prestations enseignant]
   *     summary: Valide une prestation enseignant
   *     security: [{ bearerAuth: [] }]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Prestation validée
   */
  .patch('/:id/valider', [Authenticate, AuthRessourcesHumaines], RhPrestationEnseignantController.valider)
  /**
   * @openapi
   * /rh/prestations-enseignant/{id}/payer:
   *   patch:
   *     tags: [RH - Prestations enseignant]
   *     summary: Marque une prestation comme payée
   *     security: [{ bearerAuth: [] }]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Prestation payée
   */
  .patch('/:id/payer', [Authenticate, AuthRessourcesHumaines], RhPrestationEnseignantController.payer)

export default router
