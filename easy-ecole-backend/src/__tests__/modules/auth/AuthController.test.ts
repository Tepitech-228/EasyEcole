import { mockRequest, mockResponse } from '../../helpers/express-mocks'
import AuthController from '../../../modules/auth/controllers/AuthController'

jest.mock('jsonwebtoken', () => ({
  sign: jest.fn(),
  verify: jest.fn(),
}))

jest.mock('bcrypt', () => ({
  compareSync: jest.fn(),
  hashSync: jest.fn(),
}))

const mockUtilSave = jest.fn()
const mockUtilUpdate = jest.fn()

jest.mock('../../../modules/auth/models/Utilisateur', () => {
  const MockUtilisateur: any = jest.fn(() => ({
    save: mockUtilSave,
    update: mockUtilUpdate,
  }))
  MockUtilisateur.findOne = jest.fn()
  return { Utilisateur: MockUtilisateur }
})

jest.mock('../../../modules/auth/models/Enseignant', () => ({
  Enseignant: { create: jest.fn() },
}))

jest.mock('../../../core/helpers/EmailSender', () => ({
  EmailSender: {
    getInstance: jest.fn().mockReturnValue({
      sendMessageInscriptionEnseignant: jest.fn(),
      sendEmailConfirmLink: jest.fn().mockResolvedValue(undefined),
      sendPasswordResetLink: jest.fn().mockResolvedValue(undefined),
    }),
  },
}))

jest.mock('../../../core/helpers/IDGenerator', () => ({
  IDGenerator: {
    getInstance: jest.fn().mockReturnValue({
      generateMotDePasseUtilisateur: jest.fn().mockReturnValue('TempPass123!'),
    }),
  },
}))

const jwt = require('jsonwebtoken')
const bcrypt = require('bcrypt')
const { Utilisateur } = require('../../../modules/auth/models/Utilisateur')
const { Enseignant } = require('../../../modules/auth/models/Enseignant')
beforeEach(() => {
  jest.clearAllMocks()
})

describe('AuthController.getEmailConfirmationToken', () => {
  it('génère un token JWT avec id et email', () => {
    ;(jwt.sign as jest.Mock).mockReturnValue('mocked-token')

    const token = AuthController.getEmailConfirmationToken('123', 'test@test.com')

    expect(jwt.sign).toHaveBeenCalledWith(
      expect.objectContaining({
        exp: expect.any(Number),
        data: { id: '123', email: 'test@test.com' },
      }),
      expect.any(String)
    )
    expect(token).toBe('mocked-token')
  })
})

describe('AuthController.login', () => {
  it('retourne 404 si utilisateur introuvable', async () => {
    const req = mockRequest({ body: { email: 'inconnu@test.com', motDePasse: 'pass' } })
    const res = mockResponse()
    ;(Utilisateur.findOne as jest.Mock).mockResolvedValue(null)

    await AuthController.login(req, res)

    expect(res.status).toHaveBeenCalledWith(404)
    expect(res.json).toHaveBeenCalledWith({ message: 'Utilisateur non trouvé' })
  })

  it('retourne 400 si mot de passe incorrect', async () => {
    const req = mockRequest({ body: { email: 'test@test.com', motDePasse: 'wrong' } })
    const res = mockResponse()
    ;(Utilisateur.findOne as jest.Mock).mockResolvedValue({ id: 1, motDePasse: 'hashed', email: 'test@test.com', identifiant: 'user1', role: 'apprenant' })
    ;(bcrypt.compareSync as jest.Mock).mockReturnValue(false)

    await AuthController.login(req, res)

    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledWith({ message: 'Erreur' })
  })

  it('retourne 200 avec token si identifiants valides', async () => {
    const req = mockRequest({ body: { email: 'test@test.com', motDePasse: 'correct' } })
    const res = mockResponse()
    ;(Utilisateur.findOne as jest.Mock).mockResolvedValue({ id: 1, motDePasse: 'hashed', email: 'test@test.com', identifiant: 'user1', role: 'apprenant' })
    ;(bcrypt.compareSync as jest.Mock).mockReturnValue(true)
    ;(jwt.sign as jest.Mock).mockReturnValue('jwt-token-123')

    await AuthController.login(req, res)

    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.json).toHaveBeenCalledWith({ identifiant: 'user1', token: 'jwt-token-123' })
  })

  it('retourne 500 en cas d\'erreur', async () => {
    const req = mockRequest({ body: { email: 'test@test.com', motDePasse: 'pass' } })
    const res = mockResponse()
    ;(Utilisateur.findOne as jest.Mock).mockRejectedValue(new Error('DB error'))

    await AuthController.login(req, res)

    expect(res.status).toHaveBeenCalledWith(500)
  })
})

