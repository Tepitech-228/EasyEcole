import { Model, InferAttributes, InferCreationAttributes, CreationOptional, DataTypes, ForeignKey, NonAttribute, Association } from "sequelize";
import { DatabaseConnection } from "../../../core/helpers/DatabaseConnection";
import { MODULE_MODEL_PREFIX, MODULE_TABLE_PREFIX } from "../RhModule";
import { RhPoste } from "./RhPoste";
import { RhCandidature } from "./RhCandidature";

export class RhOffreEmploi extends Model<InferAttributes<RhOffreEmploi>, InferCreationAttributes<RhOffreEmploi>> {
  declare id: CreationOptional<string>
  declare posteId: ForeignKey<RhPoste['id']>
  declare description: CreationOptional<string>
  declare datePublication: CreationOptional<Date>
  declare dateCloture: CreationOptional<Date>
  declare statut: CreationOptional<string>
  declare readonly createdAt: CreationOptional<Date>
  declare readonly updatedAt: CreationOptional<Date>

  declare poste?: NonAttribute<RhPoste>
  declare candidatures?: NonAttribute<RhCandidature[]>

  declare static associations: {
    poste: Association<RhOffreEmploi, RhPoste>
    candidatures: Association<RhOffreEmploi, RhCandidature>
  }
}

RhOffreEmploi.init({
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    autoIncrement: true,
    primaryKey: true
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  datePublication: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },
  dateCloture: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },
  statut: {
    type: DataTypes.ENUM('publiée', 'fermée'),
    defaultValue: 'publiée'
  },
  createdAt: DataTypes.DATE,
  updatedAt: DataTypes.DATE,
}, {
  sequelize: DatabaseConnection.getInstance().sequelize,
  paranoid: true,
  modelName: MODULE_MODEL_PREFIX + 'OffreEmploi',
  tableName: MODULE_TABLE_PREFIX + 'offres_emploi',
  timestamps: true
})
