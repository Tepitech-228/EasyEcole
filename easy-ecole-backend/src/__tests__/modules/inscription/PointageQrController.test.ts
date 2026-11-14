import { mockRequest, mockResponse } from '../../helpers/express-mocks'

jest.mock('../../../core/helpers/DatabaseConnection')
jest.mock('../../../core/services/QrTokenService', () => ({
  QrTokenService: { verifier: jest.fn() }
}))
jest.mock('../../../modules/auth/models/Utilisateur', () => ({
  Utilisateur: { findByPk: jest.fn(), findAll: jest.fn() }
}))
jest.mock('../../../modules/auth/models/Apprenant', () => ({
  Apprenant: { findOne: jest.fn() }
}))
jest.mock('../../../modules/auth/models/Enseignant', () => ({
  Enseignant: { findOne: jest.fn() }
}))
jest.mock('../../../modules/auth/models/PersonnelAdministratif', () => ({
  PersonnelAdministratif: { findOne: jest.fn() }
}))
jest.mock('../../../modules/auth/models/SiteUtilisateur', () => ({
  SiteUtilisateur: { findAll: jest.fn() }
}))
jest.mock('../../../core/helpers/SurveillantSiteScope', () => ({
  getSurveillantSiteId: jest.fn(),
}))
jest.mock('../../../modules/inscription/models/Pointage', () => ({
  Pointage: {
    findOne: jest.fn(),
    findAll: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    findByPk: jest.fn(),
    associations: { utilisateur: 'utilisateur', scans: 'scans' },
    sequelize: { transaction: jest.fn() }
  }
}))
jest.mock('../../../modules/inscription/models/PointageScan', () => ({
  PointageScan: { create: jest.fn() }
}))
jest.mock('../../../modules/inscription/models/SeancePointage', () => ({
  SeancePointage: { findOne: jest.fn(), findAll: jest.fn(), create: jest.fn() }
}))
jest.mock('../../../modules/inscription/models/Seance', () => ({
  Seance: {
    findOne: jest.fn(),
    findAll: jest.fn(),
    findByPk: jest.fn(),
    associations: { cours: 'cours' }
  }
}))
jest.mock('../../../modules/inscription/models/DossierEtudiant', () => ({
  DossierEtudiant: {
    findOne: jest.fn(),
    associations: { echeances: 'echeances' }
  }
}))
jest.mock('../../../modules/inscription/services/VerificationPaiementService', () => ({
  VerificationPaiementService: { verifierDossier: jest.fn() }
}))
jest.mock('../../../modules/inscription/services/SeancePointagePlanningService', () => ({
  __esModule: true,
  default: { trouverCoursSuivant: jest.fn() },
}))

import PointageController from '../../../modules/inscription/controllers/PointageController'
import SeancePointageConfirmationService from '../../../modules/inscription/services/SeancePointageConfirmationService'
const { QrTokenService } = require('../../../core/services/QrTokenService')
const { Utilisateur } = require('../../../modules/auth/models/Utilisateur')
const { Apprenant } = require('../../../modules/auth/models/Apprenant')
const { Enseignant } = require('../../../modules/auth/models/Enseignant')
const { PersonnelAdministratif } = require('../../../modules/auth/models/PersonnelAdministratif')
const { SiteUtilisateur } = require('../../../modules/auth/models/SiteUtilisateur')
const { getSurveillantSiteId } = require('../../../core/helpers/SurveillantSiteScope')
const { Pointage } = require('../../../modules/inscription/models/Pointage')
const { PointageScan } = require('../../../modules/inscription/models/PointageScan')
const { SeancePointage } = require('../../../modules/inscription/models/SeancePointage')
const { Seance } = require('../../../modules/inscription/models/Seance')
const { DossierEtudiant } = require('../../../modules/inscription/models/DossierEtudiant')
const { VerificationPaiementService } = require('../../../modules/inscription/services/VerificationPaiementService')
const SeancePointagePlanningService = require('../../../modules/inscription/services/SeancePointagePlanningService').default
let transaction: any

const validCode = 'CARTE|v=1|signed-payload|0123456789abcdef'

function request(body: any = {}) {
  return mockRequest({
    utilisateurRole: 'institution',
    body
  } as any)
}

