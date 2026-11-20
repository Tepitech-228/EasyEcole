import AffectationSalleClasseController from '../../../modules/inscription/controllers/AffectationSalleClasseController';

jest.mock('../../../modules/inscription/models/AffectationSalleClasse', () => {
  const Mock: any = jest.fn();
  Mock.findAll = jest.fn();
  Mock.associations = {
    salle: 'salle',
    classe: 'classe',
    anneeAcademique: 'anneeAcademique',
    etablissement: 'etablissement',
  };
  return { AffectationSalleClasse: Mock };
});

const { AffectationSalleClasse } = require('../../../modules/inscription/models/AffectationSalleClasse');

describe('AffectationSalleClasseController shared rooms', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    AffectationSalleClasse.findAll.mockResolvedValue([]);
  });

  it('allows the same room to be assigned to different classes in the same period', async () => {
    const conflicts = await (AffectationSalleClasseController as any).verifierChevauchement({
      salleId: 7,
      classeId: 12,
      dateDebut: '2026-09-01',
      dateFin: '2027-08-31',
      regime: 'JOUR',
    });

    expect(conflicts).toEqual([]);
    expect(AffectationSalleClasse.findAll).toHaveBeenCalledTimes(1);
    expect(AffectationSalleClasse.findAll).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          classeId: 12,
          salleId: expect.objectContaining({}),
        }),
      })
    );
  });
});