describe('AuthController.register', () => {
  it('retourne 400 si identifiant ou email manquant', async () => {
    const req = mockRequest({ body: { nom: 'Test' } })
    const res = mockResponse()

    await AuthController.register(req, res)

    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledWith({ emptyField: true })
  })

  it('retourne 400 si email déjà utilisé', async () => {
    const req = mockRequest({ body: { identifiant: 'newuser', email: 'existing@test.com', nom: 'Test', prenoms: 'User', motDePasse: 'pass123' } })
    const res = mockResponse()
    ;(Utilisateur.findOne as jest.Mock).mockResolvedValue({ id: 1 })

    await AuthController.register(req, res)

    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ emailAlreadyUsed: true }))
  })

  it('crée un utilisateur et retourne 201', async () => {
    const req = mockRequest({ body: { identifiant: 'newuser', email: 'new@test.com', nom: 'Test', prenoms: 'User', motDePasse: 'pass123', contact: '123456' } })
    const res = mockResponse()
    ;(Utilisateur.findOne as jest.Mock).mockResolvedValue(null)
    mockUtilSave.mockResolvedValue({ id: 1, identifiant: 'newuser' })

    await AuthController.register(req, res)

    expect(mockUtilSave).toHaveBeenCalled()
    expect(res.status).toHaveBeenCalledWith(201)
    expect(res.send).toHaveBeenCalledWith({ success: true })
  })

  it('retourne 400 si la sauvegarde échoue', async () => {
    const req = mockRequest({ body: { identifiant: 'newuser', email: 'new@test.com', nom: 'Test', prenoms: 'User', motDePasse: 'pass123' } })
    const res = mockResponse()
    ;(Utilisateur.findOne as jest.Mock).mockResolvedValue(null)
    mockUtilSave.mockRejectedValue(new Error('Save error'))

    await AuthController.register(req, res)

    expect(res.status).toHaveBeenCalledWith(400)
  })
})

describe('AuthController.registerEnseignant', () => {
  it('retourne 400 si champs requis manquants', async () => {
    const req = mockRequest({ body: { utilisateur: { nom: 'Test' } } })
    const res = mockResponse()

    await AuthController.registerEnseignant(req, res)

    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledWith({ emptyField: true })
  })

  it('crée un enseignant et retourne 201', async () => {
    const req = mockRequest({
      body: {
        utilisateur: { identifiant: 'teacher1', email: 'teacher@test.com', nom: 'Jean', prenoms: 'Dupont', contact: '123456' },
      },
    })
    const res = mockResponse()
    ;(Utilisateur.findOne as jest.Mock).mockResolvedValue(null)
    ;(Enseignant.create as jest.Mock).mockResolvedValue({ id: 1 })
    ;(bcrypt.hashSync as jest.Mock).mockReturnValue('hashed-temp-pass')
    mockUtilSave.mockResolvedValue({ id: 1 })

    await AuthController.registerEnseignant(req, res)

    expect(mockUtilSave).toHaveBeenCalled()
    expect(Enseignant.create).toHaveBeenCalledWith({ utilisateurId: 1 })
    expect(res.status).toHaveBeenCalledWith(201)
    expect(res.send).toHaveBeenCalledWith({ success: true })
  })
})

describe('AuthController.emailConfirm', () => {
  it('retourne 404 si token invalide', async () => {
    const req = mockRequest({ query: { token: 'bad-token' } })
    const res = mockResponse()
    ;(jwt.verify as jest.Mock).mockImplementation(() => { throw new Error('invalid') })

    await AuthController.emailConfirm(req, res)

    expect(res.status).toHaveBeenCalledWith(404)
  })

  it('confirme l\'email si token valide', async () => {
    const req = mockRequest({ query: { token: 'valid-token' } })
    const res = mockResponse()
    ;(jwt.verify as jest.Mock).mockReturnValue({ data: { id: '1', email: 'test@test.com' } })
    mockUtilUpdate.mockResolvedValue({})
    ;(Utilisateur.findOne as jest.Mock).mockResolvedValue({ id: 1, dateVerificationEmail: undefined, update: mockUtilUpdate })

    await AuthController.emailConfirm(req, res)

    expect(mockUtilUpdate).toHaveBeenCalledWith({ dateVerificationEmail: expect.any(Date) })
    expect(res.sendStatus).toHaveBeenCalledWith(200)
  })
})

