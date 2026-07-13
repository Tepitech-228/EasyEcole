import { Model, InferAttributes, InferCreationAttributes, CreationOptional, DataTypes, ForeignKey, NonAttribute, Association } from "sequelize";
import { DatabaseConnection } from "../../../core/helpers/DatabaseConnection";
import { Utilisateur } from "../../auth/models/Utilisateur";
import { MODULE_MODEL_PREFIX, MODULE_TABLE_PREFIX } from "../ScolariteModule";

export class Reclamation extends Model<InferAttributes<Reclamation>, InferCreationAttributes<Reclamation>> {
  declare id: CreationOptional<string>
  declare etudiantId: ForeignKey<Utilisateur['id']>
  declare evaluationId: CreationOptional<string>
  declare motif: string
  declare statut: string
  declare date: CreationOptional<Date>
  declare etudiant?: NonAttribute<Utilisateur>

  declare readonly createdAt: CreationOptional<Date>
  declare readonly updatedAt: CreationOptional<Date>

  declare static associations: {
    etudiant: Association<Reclamation, Utilisateur>
  };
}

Reclamation.init({
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    autoIncrement: true,
    primaryKey: true
  },
  evaluationId: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: true
  },
  motif: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  statut: {
    type: DataTypes.ENUM('ouverte', 'traitee', 'fermee'),
    defaultValue: 'ouverte',
    allowNull: false
  },
  date: {
    type: DataTypes.DATE,
    defaultValue: new Date(),
    allowNull: false
  },
  createdAt: DataTypes.DATE,
  updatedAt: DataTypes.DATE,
}, {
  sequelize: DatabaseConnection.getInstance().sequelize,
  paranoid: true,
  modelName: MODULE_MODEL_PREFIX + 'Reclamation',
  tableName: MODULE_TABLE_PREFIX + 'reclamations',
  timestamps: true
})
