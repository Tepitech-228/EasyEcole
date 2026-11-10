import { Session } from "./Session.model"

export class DossierInscription {
  declare id?: string
  declare titre?: string
  declare description?: string
  declare profilRequis?: 'tous' | 'nouveau' | 'ancien'
  declare etape?: 'premiere' | 'complementaire'
  declare tailleMax?: number
  declare sessionId?: string
  declare session?: Session

  declare readonly createdAt?: Date
  declare readonly updatedAt?: Date
}