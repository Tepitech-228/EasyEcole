import { mockRequest, mockResponse } from '../../helpers/express-mocks'

jest.mock('../../../core/helpers/DatabaseConnection')
jest.mock('../../../core/services/QrTokenService', () => ({
  QrTokenService: { verifier: jest.fn() }
}))
jest.mock('../../../modules/auth/models/Utilisateur', () => ({
  Utilisateur: { findByPk: jest.fn(), findAll: jest.fn() }
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
jest.mock('../../../modules/inscription/models/DossierEtudiant', () => ({
  DossierEtudiant: {
    findOne: jest.fn(),
    associations: { echeances: 'echeances' }
  }
}))
jest.mock('../../../modules/inscription/services/VerificationPaiementService', () => ({
  VerificationPaiementService: { verifierDossier: jest.fn() }
}))

import PointageController from '../../../modules/inscription/controllers/PointageController'
const { QrTokenService } = require('../../../core/services/QrTokenService')
const { Utilisateur } = require('../../../modules/auth/models/Utilisateur')
const { SiteUtilisateur } = require('../../../modules/auth/models/SiteUtilisateur')
const { getSurveillantSiteId } = require('../../../core/helpers/SurveillantSiteScope')
const { Pointage } = require('../../../modules/inscription/models/Pointage')
const { PointageScan } = require('../../../modules/inscription/models/PointageScan')
const { DossierEtudiant } = require('../../../modules/inscription/models/DossierEtudiant')
const { VerificationPaiementService } = require('../../../modules/inscription/services/VerificationPaiementService')

const validCode = 'CARTE|v=1|signed-payload|0123456789abcdef'

function request(body: any = {}) {
  return mockRequest({
    utilisateurRole: 'institution',
    body
  } as any)
}

beforeEach(() => {
  jest.clearAllMocks()
  const transaction = {
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
  DossierEtudiant.findOne.mockResolvedValue({ statut: 'actif', echeances: [] })
  VerificationPaiementService.verifierDossier.mockReturnValue({ statut: 'vert', message: 'Accès autorisé' })
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

  it('uses the second scan as the staff departure regardless of the requested mode', async () => {
    const update = jest.fn().mockResolvedValue(undefined)
    Pointage.findOne.mockResolvedValue({ id: 7, heureDepart: null, update })
    const res = mockResponse()

    await PointageController.pointerParQR(request({ codeQR: validCode, mode: 'arrivee' }), res)

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
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ mode: 'passage' }))
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
