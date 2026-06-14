import { Utilisateur } from "../../auth/models/Utilisateur.model"
import { AnneeAcademique } from "./AnneeAcademique.model"
import { Classe } from "./Classe.model"
import { DemandeInscription } from "./DemandeInscription.model"
import { NiveauEtude } from "./NiveauEtude.model"
import { Parcours } from "./Parcours.model"

export class CursusApprenant {
    declare id?: string
    declare externe?: boolean
    declare etablissement?: string
    declare intituleParcours?: string
    declare parcoursId?: string
    declare parcours?: Parcours
    declare niveauEtudeId?: string
    declare niveauEtude?: NiveauEtude
    declare classeId?: string
    declare classe?: Classe
    declare anneeAcademiqueId?: string
    declare anneeAcademique?: AnneeAcademique
    declare demandeInscriptionId?: string
    declare demandeInscription?: DemandeInscription
    declare utilisateurId?: string
    declare utilisateur?: Utilisateur

    declare readonly createdAt?: Date
    declare readonly updatedAt?: Date
}