beforeEach(() => {
  jest.clearAllMocks()
  transaction = {
    LOCK: { UPDATE: 'UPDATE' },
    commit: jest.fn().mockResolvedValue(undefined),
    rollback: jest.fn().mockResolvedValue(undefined)
  }
  Pointage.sequelize.transaction.mockResolvedValue(transaction)
  QrTokenService.verifier.mockReturnValue({ userId: 42, timestamp: Date.now() })
  Utilisateur.findByPk.mockResolvedValue({ id: 42, role: 'personnel_administratif' })
  Pointage.findOne.mockResolvedValue(null)
  Pointage.create.mockResolvedValue({ id: 7, heureArrivee: '08:00:00', update: jest.fn() })
  PointageScan.create.mockResolvedValue({ id: 1 })
  Pointage.update.mockResolvedValue([1])
  Pointage.findByPk.mockResolvedValue({ id: 7, heureArrivee: '08:00:00', heureDepart: '17:00:00' })
  SeancePointage.findOne.mockResolvedValue(null)
  SeancePointage.findAll.mockResolvedValue([])
  SeancePointage.create.mockResolvedValue({ id: 9 })
  Seance.findOne.mockResolvedValue(null)
  Seance.findByPk.mockResolvedValue(null)
  Seance.findAll.mockResolvedValue([])
  DossierEtudiant.findOne.mockResolvedValue({ statut: 'actif', echeances: [] })
  VerificationPaiementService.verifierDossier.mockReturnValue({ statut: 'vert', message: 'Accès autorisé' })
  SeancePointagePlanningService.trouverCoursSuivant.mockResolvedValue({
    siteActuel: 'Campus principal',
    prochainCours: null,
  })
})

describe('PointageController.pointerFinCoursByScan', () => {
  it('updates the active course and daily departure only after validating its confirmation token', async () => {
    const courseUpdate = jest.fn().mockResolvedValue(undefined)
    const dailyUpdate = jest.fn().mockResolvedValue(undefined)
    SeancePointage.findOne.mockResolvedValue({
      id: 12,
      seanceId: 81,
      heureDebutReelle: '08:15:00',
      heureFinReelle: null,
      update: courseUpdate
    })
    Seance.findByPk.mockResolvedValue({ heureFin: '09:00:00' })
    const pointage = { heureArrivee: '08:15:00', heureDepart: null, update: dailyUpdate }
    Pointage.findOne.mockResolvedValue(pointage)
    const confirmationToken = SeancePointageConfirmationService.creer({
      seancePointageId: 12,
      utilisateurId: 42,
      etablissementId: 3,
      date: '2026-10-17',
      heureFin: '08:55:00'
    })
    const res = mockResponse()

    await PointageController.pointerFinCoursByScan(request({ confirmationToken, motifDepart: 'Raison de service' }), res)

    expect(SeancePointage.findOne).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({
        id: 12,
        utilisateurId: 42,
        etablissementId: 3,
        date: '2026-10-17',
        heureFinReelle: null
      }),
      transaction
    }))
    expect(courseUpdate).toHaveBeenCalledWith({
      heureFinReelle: '08:55:00',
      motifDepart: 'Raison de service'
    }, { transaction })
    expect(dailyUpdate).toHaveBeenCalledWith({ heureDepart: '08:55:00' }, { transaction })
    expect(transaction.commit).toHaveBeenCalled()
    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      pointage,
      navigationCours: { siteActuel: 'Campus principal', prochainCours: null }
    }))
  })

  it('requires a reason to confirm a course departure before its scheduled end', async () => {
    SeancePointage.findOne.mockResolvedValue({
      id: 12,
      seanceId: 81,
      heureDebutReelle: '08:15:00',
      heureFinReelle: null,
      update: jest.fn()
    })
    Seance.findByPk.mockResolvedValue({ heureFin: '09:00:00' })
    const confirmationToken = SeancePointageConfirmationService.creer({
      seancePointageId: 12,
      utilisateurId: 42,
      etablissementId: 3,
      date: '2026-10-17',
      heureFin: '08:55:00'
    })
    const res = mockResponse()

    await PointageController.pointerFinCoursByScan(request({ confirmationToken }), res)

    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      code: 'EARLY_DEPARTURE_REASON_REQUIRED'
    }))
  })

  it('rejects course departures after the 15-minute grace period', async () => {
    SeancePointage.findOne.mockResolvedValue({
      id: 12,
      seanceId: 81,
      heureDebutReelle: '08:15:00',
      heureFinReelle: null,
      update: jest.fn()
    })
    Seance.findByPk.mockResolvedValue({ heureFin: '09:00:00' })
    const confirmationToken = SeancePointageConfirmationService.creer({
      seancePointageId: 12,
      utilisateurId: 42,
      etablissementId: 3,
      date: '2026-10-17',
      heureFin: '09:15:01'
    })
    const res = mockResponse()

    await PointageController.pointerFinCoursByScan(request({ confirmationToken }), res)

    expect(res.status).toHaveBeenCalledWith(409)
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      code: 'DEPARTURE_WINDOW_EXPIRED'
    }))
  })

  it('rejects a missing or invalid course-end confirmation token', async () => {
    const res = mockResponse()

    await PointageController.pointerFinCoursByScan(request({}), res)

    expect(res.status).toHaveBeenCalledWith(400)
    expect(SeancePointage.findOne).not.toHaveBeenCalled()
    expect(Pointage.sequelize.transaction).not.toHaveBeenCalled()
  })
})

