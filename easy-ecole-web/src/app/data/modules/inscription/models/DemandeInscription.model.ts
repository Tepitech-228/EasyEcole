import { ReponseInscription } from "./ReponseInscription.model";
import { ParcoursChoisi } from "./ParcoursChoisi.model";
import { Utilisateur } from "../../auth/models/Utilisateur.model";
import { EtatsValidationParcours } from "src/app/data/enums/EtatsValidationParcours";
import { Session } from "./Session.model";
import { Cours } from "./Cours.model";
import { PaiementInscription } from "./PaiementInscription.model";
import { DemandeInscriptionDossier } from "./DemandeInscriptionDossier.model";
import { DemandeInscriptionCours } from "./DemandeInscriptionCours.model";

export class DemandeInscription {
  declare id?: string
  declare matricule?: string
  declare dateDemande?: Date
  declare dateValidation?: Date
  declare sessionId?: string
  declare session?: Session
  declare utilisateurId?: string
  declare utilisateur?: Utilisateur
  declare reponseInscription?: ReponseInscription
  declare parcoursChoisis?: ParcoursChoisi[]
  declare cours?: Cours[]
  declare paiementsInscription?: PaiementInscription[]
  declare dossiersDemande?: DemandeInscriptionDossier[]
  declare coursChoisis?: DemandeInscriptionCours[]

  declare readonly createdAt?: Date
  declare readonly updatedAt?: Date
  
  static tauxDeTraitement(parcoursChoisis: ParcoursChoisi[]): number {
    return parcoursChoisis.reduce((accumulator: number, current: ParcoursChoisi) => {
      if (current.etatDeValidation == EtatsValidationParcours.VALIDE || current.etatDeValidation == EtatsValidationParcours.REJETE) {
        accumulator++
      }

      return accumulator;
    }, 0)
  }
}