import { Transaction, Op } from "sequelize";
import { Echeance } from "../../../modules/inscription/models/Echeance";
import { DossierEtudiant } from "../../../modules/inscription/models/DossierEtudiant";
import { BordereauEcheance } from "../../../modules/comptabilite/models/BordereauEcheance";
import { PortefeuilleCredit } from "../../../modules/comptabilite/models/PortefeuilleCredit";
import { ImputationService } from "../../../modules/inscription/services/ImputationService";

describe("ImputationService — priorisation inscription avant scolarite", () => {
  let mockTransaction: Partial<Transaction>;
  let mockEcheances: Echeance[];
  let mockDossier: DossierEtudiant;

  beforeEach(() => {
    mockEcheances = []
    mockDossier = { id: 1, statut: 'actif' } as any

    mockTransaction = {
      LOCK: { UPDATE: 'UPDATE' } as any,
    } as any

    jest.spyOn(Echeance, 'findAll').mockImplementation(async (options: any) => {
      const where = options?.where || {}
      const type = where.type
      const statuts = where.statut || []
      const dossierId = where.dossierEtudiantId
      
      return mockEcheances.filter(e => {
        if (type && e.type !== type) return false
        if (statuts.length > 0 && !statuts.includes(e.statut)) return false
        if (dossierId) {
          if (dossierId[Op.in]) {
            if (!dossierId[Op.in].includes(e.dossierEtudiantId)) return false
          } else if (e.dossierEtudiantId !== dossierId) {
            return false
          }
        }
        return true
      }) as Echeance[]
    })

    jest.spyOn(Echeance, 'findByPk').mockResolvedValue(null as any)
    jest.spyOn(DossierEtudiant, 'findAll').mockResolvedValue([mockDossier] as any)
    jest.spyOn(BordereauEcheance, 'findOrCreate').mockResolvedValue([{ get: () => ({}) }] as any)
    jest.spyOn(PortefeuilleCredit, 'create').mockResolvedValue({ id: 1 } as any)
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  function creerEcheance(overrides: Partial<Echeance> = {}): Echeance {
    const base: any = {
      id: overrides.id || Math.random(),
      dossierEtudiantId: 1,
      type: overrides.type || 'scolarite',
      numeroEcheance: overrides.numeroEcheance || 1,
      montant: overrides.montant || 10000,
      montantPaye: overrides.montantPaye || 0,
      dateLimite: overrides.dateLimite || new Date('2024-01-01'),
      statut: overrides.statut || 'impaye',
      moisConcerne: overrides.moisConcerne,
      devise: 'XAF',
      datePaiement: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      save: jest.fn().mockResolvedValue(true),
    }
    return base as unknown as Echeance
  }

  it("doit imputer d'abord sur les échéances d'inscription, puis sur scolarité", async () => {
    const echeanceInscription = creerEcheance({
      id: 10,
      type: 'inscription',
      numeroEcheance: 1,
      montant: 50000,
      montantPaye: 0,
      statut: 'impaye',
    })

    const echeanceScolarite1 = creerEcheance({
      id: 20,
      type: 'scolarite',
      numeroEcheance: 1,
      montant: 60000,
      montantPaye: 0,
      statut: 'impaye',
    })

    const echeanceScolarite2 = creerEcheance({
      id: 30,
      type: 'scolarite',
      numeroEcheance: 2,
      montant: 60000,
      montantPaye: 0,
      statut: 'impaye',
    })

    mockEcheances = [echeanceScolarite1, echeanceInscription, echeanceScolarite2]

    const resultat = await ImputationService.imputerPourUtilisateur(
      1,
      1,
      170000,
      mockTransaction as Transaction
    )

    expect(resultat.lignes[0].echeanceId).toBe(10)
    expect(resultat.lignes[0].statutApres).toBe('paye')
    expect(resultat.lignes[1].echeanceId).toBe(20)
    expect(resultat.lignes[1].statutApres).toBe('paye')
    expect(resultat.lignes[2].echeanceId).toBe(30)
    expect(resultat.lignes[2].statutApres).toBe('paye')
    expect(resultat.surplus).toBeCloseTo(0, 2)
  })

  it("doit gérer un paiement inférieur aux frais d'inscription", async () => {
    const echeanceInscription = creerEcheance({
      id: 10,
      type: 'inscription',
      montant: 50000,
    })

    mockEcheances = [echeanceInscription]

    const resultat = await ImputationService.imputerPourUtilisateur(
      1,
      1,
      30000,
      mockTransaction as Transaction
    )

    expect(resultat.lignes[0].echeanceId).toBe(10)
    expect(resultat.lignes[0].statutApres).toBe('partiel')
    expect(resultat.lignes[0].montantImpute).toBeCloseTo(30000, 2)
    expect(resultat.surplus).toBeCloseTo(0, 2)
  })

  it("doit gérer un paiement supérieur à toutes les échéances", async () => {
    const echeanceInscription = creerEcheance({
      id: 10,
      type: 'inscription',
      montant: 50000,
    })

    const echeanceScolarite = creerEcheance({
      id: 20,
      type: 'scolarite',
      montant: 30000,
    })

    mockEcheances = [echeanceInscription, echeanceScolarite]

    const resultat = await ImputationService.imputerPourUtilisateur(
      1,
      1,
      100000,
      mockTransaction as Transaction
    )

    expect(resultat.lignes.length).toBe(2)
    expect(resultat.lignes.every(l => l.statutApres === 'paye')).toBe(true)
    expect(resultat.surplus).toBeCloseTo(20000, 2)
  })

  it("doit gérer un paiement partiel sur la scolarité après inscription soldée", async () => {
    const echeanceInscription = creerEcheance({
      id: 10,
      type: 'inscription',
      montant: 50000,
    })

    const echeanceScolarite1 = creerEcheance({
      id: 20,
      type: 'scolarite',
      numeroEcheance: 1,
      montant: 60000,
    })

    const echeanceScolarite2 = creerEcheance({
      id: 30,
      type: 'scolarite',
      numeroEcheance: 2,
      montant: 60000,
    })

    mockEcheances = [echeanceInscription, echeanceScolarite1, echeanceScolarite2]

    const resultat = await ImputationService.imputerPourUtilisateur(
      1,
      1,
      80000,
      mockTransaction as Transaction
    )

    expect(resultat.lignes.length).toBe(2)
    expect(resultat.lignes[0].echeanceId).toBe(10)
    expect(resultat.lignes[0].statutApres).toBe('paye')
    expect(resultat.lignes[1].echeanceId).toBe(20)
    expect(resultat.lignes[1].statutApres).toBe('partiel')
    expect(resultat.lignes[1].montantImpute).toBeCloseTo(30000, 2)
    expect(resultat.surplus).toBeCloseTo(0, 2)
  })
})
