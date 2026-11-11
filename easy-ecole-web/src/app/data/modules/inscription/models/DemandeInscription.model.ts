import { ReponseInscription } from "./ReponseInscription.model";
import { ParcoursChoisi } from "./ParcoursChoisi.model";
import { Utilisateur } from "../../auth/models/Utilisateur.model";
import { EtatsValidationParcours } from "src/app/data/enums/EtatsValidationParcours";
import { Session } from "./Session.model";
import { Cours } from "./Cours.model";
import { PaiementInscription } from "./PaiementInscription.model";
import { DemandeInscriptionDossier } from "./DemandeInscriptionDossier.model";
import { DemandeInscriptionCours } from "./DemandeInscriptionCours.model";
import { PreInscription } from "./PreInscription.model";
import { DossierInscription } from "./DossierInscription.model";

export class DemandeInscription {
  declare id?: string
  declare matricule?: string
  declare matriculeEtudiant?: string | null
  declare statutPipeline?: 'soumis' | 'authentifie' | 'saisie_validee' | 'transmis_comite' | 'correction_demandee' | 'valide' | 'rejete' | null
  declare motifPipeline?: string | null
  declare consentementHikvisionAt?: Date | null
  declare dateDemande?: Date
  declare dateValidation?: Date
  declare sessionId?: string
  declare session?: Session
  declare etablissementId?: string | number | null
  declare utilisateurId?: string
  declare utilisateur?: Utilisateur
  declare reponseInscription?: ReponseInscription
  declare preInscription?: PreInscription
  declare parcoursChoisis?: ParcoursChoisi[]
  declare cours?: Cours[]
  declare paiementsInscription?: PaiementInscription[]
  declare dossiersDemande?: DemandeInscriptionDossier[]
  declare dossiersRequis?: DossierInscription[]
  declare coursChoisis?: DemandeInscriptionCours[]
  /** Vrai si l'étudiant déclare être boursier. */
  declare estBoursier?: boolean
  /** Chemin du justificatif de bourse (PDF) uploadé par l'étudiant. */
  declare documentBourse?: string
  /** Type de demande : 'inscription' (1ère) | 'reinscription'. Permet le badge comité. */
  declare typeDemande?: 'inscription' | 'reinscription'
  /** Mode choisi dans le wizard : présentiel ou parcours e-learning. */
  declare modeFormation?: 'presentiel' | 'en_ligne'
  /** Vrai une fois le dossier transmis au comité d'orientation (après saisie ESA finalisée). */
  declare soumissionComite?: boolean

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