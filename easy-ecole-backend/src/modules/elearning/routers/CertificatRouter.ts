import express from "express"
import { AuthInstitution } from "../../../core/middlewares/AuthInstitution"
import CertificatController from "../controllers/CertificatController"
import Authenticate from "../../../core/middlewares/Authenticate"

const router = express.Router()
router
  .get('/', [Authenticate], CertificatController.getAll)
  .post('/', [Authenticate, AuthInstitution], CertificatController.create)
  .delete('/:id', [Authenticate, AuthInstitution], CertificatController.delete)

export default router
