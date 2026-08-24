import { Model, InferAttributes, InferCreationAttributes, CreationOptional, DataTypes, ForeignKey, NonAttribute, Association } from "sequelize";
import { DatabaseConnection } from "../../../core/helpers/DatabaseConnection";
import { MODULE_MODEL_PREFIX, MODULE_TABLE_PREFIX } from "../ScolariteModule";
import { Utilisateur } from "../../auth/models/Utilisateur";

export class ClotureCaisse extends Model<InferAttributes<ClotureCaisse>, InferCreationAttributes<ClotureCaisse>> {
  declare id: CreationOptional<number>
  declare dateCloture: Date
  declare caissierId: ForeignKey<Utilisateur['id']>
  declare montantTheorique: number
  declare montantReel: number
  declare ecart: number
  declare statut: 'ouverte' | 'cloturee'
  declare caissier?: NonAttribute<Utilisateur>

  declare readonly createdAt: CreationOptional<Date>
  declare readonly updatedAt: CreationOptional<Date>

  declare static associations: {
    caissier: Association<ClotureCaisse, Utilisateur>
  }
}

ClotureCaisse.init({
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    autoIncrement: true,
    primaryKey: true
  },
  dateCloture: {
    type: DataTypes.DATE,
    allowNull: false
  },
  caissierId: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false,
    references: { model: 'aut_utilisateurs', key: 'id' }
  },
  montantTheorique: {
    type: DataTypes.FLOAT,
    allowNull: false,
    defaultValue: 0
  },
  montantReel: {
    type: DataTypes.FLOAT,
    allowNull: false,
    defaultValue: 0
  },
  ecart: {
    type: DataTypes.FLOAT,
    allowNull: false,
    defaultValue: 0
  },
  statut: {
    type: DataTypes.ENUM('ouverte', 'cloturee'),
    allowNull: false,
    defaultValue: 'ouverte'
  },
  createdAt: DataTypes.DATE,
  updatedAt: DataTypes.DATE,
}, {
  sequelize: DatabaseConnection.getInstance().sequelize,
  paranoid: true,
  modelName: MODULE_MODEL_PREFIX + 'ClotureCaisse',
  tableName: MODULE_TABLE_PREFIX + 'clotures_caisse',
  timestamps: true
})
