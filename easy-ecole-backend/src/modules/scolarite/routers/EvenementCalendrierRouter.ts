import express from "express"
import EvenementCalendrierController from "../controllers/EvenementCalendrierController"

const router = express.Router()

router
    .get('/', EvenementCalendrierController.getAll)
    .get('/type/:type', EvenementCalendrierController.getByType)
    .get('/classe/:classeId', EvenementCalendrierController.getByClasse)
    .get('/parcours/:parcoursId', EvenementCalendrierController.getByParcours)
    .post('/', EvenementCalendrierController.create)
    .post('/publier-calendrier', EvenementCalendrierController.publierCalendrier)
    .get('/:id', EvenementCalendrierController.getOne)
    .put('/:id', EvenementCalendrierController.update)
    .put('/:id/approuver', EvenementCalendrierController.approuver)
    .put('/:id/publier', EvenementCalendrierController.publierCalendrier)
    .delete('/:id', EvenementCalendrierController.delete)

export default router
