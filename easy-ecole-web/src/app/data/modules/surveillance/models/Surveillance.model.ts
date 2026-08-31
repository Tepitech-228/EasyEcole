export class SurveillanceDashboard {
  declare id?: string
  declare date?: string
  declare totalPresences?: number
  declare totalAbsences?: number
  declare totalRetards?: number
  declare tauxPresence?: number
  declare incidentsDiscipline?: DisciplineIncident[]
  declare classeStats?: ClasseStat[]
  declare tendances?: TendancesSurveillance
  declare seancesAuj?: number
  declare sanctionsAuj?: number
  declare absencesNonJustifiees?: number
  declare pointagesAuj?: number
  declare charts?: SurveillanceCharts

  declare readonly createdAt?: Date
  declare readonly updatedAt?: Date
}

export class SurveillanceCharts {
  declare absencesParType?: { type: string; total: number }[]
  declare sanctionsParType?: { sanction: string; total: number }[]
  declare sanctionsParStatut?: { statut: string; total: number }[]
}

export class DisciplineIncident {
  declare id?: string
  declare apprenantId?: string
  declare apprenantNom?: string
  declare apprenantPrenoms?: string
  declare classe?: string
  declare dateIncident?: string
  declare typeIncident?: string
  declare description?: string
  declare gravite?: 'mineure' | 'moyenne' | 'grave'
  declare statut?: 'ouvert' | 'en_cours' | 'resolu'
  declare surveillantId?: string
  declare createdAt?: Date
}

export class ClasseStat {
  declare classe?: string
  declare totalEleves?: number
  declare presences?: number
  declare absences?: number
  declare retards?: number
  declare tauxPresence?: number
}

export class TendancesSurveillance {
  declare presencesParJour?: { jour: string; presences: number; absences: number }[]
  declare incidentsParType?: { type: string; count: number }[]
}
