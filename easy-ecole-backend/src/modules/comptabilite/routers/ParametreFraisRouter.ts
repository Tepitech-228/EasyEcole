import express from "express"
import ParametreFraisController from "../controllers/ParametreFraisController"
import { AuthInstitution } from "../../../core/middlewares/AuthInstitution"
import CheckPermission from "../../../core/middlewares/CheckPermission"

const router = express.Router()

/**
 * @openapi
 * /comptabilite/parametres-frais:
 *   get:
 *     tags: [Paramètres de Frais]
 *     summary: Liste tous les paramètres de frais (filtres module/type en query)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Liste des paramètres de frais
 */
router
  .get('/', ParametreFraisController.getAll)

/**
 * @openapi
 * /comptabilite/parametres-frais/public:
 *   get:
 *     tags: [Paramètres de Frais]
 *     summary: Retourne uniquement les paramètres de type montant (affichage des frais)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Liste des paramètres de frais de type montant
 */
  .get('/public', ParametreFraisController.getPublic)

/**
 * @openapi
 * /comptabilite/parametres-frais/{id}:
 *   get:
 *     tags: [Paramètres de Frais]
 *     summary: Récupère un paramètre de frais par ID
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Paramètre de frais trouvé
 *       404:
 *         description: Paramètre non trouvé
 */
  .get('/:id', ParametreFraisController.get)

/**
 * @openapi
 * /comptabilite/parametres-frais:
 *   post:
 *     tags: [Paramètres de Frais]
 *     summary: Crée un nouveau paramètre de frais (admin uniquement)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - cle
 *               - libelle
 *             properties:
 *               cle:
 *                 type: string
 *               libelle:
 *                 type: string
 *               valeur:
 *                 type: number
 *               description:
 *                 type: string
 *               type:
 *                 type: string
 *                 enum: [montant, compte_comptable, pourcentage, texte]
 *               module:
 *                 type: string
 *     responses:
 *       201:
 *         description: Paramètre de frais créé
 *       400:
 *         description: Erreur de validation
 */
  .post('/', [AuthInstitution, CheckPermission('action.comptabilite.parametre-frais.creer')], ParametreFraisController.create)

/**
 * @openapi
 * /comptabilite/parametres-frais/{id}:
 *   put:
 *     tags: [Paramètres de Frais]
 *     summary: Met à jour un paramètre de frais
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               cle:
 *                 type: string
 *               libelle:
 *                 type: string
 *               valeur:
 *                 type: number
 *               description:
 *                 type: string
 *               type:
 *                 type: string
 *                 enum: [montant, compte_comptable, pourcentage, texte]
 *               module:
 *                 type: string
 *     responses:
 *       200:
 *         description: Paramètre de frais mis à jour
 *       404:
 *         description: Paramètre non trouvé
 */
  .put('/:id', [AuthInstitution, CheckPermission('action.comptabilite.parametre-frais.modifier')], ParametreFraisController.update)

/**
 * @openapi
 * /comptabilite/parametres-frais/{id}:
 *   delete:
 *     tags: [Paramètres de Frais]
 *     summary: Supprime un paramètre de frais (soft delete)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Paramètre de frais supprimé
 *       404:
 *         description: Paramètre non trouvé
 */
  .delete('/:id', [AuthInstitution, CheckPermission('action.comptabilite.parametre-frais.supprimer')], ParametreFraisController.delete)

export default router
