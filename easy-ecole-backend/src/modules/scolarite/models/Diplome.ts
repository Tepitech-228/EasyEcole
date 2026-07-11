import { Model, InferAttributes, InferCreationAttributes, CreationOptional, DataTypes, ForeignKey, NonAttribute } from "sequelize";
import { DatabaseConnection } from "../../../core/helpers/DatabaseConnection";
import { MODULE_MODEL_PREFIX, MODULE_TABLE_PREFIX } from "../ScolariteModule";
import { CursusApprenant } from "../../inscription/models/CursusApprenant";
import { Parcours } from "../../inscription/models/Parcours";
import { NiveauEtude } from "../../inscription/models/NiveauEtude";

export class Diplome extends Model<InferAttributes<Diplome>, InferCreationAttributes<Diplome>> {
  declare id: CreationOptional<string>
  declare cursusApprenantId: ForeignKey<CursusApprenant['id']>
  declare cursusApprenant?: NonAttribute<CursusApprenant>
  declare parcoursId: ForeignKey<Parcours['id']>
  declare parcours?: NonAttribute<Parcours>
  declare niveauEtudeId: ForeignKey<NiveauEtude['id']>
  declare niveauEtude?: NonAttribute<NiveauEtude>
  declare anneeObtention: number
  declare mention: 'passable' | 'assez_bien' | 'bien' | 'tres_bien'
  declare numeroDiplome: string
  declare dateDelivrance: Date
  declare fichierPDF: CreationOptional<string>

  declare readonly createdAt: CreationOptional<Date>
  declare readonly updatedAt: CreationOptional<Date>
}

Diplome.init({
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    autoIncrement: true,
    primaryKey: true
  },
  anneeObtention: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  mention: {
    type: DataTypes.ENUM('passable', 'assez_bien', 'bien', 'tres_bien'),
    allowNull: false
  },
  numeroDiplome: {
    type: new DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  dateDelivrance: {
    type: DataTypes.DATE,
    allowNull: false
  },
  fichierPDF: {
    type: new DataTypes.STRING,
    allowNull: true
  },
  createdAt: DataTypes.DATE,
  updatedAt: DataTypes.DATE,
}, {
  sequelize: DatabaseConnection.getInstance().sequelize,
  modelName: MODULE_MODEL_PREFIX + 'Diplome',
  tableName: MODULE_TABLE_PREFIX + 'diplomes',
  timestamps: true
})