describe('AuthController.sendPasswordResetLink', () => {
  it('retourne 400 si email ou redirectTo manquant', async () => {
    const req = mockRequest({ query: {} })
    const res = mockResponse()

    await AuthController.sendPasswordResetLink(req, res)

    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledWith({ success: false })
  })

  it('retourne 404 si utilisateur introuvable', async () => {
    const req = mockRequest({ query: { email: 'inconnu@test.com', redirectTo: 'http://example.com' } })
    const res = mockResponse()
    ;(Utilisateur.findOne as jest.Mock).mockResolvedValue(null)

    await AuthController.sendPasswordResetLink(req, res)

    expect(res.status).toHaveBeenCalledWith(404)
  })

  it('retourne 400 si email non vérifié', async () => {
    const req = mockRequest({ query: { email: 'test@test.com', redirectTo: 'http://example.com' } })
    const res = mockResponse()
    ;(Utilisateur.findOne as jest.Mock).mockResolvedValue({ id: 1, email: 'test@test.com', identifiant: 'user1', dateVerificationEmail: undefined })

    await AuthController.sendPasswordResetLink(req, res)

    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledWith({ success: false, message: 'Email non vérifié' })
  })

  it('envoie le lien si email vérifié', async () => {
    const req = mockRequest({ query: { email: 'test@test.com', redirectTo: 'http://example.com' } })
    const res = mockResponse()
    ;(Utilisateur.findOne as jest.Mock).mockResolvedValue({ id: 1, email: 'test@test.com', identifiant: 'user1', dateVerificationEmail: new Date() })
    ;(jwt.sign as jest.Mock).mockReturnValue('reset-token')

    await AuthController.sendPasswordResetLink(req, res)

    expect(res.sendStatus).toHaveBeenCalledWith(200)
  })
})

describe('AuthController.passwordReset', () => {
  it('retourne 400 si ancien mot de passe incorrect', async () => {
    const req = mockRequest({ body: { oldPassword: 'wrong', password: 'newpass' } })
    const res = mockResponse()
    ;(Utilisateur.findOne as jest.Mock).mockResolvedValue({ id: 1, motDePasse: 'hashed-old' })
    ;(bcrypt.compareSync as jest.Mock).mockReturnValue(false)

    await AuthController.passwordReset(req, res)

    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledWith({ passwordWrong: true })
  })

  it('met à jour le mot de passe si ancien correct', async () => {
    const req = mockRequest({ body: { oldPassword: 'correct', password: 'newpass' } })
    const res = mockResponse()
    ;(Utilisateur.findOne as jest.Mock).mockResolvedValue({ id: 1, motDePasse: 'hashed-old', update: mockUtilUpdate })
    ;(bcrypt.compareSync as jest.Mock).mockReturnValue(true)
    ;(bcrypt.hashSync as jest.Mock).mockReturnValue('hashed-new')
    mockUtilUpdate.mockResolvedValue({})

    await AuthController.passwordReset(req, res)

    expect(mockUtilUpdate).toHaveBeenCalledWith({ motDePasse: 'hashed-new' })
    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.json).toHaveBeenCalledWith({ success: true })
  })

  it('retourne 404 si utilisateur introuvable', async () => {
    const req = mockRequest({ body: { oldPassword: 'correct', password: 'newpass' } })
    const res = mockResponse()
    ;(Utilisateur.findOne as jest.Mock).mockResolvedValue(null)

    await AuthController.passwordReset(req, res)

    expect(res.status).toHaveBeenCalledWith(404)
  })
})

