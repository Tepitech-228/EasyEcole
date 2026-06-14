import { NiveauEtude } from "./NiveauEtude.model";
import { DeboucheParcours } from "./DeboucheParcours.model";
import { PrerequisParcours } from "./PrerequisParcours.model";
import { Categorie } from "./Categorie.model";

export class Parcours {
  declare id?: string
  declare titre?: string
  declare dureeDeFormation?: string
  declare image?: string
  declare videoExplicative?: string
  declare contenu?: string
  declare categorieId?: string
  declare categorie?: Categorie
  declare niveauEtudeId?: string
  declare niveauEtude?: NiveauEtude
  declare debouchesParcours?: DeboucheParcours[]
  declare prerequisParcours?: PrerequisParcours[]

  declare readonly createdAt?: Date
  declare readonly updatedAt?: Date

  public static getDuree(dureeDeFormation: string): string {
    const [duree, unit] = dureeDeFormation.split('/')
    let unitString: string = ''
    switch (unit) {
      case 'y':
        unitString = (Number(duree) > 1) ? 'ans' : 'an';
        break;
      case 'm':
        unitString = 'mois'
        break;
      case 'd':
        unitString = (Number(duree) > 1) ? 'jours' : 'jour';
        break;
      default:
        break;
    }

    return duree + ' ' + unitString
  }
}