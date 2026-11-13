import { construireSuiviRecouvrements, LigneRecouvrementAgregee } from '../../../modules/inscription/services/SuiviRecouvrementService';
import { AuthSuperviseurGeneral } from '../../../core/middlewares/AuthSuperviseurGeneral';
import { AuthSuperviseurGeneralOuAdmin } from '../../../core/middlewares/AuthSuperviseurGeneralOuAdmin';
import { RolesUtilisateur } from '../../../core/enums/RolesUtilisateur';
import { mockNext, mockRequest, mockResponse } from '../../helpers/express-mocks';

const date = (value: string): Date => new Date(`${value}T00:00:00.000Z`);

describe('construireSuiviRecouvrements', () => {
  const lignes: LigneRecouvrementAgregee[] = [
    {
      saisiParId: 1,
      date: '2026-03-02',
      nombre: 2,
      montantTotal: '1500',
      saisiPar: { nom: 'Kouassi', prenoms: 'Awa' },
    },
    {
      saisiParId: 2,
      date: '2026-03-06',
      nombre: 3,
      montantTotal: 2400,
      saisiPar: { nom: 'Yao', prenoms: 'Koffi' },
    },
    {
      saisiParId: 1,
      date: '2026-03-09',
      nombre: 4,
      montantTotal: 3200,
      saisiPar: { nom: 'Kouassi', prenoms: 'Awa' },
    },
  ];

  it('répartit les nombres par compte et conserve les jours sans recouvrement', () => {
    const result = construireSuiviRecouvrements(lignes, date('2026-03-02'), date('2026-03-08'), 'jour');

    expect(result.parCompte).toEqual([
      { utilisateurId: 2, nomComplet: 'Koffi Yao', nombreRecouvrements: 3, montantTotal: 2400 },
      { utilisateurId: 1, nomComplet: 'Awa Kouassi', nombreRecouvrements: 2, montantTotal: 1500 },
    ]);
    expect(result.evolution).toHaveLength(7);
    expect(result.evolution[0]).toEqual({
      date: '2026-03-02',
      nombreRecouvrements: 2,
      comptes: { '1': 2 },
    });
    expect(result.evolution[1]).toEqual({
      date: '2026-03-03',
      nombreRecouvrements: 0,
      comptes: {},
    });
    expect(result.totaux).toEqual({
      nombreRecouvrements: 5,
      montantTotal: 3900,
      comptesActifs: 2,
      moyenneParPeriode: 0.71,
    });
  });

  describe('AuthSuperviseurGeneral pour le suivi des recouvrements', () => {
    it('autorise le Superviseur général', () => {
      const req = mockRequest() as any;
      req.utilisateurRole = RolesUtilisateur.SUPERVISEUR_GENERAL;
      const res = mockResponse();
      const next = mockNext();

      AuthSuperviseurGeneral(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);
      expect(res.status).not.toHaveBeenCalled();
    });

    it('refuse les autres rôles', () => {
      const req = mockRequest() as any;
      req.utilisateurRole = RolesUtilisateur.ESA_COMPTA;
      const res = mockResponse();
      const next = mockNext();

      AuthSuperviseurGeneral(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Action réservée au Superviseur général',
      });
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('AuthSuperviseurGeneralOuAdmin pour le suivi des recouvrements', () => {
    it.each([RolesUtilisateur.SUPERVISEUR_GENERAL, RolesUtilisateur.ADMIN])('autorise le rôle %s', role => {
      const req = mockRequest() as any;
      req.utilisateurRole = role;
      const res = mockResponse();
      const next = mockNext();

      AuthSuperviseurGeneralOuAdmin(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);
      expect(res.status).not.toHaveBeenCalled();
    });

    it('refuse les autres rôles', () => {
      const req = mockRequest() as any;
      req.utilisateurRole = RolesUtilisateur.ESA_COMPTA;
      const res = mockResponse();
      const next = mockNext();

      AuthSuperviseurGeneralOuAdmin(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(next).not.toHaveBeenCalled();
    });
  });

  it('regroupe les contributions des comptes par semaine et ignore les lignes hors période', () => {
    const result = construireSuiviRecouvrements(lignes, date('2026-03-02'), date('2026-03-08'), 'semaine');

    expect(result.evolution).toEqual([{
      date: '2026-03-02',
      nombreRecouvrements: 5,
      comptes: { '1': 2, '2': 3 },
    }]);
    expect(result.totaux.moyenneParPeriode).toBe(5);
  });
});
