/** Modèle d'employé RH (table `rh_employes`). Champs utiles aux évaluations & formations. */
export class RhEmploye {
    declare id?: string
    declare utilisateurId?: string
    declare matricule?: string | null
    declare nom?: string | null
    declare prenoms?: string | null
    declare statut?: string
    declare readonly createdAt?: Date
    declare readonly updatedAt?: Date

    /** Nom complet pré-calculé côté page */
    get nomComplet(): string {
        return [this.prenoms, this.nom].filter(Boolean).join(' ').trim() || this.matricule || '-';
    }
}