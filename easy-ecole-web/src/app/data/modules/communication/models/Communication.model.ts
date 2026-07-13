export class Communication {
  declare id?: string
  declare titre: string
  declare contenu: string
  declare datePublication?: Date
  declare statut?: string
  declare cible?: string
  declare utilisateurId?: string
  declare utilisateur?: { id: string; nom: string; prenoms: string }

  declare readonly createdAt?: Date
  declare readonly updatedAt?: Date
}
