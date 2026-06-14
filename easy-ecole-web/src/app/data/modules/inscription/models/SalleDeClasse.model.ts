import { Classe } from "./Classe.model"

export class SalleDeClasse {
    declare id: string
    declare libelle: string
    declare description: string
    declare classeId: string
    declare classe?: Classe

    declare readonly createdAt: Date
    declare readonly updatedAt: Date
}