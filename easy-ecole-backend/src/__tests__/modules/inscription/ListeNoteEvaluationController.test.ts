import { mockRequest, mockResponse } from '../../helpers/express-mocks';
import { RolesUtilisateur } from '../../../core/enums/RolesUtilisateur';
import ListeNoteEvaluationController from '../../../modules/inscription/controllers/ListeNoteEvaluationController';

jest.mock('../../../modules/inscription/models/ListeNoteEvaluation', () => {
  const ListeNoteEvaluation: any = jest.fn().mockImplementation(() => ({ save: jest.fn() }));
  ListeNoteEvaluation.findOne = jest.fn();
  return { ListeNoteEvaluation };
});

jest.mock('../../../modules/inscription/models/TypeNoteEvaluation', () => ({
  TypeNoteEvaluation: { findByPk: jest.fn() },
}));

const { ListeNoteEvaluation } = require('../../../modules/inscription/models/ListeNoteEvaluation');
const { TypeNoteEvaluation } = require('../../../modules/inscription/models/TypeNoteEvaluation');

describe('ListeNoteEvaluationController.createListeNoteEvaluation', () => {
  beforeEach(() => jest.clearAllMocks());

  it('renvoie une erreur explicite si la lecture du type échoue', async () => {
    ListeNoteEvaluation.findOne.mockResolvedValue(null);
    TypeNoteEvaluation.findByPk.mockRejectedValue(new Error('database unavailable'));
    const log = jest.spyOn(console, 'error').mockImplementation(() => undefined);
    const res = mockResponse();

    await ListeNoteEvaluationController.createListeNoteEvaluation(mockRequest({
      utilisateurRole: RolesUtilisateur.INSTITUTION,
      body: {
        typeNoteEvaluationId: 1,
        coursId: 2,
        anneeAcademiqueId: 3,
        date: '2026-10-03',
      },
    }), res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: "Erreur lors de la création de l'évaluation",
    });
    expect(ListeNoteEvaluation.mock.results[0].value.save).not.toHaveBeenCalled();
    log.mockRestore();
  });

  it('refuse une date invalide pour un examen au lieu de l’avaler', async () => {
    ListeNoteEvaluation.findOne.mockResolvedValue(null);
    TypeNoteEvaluation.findByPk.mockResolvedValue({ categorie: 'examen', libelle: 'Examen' });
    const res = mockResponse();

    await ListeNoteEvaluationController.createListeNoteEvaluation(mockRequest({
      utilisateurRole: RolesUtilisateur.INSTITUTION,
      body: {
        typeNoteEvaluationId: 1,
        coursId: 2,
        anneeAcademiqueId: 3,
        date: 'not-a-date',
      },
    }), res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: "Date d'examen invalide",
    });
    expect(ListeNoteEvaluation.mock.results[0].value.save).not.toHaveBeenCalled();
  });
});
