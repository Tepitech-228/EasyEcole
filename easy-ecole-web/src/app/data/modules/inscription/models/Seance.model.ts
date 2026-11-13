import { Enseignant } from "../../auth/models/Enseignant.model";
import { Cours } from "./Cours.model";
import { SalleDeClasse } from "./SalleDeClasse.model";

export class Seance {
  declare id?: string
  declare titre?: string
  declare etablissementId?: number
  declare jourSemaine?: string
  declare salle?: string
  declare dateDebut?: Date
  declare dateFin?: Date
  declare heureDebut?: Date
  declare heureFin?: Date
  declare coursId?: string
  declare cours?: Cours
  declare enseignantId?: string
  declare enseignant?: Enseignant
  declare salleDeClasseId?: string
  declare salleDeClasse?: SalleDeClasse
  declare description?: string
  declare readonly createdAt?: Date
  declare readonly updatedAt?: Date
}

export interface PlanningEvent {
  id: string
  seanceId: string
  titre: string
  date: string
  jourSemaine: string
  heureDebut: Date
  heureFin: Date
  salle: string
  salleDeClasseId?: string
  salleDeClasse?: SalleDeClasse
  description?: string
  coursId?: string
  cours?: Cours
  enseignantId?: string
  enseignant?: Enseignant
  etablissementId?: number
  etablissement?: { id: number, nom: string }
  pointage?: {
    heureDebutReelle?: string | null
    heureFinReelle?: string | null
  } | null
  statutPointage?: 'a_venir' | 'en_cours' | 'en_retard' | 'termine' | 'termine_en_avance' | 'absent'
}

export interface ConflitSeance {
  type: 'enseignant' | 'salle' | 'classe'
  message: string
  seance: Seance
}