describe('AuthController.passwordResetWithToken', () => {
  it('retourne 400 si token ou motDePasse manquant', async () => {
    const req = mockRequest({ body: {} })
    const res = mockResponse()

    await AuthController.passwordResetWithToken(req, res)

    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledWith({ success: false, message: 'Token et mot de passe requis' })
  })

  it('retourne 400 si token invalide', async () => {
    const req = mockRequest({ body: { token: 'bad', motDePasse: 'newpass' } })
    const res = mockResponse()
    ;(jwt.verify as jest.Mock).mockImplementation(() => { throw new Error('invalid') })

    await AuthController.passwordResetWithToken(req, res)

    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledWith({ success: false, message: 'Token invalide ou expiré' })
  })

  it('réinitialise le mot de passe avec token valide', async () => {
    const req = mockRequest({ body: { token: 'valid', motDePasse: 'newpass' } })
    const res = mockResponse()
    ;(jwt.verify as jest.Mock).mockReturnValue({ data: { email: 'test@test.com' } })
    ;(Utilisateur.findOne as jest.Mock).mockResolvedValue({ id: 1, update: mockUtilUpdate })
    ;(bcrypt.hashSync as jest.Mock).mockReturnValue('hashed-new')
    mockUtilUpdate.mockResolvedValue({})

    await AuthController.passwordResetWithToken(req, res)

    expect(mockUtilUpdate).toHaveBeenCalledWith({ motDePasse: 'hashed-new' })
    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.json).toHaveBeenCalledWith({ success: true, message: 'Mot de passe réinitialisé' })
  })
})

describe('AuthController.updateProfile', () => {
  it('retourne 403 si ADMIN', async () => {
    const req = mockRequest({ utilisateurRole: 'admin' } as any)
    const res = mockResponse()

    await AuthController.updateProfile(req, res)

    expect(res.status).toHaveBeenCalledWith(403)
  })

  it('retourne 400 si aucun fichier fourni', async () => {
    const req = mockRequest({ utilisateurRole: 'apprenant', utilisateurId: 1, files: {} } as any)
    const res = mockResponse()

    await AuthController.updateProfile(req, res)

    expect(res.status).toHaveBeenCalledWith(400)
  })

  it('retourne 404 si utilisateur introuvable', async () => {
    const req = mockRequest({ utilisateurRole: 'apprenant', utilisateurId: 1, files: { profile: [{ filename: 'photo.jpg' }] } } as any)
    const res = mockResponse()
    ;(Utilisateur.findOne as jest.Mock).mockResolvedValue(null)

    await AuthController.updateProfile(req, res)

    expect(res.status).toHaveBeenCalledWith(404)
  })

  it('met à jour la photo de profil', async () => {
    const req = mockRequest({ utilisateurRole: 'apprenant', utilisateurId: 1, files: { profile: [{ filename: 'photo.jpg' }] } } as any)
    const res = mockResponse()
    ;(Utilisateur.findOne as jest.Mock).mockResolvedValue({ id: 1, update: mockUtilUpdate })
    mockUtilUpdate.mockResolvedValue({})

    await AuthController.updateProfile(req, res)

    expect(mockUtilUpdate).toHaveBeenCalledWith({ photoDeProfil: 'photo.jpg' })
    expect(res.status).toHaveBeenCalledWith(200)
  })
})

describe('AuthController.sendEmailConfirmLink', () => {
  it('retourne 403 si rôle non autorisé', async () => {
    const req = mockRequest({ utilisateurRole: 'institution' } as any)
    const res = mockResponse()

    await AuthController.sendEmailConfirmLink(req, res)

    expect(res.status).toHaveBeenCalledWith(403)
  })

  it('retourne 404 si utilisateur introuvable', async () => {
    const req = mockRequest({ utilisateurRole: 'apprenant', utilisateurId: 1 } as any)
    const res = mockResponse()
    ;(Utilisateur.findOne as jest.Mock).mockResolvedValue(null)

    await AuthController.sendEmailConfirmLink(req, res)

    expect(res.status).toHaveBeenCalledWith(404)
  })

  it('retourne 300 si email déjà vérifié', async () => {
    const req = mockRequest({ utilisateurRole: 'apprenant', utilisateurId: 1 } as any)
    const res = mockResponse()
    ;(Utilisateur.findOne as jest.Mock).mockResolvedValue({ id: 1, dateVerificationEmail: new Date() })

    await AuthController.sendEmailConfirmLink(req, res)

    expect(res.status).toHaveBeenCalledWith(300)
  })

  it('envoie le lien de confirmation', async () => {
    const req = mockRequest({ utilisateurRole: 'apprenant', utilisateurId: 1, query: { redirectTo: 'http://example.com' } } as any)
    const res = mockResponse()
    ;(Utilisateur.findOne as jest.Mock).mockResolvedValue({ id: 1, email: 'test@test.com', identifiant: 'user1', dateVerificationEmail: undefined })

    await AuthController.sendEmailConfirmLink(req, res)

    expect(res.sendStatus).toHaveBeenCalledWith(200)
  })
})