describe('PointageController.pointerParQR', () => {
  it('rejects a missing or malformed QR without trusting a browser-supplied userId', async () => {
    const res = mockResponse()
    await PointageController.pointerParQR(request({ userId: 42, mode: 'arrivee' }), res)

    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ code: 'INVALID_REQUEST' }))
    expect(QrTokenService.verifier).not.toHaveBeenCalled()
    expect(Utilisateur.findByPk).not.toHaveBeenCalled()
  })

  describe('PointageController access surveillant', () => {
    it('limite l’historique aux utilisateurs affectés au site actif', async () => {
      getSurveillantSiteId.mockResolvedValue(3)
      SiteUtilisateur.findAll.mockResolvedValue([{ utilisateurId: 42 }, { utilisateurId: 43 }])
      Utilisateur.findAll.mockResolvedValue([{ id: 42 }, { id: 43 }])
      Pointage.findAll.mockResolvedValue([])
      const req = mockRequest({
        utilisateurRole: 'surveillant',
        utilisateurId: 8,
        etablissementId: 3,
      } as any)
      const res = mockResponse()

      await PointageController.getAllPointages(req, res)

      expect(Pointage.findAll).toHaveBeenCalledWith(expect.objectContaining({
        where: {
          utilisateurId: { [require('sequelize').Op.in]: [42, 43] }
        }
      }))
      expect(Utilisateur.findAll).toHaveBeenCalledWith(expect.objectContaining({
        where: expect.objectContaining({
          [require('sequelize').Op.or]: expect.arrayContaining([
            { etablissementId: 3 },
            { id: { [require('sequelize').Op.in]: [42, 43] } },
          ])
        })
      }))
      expect(res.status).toHaveBeenCalledWith(200)
    })

    it('refuse l’historique sans site actif affecté', async () => {
      getSurveillantSiteId.mockResolvedValue(null)
      const req = mockRequest({
        utilisateurRole: 'surveillant',
        utilisateurId: 8,
        etablissementId: 99,
      } as any)
      const res = mockResponse()

      await PointageController.getAllPointages(req, res)

      expect(res.status).toHaveBeenCalledWith(403)
      expect(Pointage.findAll).not.toHaveBeenCalled()
    })

    it('applique le même périmètre au rapport de pointage', async () => {
      getSurveillantSiteId.mockResolvedValue(3)
      SiteUtilisateur.findAll.mockResolvedValue([{ utilisateurId: 42 }])
      Utilisateur.findAll.mockResolvedValue([{ id: 42 }])
      Pointage.findAll.mockResolvedValue([])
      const req = mockRequest({
        utilisateurRole: 'surveillant',
        utilisateurId: 8,
        etablissementId: 3,
        query: {},
      } as any)
      const res = mockResponse()

      await PointageController.getRapport(req, res)

      expect(Pointage.findAll).toHaveBeenCalledWith(expect.objectContaining({
        where: expect.objectContaining({
          utilisateurId: { [require('sequelize').Op.in]: [42] }
        })
      }))
      expect(res.status).toHaveBeenCalledWith(200)
    })
  })

  describe('PointageController.verifierStatutByQR', () => {
    it('returns the student matricule and photo details for a signed QR', async () => {
      DossierEtudiant.findOne.mockResolvedValue({
        utilisateurId: 42,
        matricule: 'MAT-2026-042',
        photo: 'student-photo.jpg',
        utilisateur: {
          id: 42,
          nom: 'Doe',
          prenoms: 'Jane',
          role: 'apprenant'
        },
        echeances: []
      })
      Apprenant.findOne.mockResolvedValue({ photo: 'fallback-photo.jpg' })
      const req = mockRequest({
        utilisateurRole: 'institution',
        params: { codeQR: validCode }
      } as any)
      const res = mockResponse()

      await PointageController.verifierStatutByQR(req, res)

      expect(res.status).toHaveBeenCalledWith(200)
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        statut: 'vert',
        utilisateurId: 42,
        matricule: 'MAT-2026-042',
        nom: 'Doe',
        prenoms: 'Jane',
        role: 'apprenant',
        photo: 'student-photo.jpg',
        photoType: 'apprenant'
      }))
    })

    it('uses the teacher profile photo when no dedicated teacher photo exists', async () => {
      DossierEtudiant.findOne.mockResolvedValue(null)
      Enseignant.findOne.mockResolvedValue({ matricule: 'ETB-GEN-ST-0002', photo: null })
      PersonnelAdministratif.findOne.mockResolvedValue(null)
      Utilisateur.findByPk.mockResolvedValue({
        id: 42,
        role: 'enseignant',
        nom: 'Yawo',
        prenoms: 'Kossi',
        photoDeProfil: 'teacher-profile.jpg'
      })
      const req = mockRequest({
        utilisateurRole: 'institution',
        params: { codeQR: validCode }
      } as any)
      const res = mockResponse()

      await PointageController.verifierStatutByQR(req, res)

      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        statut: 'vert',
        matricule: 'ETB-GEN-ST-0002',
        photo: 'teacher-profile.jpg',
        photoType: 'profile'
      }))
    })
  })

  it('rejects an invalid signed QR', async () => {
    QrTokenService.verifier.mockReturnValue(null)
    const res = mockResponse()

    await PointageController.pointerParQR(request({ codeQR: 'forged', mode: 'arrivee' }), res)

    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ code: 'INVALID_QR' }))
    expect(Utilisateur.findByPk).not.toHaveBeenCalled()
  })

  it('derives the target identity from the verified QR and registers an arrival', async () => {
    const res = mockResponse()

    await PointageController.pointerParQR(request({
      codeQR: validCode,
      mode: 'arrivee',
      userId: 999
    }), res)

    expect(QrTokenService.verifier).toHaveBeenCalledWith(validCode)
    expect(Utilisateur.findByPk).toHaveBeenCalledWith(42)
    expect(Pointage.create).toHaveBeenCalledWith(
      expect.objectContaining({ utilisateurId: 42 }),
      expect.objectContaining({ transaction: expect.any(Object) })
    )
    expect(res.status).toHaveBeenCalledWith(201)
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      success: true,
      mode: 'arrivee',
      pointage: expect.objectContaining({ id: 7 })
    }))
  })

  it('refuses an unprogrammed teacher QR without creating a daily attendance', async () => {
    jest.useFakeTimers().setSystemTime(new Date('2026-11-13T10:00:00.000Z'))
    Utilisateur.findByPk.mockResolvedValue({ id: 42, role: 'enseignant' })
    Enseignant.findOne.mockResolvedValue({ id: 9 })
    const req = mockRequest({
      utilisateurRole: 'institution',
      etablissementId: 3,
      body: { codeQR: validCode }
    } as any)
    const res = mockResponse()

    await PointageController.pointerParQR(req, res)

    expect(Seance.findAll).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({
        enseignantId: 9,
        etablissementId: 3,
        jourSemaine: '5',
        publieeLe: expect.any(Object)
      })
    }))
    expect(res.status).toHaveBeenCalledWith(403)
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      code: 'NOT_PROGRAMMED',
      message: expect.stringContaining('Aucun pointage n’a été enregistré')
    }))
    expect(SeancePointage.create).not.toHaveBeenCalled()
    expect(Pointage.create).not.toHaveBeenCalled()
    expect(transaction.rollback).toHaveBeenCalled()
    jest.useRealTimers()
  })

  it('records a teacher QR scan against the scheduled lesson', async () => {
    jest.useFakeTimers().setSystemTime(new Date('2026-11-13T10:00:00.000Z'))
    Utilisateur.findByPk.mockResolvedValue({ id: 42, role: 'enseignant' })
    Enseignant.findOne.mockResolvedValue({ id: 9 })
    Seance.findAll.mockResolvedValue([{
      id: 81,
      titre: 'Cours planifié',
      heureDebut: '09:00:00',
      heureFin: '11:00:00',
      cours: { intitule: 'Mathématiques' }
    }])
    const req = mockRequest({
      utilisateurRole: 'institution',
      etablissementId: 3,
      body: { codeQR: validCode }
    } as any)
    const res = mockResponse()

    await PointageController.pointerParQR(req, res)

    expect(SeancePointage.create).toHaveBeenCalledWith(expect.objectContaining({
      seanceId: 81,
      date: '2026-11-13',
      enseignantId: '9',
      utilisateurId: 42,
      etablissementId: 3,
      heureDebutReelle: '10:00:00',
      heureFinReelle: null
    }), expect.objectContaining({ transaction }))
    expect(Pointage.create).toHaveBeenCalled()
    expect(transaction.commit).toHaveBeenCalled()
    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      mode: 'arrivee',
      seancePointage: expect.objectContaining({
        action: 'debut',
        cours: 'Mathématiques',
        heureReelle: '10:00:00'
      })
    }))
    jest.useRealTimers()
  })

  it('asks for confirmation before ending an active teacher lesson by QR', async () => {
    jest.useFakeTimers().setSystemTime(new Date('2026-11-13T10:00:00.000Z'))
    Utilisateur.findByPk.mockResolvedValue({ id: 42, role: 'enseignant' })
    Enseignant.findOne.mockResolvedValue({ id: 9 })
    SeancePointage.findAll.mockResolvedValue([{
      id: 11,
      seanceId: 81,
      heureDebutReelle: '09:05:00'
    }])
    Seance.findOne.mockResolvedValue({
      id: 81,
      titre: 'Cours planifié',
      heureDebut: '09:00:00',
      heureFin: '11:00:00',
      cours: { intitule: 'Mathématiques' }
    })
    const req = mockRequest({
      utilisateurRole: 'institution',
      etablissementId: 3,
      body: { codeQR: validCode }
    } as any)
    const res = mockResponse()

    await PointageController.pointerParQR(req, res)

    const response = (res.json as jest.Mock).mock.calls[0][0]
    expect(response).toEqual(expect.objectContaining({
      requiresConfirmation: true,
      mode: 'depart',
      heureDepart: '10:00:00',
      seancePointage: expect.objectContaining({
        action: 'fin',
        seanceId: 81,
        cours: 'Mathématiques',
        heureDebutReelle: '09:05:00'
      })
    }))
    expect(response.confirmationToken).toEqual(expect.any(String))
    expect(transaction.rollback).toHaveBeenCalled()
    expect(Pointage.create).not.toHaveBeenCalled()
    expect(SeancePointage.create).not.toHaveBeenCalled()
    jest.useRealTimers()
  })

  it('rejects an authenticated but unknown QR identity', async () => {
    Utilisateur.findByPk.mockResolvedValue(null)
    const res = mockResponse()

    await PointageController.pointerParQR(request({ codeQR: validCode, mode: 'arrivee' }), res)

    expect(res.status).toHaveBeenCalledWith(404)
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ code: 'USER_NOT_FOUND' }))
    expect(Pointage.create).not.toHaveBeenCalled()
  })

  it('preserves the student eligibility rule and blocks suspended-payment status', async () => {
    Utilisateur.findByPk.mockResolvedValue({ id: 42, role: 'apprenant' })
    VerificationPaiementService.verifierDossier.mockReturnValue({
      statut: 'rouge',
      message: 'Échéance impayée'
    })
    const res = mockResponse()

    await PointageController.pointerParQR(request({ codeQR: validCode, mode: 'arrivee' }), res)

    expect(DossierEtudiant.findOne).toHaveBeenCalled()
    expect(res.status).toHaveBeenCalledWith(403)
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ code: 'ATTENDANCE_NOT_ALLOWED' }))
    expect(Pointage.create).not.toHaveBeenCalled()
  })

  it('allows QR attendance and returns a warning for a partially paid installment', async () => {
    Utilisateur.findByPk.mockResolvedValue({ id: 42, role: 'apprenant' })
    VerificationPaiementService.verifierDossier.mockReturnValue({
      statut: 'vert',
      message: 'Accès autorisé',
      avertissementPaiement: 'Échéance mois 2 partiellement payée.'
    })
    const res = mockResponse()

    await PointageController.pointerParQR(request({ codeQR: validCode, mode: 'arrivee' }), res)

    expect(Pointage.create).toHaveBeenCalled()
    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      success: true,
      avertissementPaiement: 'Échéance mois 2 partiellement payée.'
    }))
  })

  it('uses the second scan as the staff departure after confirmation', async () => {
    const update = jest.fn().mockResolvedValue(undefined)
    Pointage.findOne.mockResolvedValue({ id: 7, heureDepart: null, update })
    const first = mockResponse()

    await PointageController.pointerParQR(request({ codeQR: validCode, mode: 'arrivee' }), first)

    expect(first.status).toHaveBeenCalledWith(200)
    expect(first.json).toHaveBeenCalledWith(expect.objectContaining({ requiresConfirmation: true, mode: 'depart' }))
    expect(update).not.toHaveBeenCalled()
    const confirmationToken = (first.json as unknown as jest.Mock).mock.calls[0][0].confirmationToken
    expect(confirmationToken).toEqual(expect.any(String))

    const res = mockResponse()
    await PointageController.pointerParQR(request({ codeQR: validCode, mode: 'arrivee', confirmationToken }), res)

    expect(update).toHaveBeenCalledWith(expect.objectContaining({ heureDepart: expect.any(String) }), expect.any(Object))
    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ mode: 'depart' }))
    expect(PointageScan.create).not.toHaveBeenCalled()
  })

  it('rejects a third staff scan after arrival and departure', async () => {
    Pointage.findOne.mockResolvedValue({ id: 7, heureDepart: '17:00:00' })
    const res = mockResponse()

    await PointageController.pointerParQR(request({ codeQR: validCode, mode: 'depart' }), res)

    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ code: 'ALREADY_EXISTS' }))
  })

  it('records every student scan as a passage without touching the departure', async () => {
    jest.useFakeTimers().setSystemTime(new Date('2026-10-20T12:00:00'))
    Utilisateur.findByPk.mockResolvedValue({ id: 42, role: 'apprenant' })
    const update = jest.fn().mockResolvedValue(undefined)
    Pointage.findOne.mockResolvedValue({ id: 7, heureArrivee: '08:00:00', heureDepart: '09:00:00', update })
    const res = mockResponse()

    await PointageController.pointerParQR(request({ codeQR: validCode, mode: 'arrivee' }), res)

    expect(update).not.toHaveBeenCalled()
    expect(PointageScan.create).toHaveBeenCalledWith(
      expect.objectContaining({ pointageId: 7, heure: expect.any(String) }),
      expect.any(Object)
    )
    expect(res.status).toHaveBeenCalledWith(200)
    const heureScan = PointageScan.create.mock.calls[0][0].heure
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      mode: 'passage',
      heureEvenement: heureScan
    }))
    jest.useRealTimers()
  })

  it('registers the first student scan as a passage and first history event', async () => {
    Utilisateur.findByPk.mockResolvedValue({ id: 42, role: 'apprenant' })
    const res = mockResponse()

    await PointageController.pointerParQR(request({ codeQR: validCode }), res)

    expect(Pointage.create).toHaveBeenCalledWith(expect.objectContaining({
      utilisateurId: 42,
      heureArrivee: expect.any(String)
    }), expect.any(Object))
    expect(PointageScan.create).toHaveBeenCalled()
    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ mode: 'passage' }))
  })
})
