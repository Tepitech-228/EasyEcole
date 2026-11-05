import { DossierEtudiant } from "../models/DossierEtudiant"
import { Echeance } from "../models/Echeance"

export interface EcheanceSituationFinanciere {
    id?: number
    numeroEcheance: number
    type: "inscription" | "scolarite"
    mois: string
    montant: number
    montantPaye: number
    resteAPayer: number
    devise: string
    dateLimite: Date
    statut: "impaye" | "paye" | "en_retard" | "partiel"
    estPaye: boolean
    enRetard: boolean
}

export interface SituationFinanciere {
    sommeGlobale: number
    montantPaye: number
    resteAPayer: number
    estAJour: boolean
    echeancesEnRetard: number
    echeancesPayees: number
    echeancesTotales: number
    moisEnCours: EcheanceSituationFinanciere | null
    echeances: EcheanceSituationFinanciere[]
}

export default class SituationFinanciereService {
    static calculer(dossier: DossierEtudiant): SituationFinanciere {
        const echeances = dossier.echeances || []
        const now = new Date()
        now.setHours(0, 0, 0, 0)

        const totalEcheances = echeances.reduce((sum, echeance) => sum + (echeance.montant || 0), 0)
        const sommeGlobale = totalEcheances > 0 ? totalEcheances : (dossier.fraisScolarite || 0)
        const montantPaye = echeances.reduce((sum, echeance) => sum + (echeance.montantPaye || 0), 0)
        const resteAPayer = Math.max(0, sommeGlobale - montantPaye)

        const moisDe = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`
        const asDate = (value: Date | string): Date => value instanceof Date ? value : new Date(value)
        const dateLimiteEffective = (echeance: Echeance): Date => {
            const date = asDate(echeance.dateLimite)
            return new Date(date.getFullYear(), date.getMonth(), 5)
        }
        const moisActuel = moisDe(now)

        const lignes: EcheanceSituationFinanciere[] = [...echeances]
            .sort((a, b) => asDate(a.dateLimite).getTime() - asDate(b.dateLimite).getTime())
            .map(echeance => {
                const montant = echeance.montant || 0
                const paye = Math.min(echeance.montantPaye || 0, montant)
                const reste = Math.max(0, montant - paye)
                const dateLimite = dateLimiteEffective(echeance)
                const estPaye = reste <= 0
                const enRetard = !estPaye && dateLimite.getTime() < now.getTime()
                const mois = (echeance.moisConcerne && String(echeance.moisConcerne)) || moisDe(dateLimite)
                return {
                    id: echeance.id,
                    numeroEcheance: echeance.numeroEcheance,
                    type: echeance.type,
                    mois,
                    montant,
                    montantPaye: paye,
                    resteAPayer: reste,
                    devise: echeance.devise,
                    dateLimite,
                    statut: echeance.statut,
                    estPaye,
                    enRetard
                }
            })

        const echeancesEnRetard = lignes.filter(ligne => ligne.enRetard)
        const moisEnCours = lignes.find(ligne => moisDe(new Date(ligne.dateLimite)) === moisActuel) || null

        return {
            sommeGlobale,
            montantPaye,
            resteAPayer,
            estAJour: echeancesEnRetard.length === 0,
            echeancesEnRetard: echeancesEnRetard.length,
            echeancesPayees: lignes.filter(ligne => ligne.estPaye).length,
            echeancesTotales: lignes.length,
            moisEnCours,
            echeances: lignes
        }
    }
}
