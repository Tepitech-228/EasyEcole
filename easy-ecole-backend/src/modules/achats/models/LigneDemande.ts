import { Model, InferAttributes, InferCreationAttributes, CreationOptional, DataTypes, ForeignKey, NonAttribute, Association } from "sequelize";
import { DatabaseConnection } from "../../../core/helpers/DatabaseConnection";
import { MODULE_MODEL_PREFIX, MODULE_TABLE_PREFIX } from "../AchatsModule";
import { Demande } from "./Demande";

export class LigneDemande extends Model<InferAttributes<LigneDemande>, InferCreationAttributes<LigneDemande>> {
  declare id: CreationOptional<string>
  declare demandeId: ForeignKey<Demande['id']>
  declare demande?: NonAttribute<Demande>
  declare designation: string
  declare quantite: number
  declare prixEstime: number
  declare unite: CreationOptional<string>
  declare readonly createdAt: CreationOptional<Date>
  declare readonly updatedAt: CreationOptional<Date>

  declare static associations: {
    demande: Association<LigneDemande, Demande>
  };
}

LigneDemande.init({
  id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
  designation: { type: new DataTypes.STRING, allowNull: false },
  quantite: { type: DataTypes.INTEGER, allowNull: false },
  prixEstime: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
  unite: { type: new DataTypes.STRING, allowNull: true },
  createdAt: DataTypes.DATE,
  updatedAt: DataTypes.DATE,
}, {
  sequelize: DatabaseConnection.getInstance().sequelize,
  paranoid: true,
  modelName: MODULE_MODEL_PREFIX + 'LigneDemande',
  tableName: MODULE_TABLE_PREFIX + 'lignes_demande',
  timestamps: true
})
