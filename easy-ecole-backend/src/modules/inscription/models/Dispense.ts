import { Model, InferAttributes, InferCreationAttributes, CreationOptional, DataTypes, ForeignKey, NonAttribute, Association } from "sequelize";
import { DatabaseConnection } from "../../../core/helpers/DatabaseConnection";
import { MODULE_MODEL_PREFIX, MODULE_TABLE_PREFIX } from "../InscriptionModule";
import { CursusApprenant } from "./CursusApprenant";
import { Cours } from "./Cours";
import { Utilisateur } from "../../auth/models/Utilisateur";

export class Dispense extends Model<InferAttributes<Dispense>, InferCreationAttributes<Dispense>> {
  declare id: CreationOptional<number>
  declare cursusApprenantId: ForeignKey<CursusApprenant['id']>
  declare coursId: ForeignKey<Cours['id'] | null>
  declare motif: string
  declare validePar: ForeignKey<Utilisateur['id']>
  declare dateValidation: CreationOptional<Date | null>
  declare statut: CreationOptional<string>

  declare cursusApprenant?: NonAttribute<CursusApprenant>
  declare cours?: NonAttribute<Cours>
  declare valideParUtilisateur?: NonAttribute<Utilisateur>

  declare readonly createdAt: CreationOptional<Date>
  declare readonly updatedAt: CreationOptional<Date>
  declare readonly deletedAt: CreationOptional<Date | null>

  declare static associations: {
    cursusApprenant: Association<Dispense, CursusApprenant>
    cours: Association<Dispense, Cours>
    valideParUtilisateur: Association<Dispense, Utilisateur>
  }
}

Dispense.init({
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    autoIncrement: true,
    primaryKey: true
  },
  cursusApprenantId: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false
  },
  coursId: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: true
  },
  motif: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  validePar: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false
  },
  dateValidation: {
    type: DataTypes.DATE,
    allowNull: true
  },
  statut: {
    type: DataTypes.ENUM('demande', 'validee', 'refusee'),
    allowNull: false,
    defaultValue: 'demande'
  },
  createdAt: DataTypes.DATE,
  updatedAt: DataTypes.DATE,
  deletedAt: DataTypes.DATE,
}, {
  sequelize: DatabaseConnection.getInstance().sequelize,
  paranoid: true,
  modelName: MODULE_MODEL_PREFIX + 'Dispense',
  tableName: MODULE_TABLE_PREFIX + 'dispenses',
  timestamps: true
})
