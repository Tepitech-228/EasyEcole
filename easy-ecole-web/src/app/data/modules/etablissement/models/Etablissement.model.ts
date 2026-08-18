export class Etablissement {
  declare id?: string
  declare nom?: string
  declare type?: string
  declare pays?: string
  declare ville?: string
  declare adresse?: string
  declare telephone?: string
  declare email?: string
  declare siteWeb?: string
  declare code?: string
  declare logo?: string
  declare devise?: string
  declare anneeScolaireCourante?: string
  declare actif?: boolean

  declare readonly createdAt?: Date
  declare readonly updatedAt?: Date
}
