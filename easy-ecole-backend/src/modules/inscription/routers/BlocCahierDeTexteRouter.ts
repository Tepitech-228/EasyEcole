import express from "express"

import BlocCahierDeTexteController from "../controllers/BlocCahierDeTexteController"

const router = express.Router()

router
    .get('/', BlocCahierDeTexteController.getAllBlocsCahierDeTextes)
    .post('/', [], BlocCahierDeTexteController.createBlocCahierDeTexte)
    .get('/:id', BlocCahierDeTexteController.getBlocCahierDeTexte)
    .put('/:id', [], BlocCahierDeTexteController.updateBlocCahierDeTexte)
    .delete('/:id', [], BlocCahierDeTexteController.deleteBlocCahierDeTexte)
    .get('/statistics/count', [], BlocCahierDeTexteController.getCount)

export default router