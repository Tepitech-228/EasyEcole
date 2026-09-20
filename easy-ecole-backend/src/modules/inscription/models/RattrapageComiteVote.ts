import { Model, InferAttributes, InferCreationAttributes, CreationOptional, DataTypes, ForeignKey, NonAttribute, Association } from "sequelize";
import { DatabaseConnection } from "../../../core/helpers/DatabaseConnection";
import { MODULE_MODEL_PREFIX, MODULE_TABLE_PREFIX } from "../InscriptionModule";
import { RattrapageInscription } from "./RattrapageInscription";
import { Utilisateur } from "../../auth/models/Utilisateur";

export class RattrapageComiteVote extends Model<InferAttributes<RattrapageComiteVote>, InferCreationAttributes<RattrapageComiteVote>> {
  declare id: CreationOptional<number>
  declare rattrapageInscriptionId: ForeignKey<RattrapageInscription['id']>
  declare membreId: ForeignKey<Utilisateur['id']>
  declare decision: 'valide' | 'correction_demandee' | 'rejete'
  declare motif: CreationOptional<string | null>

  declare rattrapageInscription?: NonAttribute<RattrapageInscription>
  declare membre?: NonAttribute<Utilisateur>

  declare readonly createdAt: CreationOptional<Date>
  declare readonly updatedAt: CreationOptional<Date>

  declare static associations: {
    rattrapageInscription: Association<RattrapageComiteVote, RattrapageInscription>
    membre: Association<RattrapageComiteVote, Utilisateur>
  }
}

RattrapageComiteVote.init({
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    autoIncrement: true,
    primaryKey: true
  },
  rattrapageInscriptionId: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false
  },
  membreId: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false
  },
  decision: {
    type: DataTypes.ENUM('valide', 'correction_demandee', 'rejete'),
    allowNull: false
  },
  motif: {
    type: new DataTypes.TEXT,
    allowNull: true,
    defaultValue: null
  },
  createdAt: DataTypes.DATE,
  updatedAt: DataTypes.DATE,
}, {
  sequelize: DatabaseConnection.getInstance().sequelize,
  paranoid: false,
  modelName: MODULE_MODEL_PREFIX + 'RattrapageComiteVote',
  tableName: MODULE_TABLE_PREFIX + 'rattrapage_comite_votes',
  timestamps: true,
  indexes: [
    { unique: true, fields: ['rattrapageInscriptionId', 'membreId'] },
    { fields: ['rattrapageInscriptionId'] },
    { fields: ['membreId'] }
  ]
})
