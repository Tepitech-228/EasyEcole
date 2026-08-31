import { Request, Response } from "express";
import { RolesUtilisateur } from "../../../core/enums/RolesUtilisateur";
import { DossierEtudiant } from "../models/DossierEtudiant";
import { Utilisateur } from "../../auth/models/Utilisateur";
import { Apprenant } from "../../auth/models/Apprenant";
import { DemandeInscription } from "../models/DemandeInscription";
import { Echeance } from "../models/Echeance";
import { AnneeAcademique } from "../models/AnneeAcademique";
import { Parcours } from "../models/Parcours";
import { NiveauEtude } from "../models/NiveauEtude";
import { Classe } from "../models/Classe";
import { SalleDeClasse } from "../models/SalleDeClasse";

export type StatutSuivi = 'regle' | 'partiel' | 'probleme'

export interface EtudiantSuiviItem {
  dossierEtudiantId: number
  utilisateurId: number
  matricule: string | null
  nom: string
  prenoms: string
  photo: string | null
  totalDu: number
  totalPaye: number
  resteApayer: number
  statut: StatutSuivi
  echeances: {
    id: number
    type: string
    numeroEcheance: number
    montant: number
    montantPaye: number
    resteEcheance: number
    statut: string
    dateLimite: Date
  }[]
}

/**
 * Règle de statut de suivi d'un dossier (croisant l'historique des échéances) :
 * - 'probleme' : au moins une échéance impayée ou en retard DONT la date limite est passée
 *                (même règle que VerificationPaiementService.verifierDossier → 'rouge').
 * - 'partiel'  : aucune échéance en retard échue MAIS au moins une échéance 'partiel'
 *                (payée partiellement) encore à solder.
 * - 'regle'    : tout le reste (aucune échéance en souffrance).
 */
export function calculerStatutSuivi(echeances: Echeance[]): StatutSuivi {
  const now = new Date()
  const echeanceEnRetardEchue = (echeances || []).filter(
    e => (e.statut === 'impaye' || e.statut === 'en_retard') && new Date(e.dateLimite) <= now
  )
  if (echeanceEnRetardEchue.length > 0) return 'probleme'

  const aPartiel = (echeances || []).some(e => e.statut === 'partiel')
  if (aPartiel) return 'partiel'

  return 'regle'
}

/**
 * Contrôleur du suivi des échéances par étudiant (écran ESA-COMPTA).
 * Monte sous /inscription/finance, protégé par AuthEsacompta + permission.
 *
 * Reconstruit l'arbre Année → Parcours/Filière → Niveau → Classe (salles)
 * et attache à chaque étudiant ses agrégats financiers (total dû / payé /
 * reste à payer) et un statut de ligne (rouge / orange / vert).
 */
export class SuiviEcheancesController {

