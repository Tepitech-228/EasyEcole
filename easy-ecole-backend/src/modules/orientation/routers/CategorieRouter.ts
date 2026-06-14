import express from "express"

import CategorieController from "../controllers/CategorieController"
import { AuthInstitution } from "../../../core/middlewares/AuthInstitution"

const router = express.Router()

router
    .get('/', CategorieController.getAllCategories)
    .post('/', [AuthInstitution], CategorieController.createCategorie)
    .get('/:id', CategorieController.getCategorie)
    .put('/:id', [AuthInstitution], CategorieController.updateCategorie)
    .delete('/:id', [AuthInstitution], CategorieController.deleteCategorie)
    .get('/statistics/count', [AuthInstitution], CategorieController.getCount)

export default router