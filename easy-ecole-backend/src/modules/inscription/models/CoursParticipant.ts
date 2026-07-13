import { Model, InferAttributes, InferCreationAttributes, CreationOptional, DataTypes, ForeignKey, Association } from "sequelize";
import { DatabaseConnection } from "../../../core/helpers/DatabaseConnection";
import { MODULE_MODEL_PREFIX, MODULE_TABLE_PREFIX } from "../InscriptionModule";
import { Cours } from "./Cours";
import { Utilisateur } from "../../auth/models/Utilisateur";
import { CursusApprenant } from "./CursusApprenant";

export class CoursParticipant extends Model<InferAttributes<CoursParticipant>, InferCreationAttributes<CoursParticipant>> {
  declare id: CreationOptional<string>
  
  declare utilisateurId: ForeignKey<Utilisateur['id']>
  declare coursId: ForeignKey<Cours['id']>
  declare cursusApprenantId: ForeignKey<CursusApprenant['id']>

  declare readonly createdAt: CreationOptional<Date>
  declare readonly updatedAt: CreationOptional<Date>

  declare static associations: {
    utilisateur: Association<CoursParticipant, Utilisateur>,
    cours: Association<CoursParticipant, Cours>,
    cursusApprenant: Association<CoursParticipant, CursusApprenant>
  };
}

CoursParticipant.init({
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    autoIncrement: true,
    primaryKey: true
  },
  utilisateurId: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false,
    unique: 'utilisateur-cours'
  },
  coursId: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false,
    unique: 'utilisateur-cours'
  },
  cursusApprenantId: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false,
  },
  createdAt: DataTypes.DATE,
  updatedAt: DataTypes.DATE,
}, {
  sequelize: DatabaseConnection.getInstance().sequelize,
  paranoid: true,
  modelName: MODULE_MODEL_PREFIX + 'CoursParticipant',
  tableName: MODULE_TABLE_PREFIX + 'cours_participants',
  timestamps: true
})