  static async getSuivi(req: Request, res: Response): Promise<Response> {
    try {
      const anneeFilter = req.query.anneeAcademiqueId
        ? Number(req.query.anneeAcademiqueId)
        : null

      // 1) Dossiers étudiants + utilisateur (nom, prénoms, photo)
      const dossiers = await DossierEtudiant.findAll({
        include: [
          { association: DossierEtudiant.associations.utilisateur, include: [{ model: Apprenant, as: 'apprenant' }] }
        ]
      })

      // 2) Dernière demande par utilisateur (cursus + session) — tri DESC, 1ère = plus récente
      const demandes = await DemandeInscription.findAll({
        order: [['dateDemande', 'DESC']],
        include: [
          {
            association: DemandeInscription.associations.cursusApprenant,
            include: [
              { model: AnneeAcademique, as: 'anneeAcademique' },
              { model: Parcours, as: 'parcours' },
              { model: NiveauEtude, as: 'niveauEtude' },
              { model: Classe, as: 'classe', include: [{ model: SalleDeClasse, as: 'sallesDeClasse' }] }
            ]
          },
          {
            association: DemandeInscription.associations.session,
            include: [{ model: AnneeAcademique, as: 'anneeAcademique' }]
          }
        ]
      })
      const demandeParUtilisateur = new Map<number, DemandeInscription>()
      for (const demande of demandes) {
        if (!demandeParUtilisateur.has(demande.utilisateurId)) {
          demandeParUtilisateur.set(demande.utilisateurId, demande)
        }
      }

      // 3) Toutes les échéances, groupées par dossier
      const allEcheances = await Echeance.findAll({})
      const echeancesParDossier = new Map<number, Echeance[]>()
      for (const ech of allEcheances) {
        if (ech.dossierEtudiantId == null) continue
        const list = echeancesParDossier.get(ech.dossierEtudiantId) || []
        list.push(ech)
        echeancesParDossier.set(ech.dossierEtudiantId, list)
      }

      // 4) Agrégation en arbre
      const anneesMap = new Map<string, any>()

      for (const dossier of dossiers) {
        const utilisateur: any = dossier.utilisateur
        const apprenant: any = utilisateur?.apprenant

        const demande = demandeParUtilisateur.get(dossier.utilisateurId)
        const cursus: any = (demande as any)?.cursusApprenant
        const session: any = demande?.session

        let anneeId: number | null = null
        let anneeLabel = 'Non affectés'
        let parcoursId: number | null = null
        let filiereLabel = 'Sans parcours'
        let niveauId: number | null = null
        let niveauLabel = '—'
        let classeId: number | null = null
        let classeLabel = '—'
        let salles: string[] = []

        if (cursus) {
          anneeId = cursus.anneeAcademique?.id ?? null
          anneeLabel = cursus.anneeAcademique?.libelle ?? 'Année inconnue'
          parcoursId = cursus.parcours?.id ?? null
          filiereLabel = cursus.parcours?.titre ?? 'Sans parcours'
          niveauId = cursus.niveauEtude?.id ?? null
          niveauLabel = cursus.niveauEtude?.libelle ?? '—'
          classeId = cursus.classe?.id ?? null
          classeLabel = cursus.classe?.libelle ?? '—'
          salles = (cursus.classe?.sallesDeClasse ?? []).map((s: any) => s.libelle)
        } else if (session?.anneeAcademique) {
          anneeId = session.anneeAcademique.id ?? null
          anneeLabel = session.anneeAcademique.libelle ?? 'Année inconnue'
        }

        // Filtre optionnel par année académique
        if (anneeFilter && anneeId !== anneeFilter) continue

        // Agrégats financiers
        const echeances = echeancesParDossier.get(dossier.id) || []
        const totalDu = echeances.reduce((s, e) => s + (Number(e.montant) || 0), 0)
        const totalPaye = echeances.reduce((s, e) => s + (Number(e.montantPaye) || 0), 0)
        const statutSuivi = calculerStatutSuivi(echeances)
        const item: EtudiantSuiviItem = {
          dossierEtudiantId: dossier.id,
          utilisateurId: dossier.utilisateurId,
          matricule: dossier.matricule,
          nom: utilisateur?.nom ?? '',
          prenoms: utilisateur?.prenoms ?? '',
          photo: apprenant?.photo ?? null,
          totalDu,
          totalPaye,
          resteApayer: Math.max(0, Math.round((totalDu - totalPaye) * 100) / 100),
          statut: statutSuivi,
          echeances: echeances.map(e => ({
            id: e.id,
            type: e.type,
            numeroEcheance: e.numeroEcheance,
            montant: Number(e.montant) || 0,
            montantPaye: Number(e.montantPaye) || 0,
            resteEcheance: Math.max(0, Math.round(((Number(e.montant) || 0) - (Number(e.montantPaye) || 0)) * 100) / 100),
            statut: e.statut,
            dateLimite: e.dateLimite,
          })),
        }

        const anneeKey = anneeId === null ? 'A_NULL' : `A_${anneeId}`
        let anneeNode = anneesMap.get(anneeKey)
        if (!anneeNode) {
          anneeNode = { anneeId, annee: anneeLabel, filieresMap: new Map<string, any>() }
          anneesMap.set(anneeKey, anneeNode)
        }

        const filiereKey = parcoursId === null ? 'P_NULL' : `P_${parcoursId}`
        let filiereNode = anneeNode.filieresMap.get(filiereKey)
        if (!filiereNode) {
          filiereNode = { parcoursId, filiere: filiereLabel, niveauxMap: new Map<string, any>() }
          anneeNode.filieresMap.set(filiereKey, filiereNode)
        }

        const niveauKey = niveauId === null ? 'N_NULL' : `N_${niveauId}`
        let niveauNode = filiereNode.niveauxMap.get(niveauKey)
        if (!niveauNode) {
          niveauNode = { niveauId, niveau: niveauLabel, classesMap: new Map<string, any>() }
          filiereNode.niveauxMap.set(niveauKey, niveauNode)
        }

        const classeKey = classeId === null ? 'C_NULL' : `C_${classeId}`
        let classeNode = niveauNode.classesMap.get(classeKey)
        if (!classeNode) {
          classeNode = { classeId, classe: classeLabel, salles, etudiants: [] }
          niveauNode.classesMap.set(classeKey, classeNode)
        }

        classeNode.etudiants.push(item)
      }

      // 5) Sérialisation + tri
      const arbre = [...anneesMap.values()]
        .map((anneeNode: any) => ({
          anneeId: anneeNode.anneeId,
          annee: anneeNode.annee,
          filieres: [...anneeNode.filieresMap.values()]
            .sort((a: any, b: any) => a.filiere.localeCompare(b.filiere))
            .map((filiereNode: any) => ({
              parcoursId: filiereNode.parcoursId,
              filiere: filiereNode.filiere,
              niveaux: [...filiereNode.niveauxMap.values()]
                .sort((a: any, b: any) => a.niveau.localeCompare(b.niveau))
                .map((niveauNode: any) => ({
                  niveauId: niveauNode.niveauId,
                  niveau: niveauNode.niveau,
                  classes: [...niveauNode.classesMap.values()]
                    .sort((a: any, b: any) => a.classe.localeCompare(b.classe))
                    .map((classeNode: any) => ({
                      classeId: classeNode.classeId,
                      classe: classeNode.classe,
                      salles: classeNode.salles,
                      etudiants: classeNode.etudiants.sort((a: EtudiantSuiviItem, b: EtudiantSuiviItem) =>
                        `${a.nom} ${a.prenoms}`.localeCompare(`${b.nom} ${b.prenoms}`)
                      ),
                    })),
                })),
            })),
        }))
        .sort((a: any, b: any) => {
          const aId = a.anneeId === null ? -1 : a.anneeId
          const bId = b.anneeId === null ? -1 : b.anneeId
          return bId - aId
        })

      return res.status(200).json(arbre)
    } catch (error) {
      console.error('Erreur getSuivi:', error)
      return res.status(500).json({ success: false, error })
    }
  }
}
