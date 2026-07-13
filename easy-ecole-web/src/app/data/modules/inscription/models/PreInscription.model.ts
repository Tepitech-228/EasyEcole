export enum EtatPreInscription {
    EN_ATTENTE = "en_attente",
    VALIDE = "valide",
    REJETE = "rejete",
}

export class PreInscription {
  declare id?: string
  declare demandeInscriptionId?: string
  declare statut?: EtatPreInscription
  declare commentaire?: string
  declare dateTraitement?: Date
  declare traiteParId?: string
  declare autorisationPDF?: string

  declare readonly createdAt?: Date
  declare readonly updatedAt?: Date
}
