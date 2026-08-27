import { Classe } from "./Classe.model"
import { Parcours } from "./Parcours.model"

export interface Etablissement {
    id?: string
    libelle?: string
}

export class SalleDeClasse {
    declare id: string
    declare code: string | null
    declare libelle: string
    declare description: string
    declare etage: string | null
    declare type: 'COURS' | 'AMPHITHEATRE' | 'LABORATOIRE' | 'INFORMATIQUE' | 'AUTRE' | null
    declare regime: 'JOUR' | 'SOIR' | 'JOUR_ET_SOIR' | null
    declare statut: 'DISPONIBLE' | 'INDISPONIBLE' | null
    declare capacite: number | null
    declare classeId: string | null
    declare parcoursId: string | null
    declare etablissementId: string | null
    declare classe?: Classe
    declare parcours?: Parcours
    declare etablissement?: Etablissement

    declare readonly createdAt: Date
    declare readonly updatedAt: Date
}
