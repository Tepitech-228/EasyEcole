import { Model, InferAttributes, InferCreationAttributes, CreationOptional, DataTypes, ForeignKey } from "sequelize";
import { DatabaseConnection } from "../../../core/helpers/DatabaseConnection";
import { MODULE_MODEL_PREFIX, MODULE_TABLE_PREFIX } from "../InscriptionModule";
import { DemandeInscription } from "./DemandeInscription";
import { DossierInscription } from "./DossierInscription";

export class DemandeInscriptionDossier extends Model<InferAttributes<DemandeInscriptionDossier>, InferCreationAttributes<DemandeInscriptionDossier>> {
  declare nomFichier: CreationOptional<string>
  declare correctionDemandee: CreationOptional<boolean>
  declare demandeId: ForeignKey<DemandeInscription['id']>
  declare dossierId: ForeignKey<DossierInscription['id']>

  declare readonly createdAt: CreationOptional<Date>
  declare readonly updatedAt: CreationOptional<Date>
}

DemandeInscriptionDossier.init({
  nomFichier: {
    type: new DataTypes.STRING,
    allowNull: false
  },
  correctionDemandee: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  // La table possède une clé primaire COMPOSITE (demandeId, dossierId) et aucune
  // colonne `id`. Sans `primaryKey: true` ici, Sequelize injecte un attribut `id`
  // implicite et TOUTE insertion échoue avec « Champ 'id' inconnu dans INSERT INTO ».
  // `id: false` seul ne suffit pas : l'attribut subsiste. C'est la déclaration
  // explicite de la clé primaire qui le supprime, et qui permet en plus à
  // instance.where() de cibler la paire pour le remplacement des pièces.
  demandeId: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false,
    primaryKey: true
  },
  dossierId: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false,
    primaryKey: true
  },
  createdAt: DataTypes.DATE,
  updatedAt: DataTypes.DATE,
}, {
  sequelize: DatabaseConnection.getInstance().sequelize,
  paranoid: true,
  modelName: MODULE_MODEL_PREFIX + 'DemandeInscriptionDossier',
  tableName: MODULE_TABLE_PREFIX + 'dossiers_demandes',
  timestamps: true
})
