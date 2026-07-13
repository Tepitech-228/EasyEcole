import express from "express"
import ValidationController from "../controllers/ValidationController"

const router = express.Router()

router
    /**
     * @openapi
     * /achats/validations/en-attente:
     *   get:
     *     tags: [Achats - Validations]
     *     summary: Liste les validations en attente pour le validateur connecté
     *     security: [{ bearerAuth: [] }]
     *     responses:
     *       200:
     *         description: Liste des validations en attente
     */
    .get('/en-attente', ValidationController.getValidationsEnAttente)
    /**
     * @openapi
     * /achats/validations/{demandeId}/approuver:
     *   put:
     *     tags: [Achats - Validations]
     *     summary: Approuve une demande d'achat
     *     security: [{ bearerAuth: [] }]
     *     parameters:
     *       - in: path
     *         name: demandeId
     *         required: true
     *         schema:
     *           type: integer
     *     responses:
     *       200:
     *         description: Demande approuvée
     */
    .put('/:demandeId/approuver', ValidationController.approuver)
    /**
     * @openapi
     * /achats/validations/{demandeId}/rejeter:
     *   put:
     *     tags: [Achats - Validations]
     *     summary: Rejette une demande d'achat
     *     security: [{ bearerAuth: [] }]
     *     parameters:
     *       - in: path
     *         name: demandeId
     *         required: true
     *         schema:
     *           type: integer
     *     responses:
     *       200:
     *         description: Demande rejetée
     */
    .put('/:demandeId/rejeter', ValidationController.rejeter)

export default router
