export class Tuteur {
    declare id?: string
    declare entrepriseId?: string
    declare nom?: string
    declare fonction?: string
    declare email?: string
    declare telephone?: string

    declare readonly createdAt?: Date
    declare readonly updatedAt?: Date

    public static getFullName(tuteur: Tuteur): string {
        return tuteur.nom || ''
    }
}
