import { Apprenant } from "./Apprenant.model"

export class InformationsParentsApprenant{
  declare id?: string
  declare pereVivant?: boolean
  declare nomPrenomsPere?: string
  declare professionPere?: string
  declare mereVivante?: boolean
  declare nomPrenomsMere?: string
  declare professionMere?: string
  declare apprenantId?: string
  declare apprenant?: Apprenant
  
  declare readonly createdAt?: Date
  declare readonly updatedAt?: Date
}