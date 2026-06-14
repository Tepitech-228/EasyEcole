import { EtatsSession } from "src/app/data/enums/EtatsSession";
import { AnneeAcademique } from "./AnneeAcademique.model";
import { DemandeInscription } from "./DemandeInscription.model";
import { DossierInscription } from "./DossierInscription.model";
import { FraisInscription } from "./FraisInscription.model";
import { NiveauEtude } from "./NiveauEtude.model";

export class Session {
  declare id: string
  declare dateDebut: Date
  declare dateFin: Date
  declare description: string
  declare anneeAcademiqueId: string
  declare anneeAcademique?: AnneeAcademique
  declare niveauEtudeId: string
  declare niveauEtude?: NiveauEtude
  declare demandesInscription?: DemandeInscription[]
  declare fraisInscription?: FraisInscription[]
  declare dossiersInscription?: DossierInscription[]

  declare readonly createdAt: Date
  declare readonly updatedAt: Date

  static getEtat(dateDebut: Date, dateFin: Date): EtatsSession {
    const today: number = Date.now()
    const debut: number = new Date(dateDebut).getTime()
    const fin: number = new Date(dateFin).getTime()

    if(today < debut) {
      return EtatsSession.A_VENIR
    }
    else if(today <= fin) {
      return EtatsSession.OUVERTE
    }
    else {
      return EtatsSession.CLOTUREE
    }
  }
}