import { Model, InferAttributes, InferCreationAttributes, CreationOptional, DataTypes, ForeignKey, NonAttribute, Association } from "sequelize";
import { DatabaseConnection } from "../../../core/helpers/DatabaseConnection";
import { MODULE_MODEL_PREFIX, MODULE_TABLE_PREFIX } from "../InscriptionModule";
import { CursusApprenant } from "./CursusApprenant";
import { Cours } from "./Cours";
import { Utilisateur } from "../../auth/models/Utilisateur";

export class Equivalence extends Model<InferAttributes<Equivalence>, InferCreationAttributes<Equivalence>> {
  declare id: CreationOptional<number>
  declare cursusApprenantId: ForeignKey<CursusApprenant['id']>
  declare coursSource: string
  declare coursDestinationId: ForeignKey<Cours['id']>
  declare creditEcts: CreationOptional<number>
  declare institutionOrigine: string
  declare validePar: ForeignKey<Utilisateur['id'] | null>
  declare dateValidation: CreationOptional<Date | null>
  declare documentJustificatif: CreationOptional<string | null>

  declare cursusApprenant?: NonAttribute<CursusApprenant>
  declare coursDestination?: NonAttribute<Cours>
  declare valideParUtilisateur?: NonAttribute<Utilisateur>

  declare readonly createdAt: CreationOptional<Date>
  declare readonly updatedAt: CreationOptional<Date>

  declare static associations: {
    cursusApprenant: Association<Equivalence, CursusApprenant>
    coursDestination: Association<Equivalence, Cours>
    valideParUtilisateur: Association<Equivalence, Utilisateur>
  }
}

Equivalence.init({
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    autoIncrement: true,
    primaryKey: true
  },
  cursusApprenantId: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false
  },
  coursSource: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  coursDestinationId: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false
  },
  creditEcts: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: true,
    defaultValue: 0
  },
  institutionOrigine: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  validePar: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: true
  },
  dateValidation: {
    type: DataTypes.DATE,
    allowNull: true
  },
  documentJustificatif: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  createdAt: DataTypes.DATE,
  updatedAt: DataTypes.DATE,
}, {
  sequelize: DatabaseConnection.getInstance().sequelize,
  modelName: MODULE_MODEL_PREFIX + 'Equivalence',
  tableName: MODULE_TABLE_PREFIX + 'equivalences',
  timestamps: true
})
