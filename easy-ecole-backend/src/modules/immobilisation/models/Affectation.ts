import { Model, InferAttributes, InferCreationAttributes, CreationOptional, DataTypes, ForeignKey } from "sequelize";
import { DatabaseConnection } from "../../../core/helpers/DatabaseConnection";
import { MODULE_MODEL_PREFIX, MODULE_TABLE_PREFIX } from "../ImmobilisationModule";
import { Immobilisation } from "./Immobilisation";
import { Site } from "./Site";
import { Departement } from "./Departement";
import { Localisation } from "./Localisation";

export class Affectation extends Model<InferAttributes<Affectation>, InferCreationAttributes<Affectation>> {
  declare id: CreationOptional<string>
  declare immobilisationId: ForeignKey<Immobilisation['id']>
  declare siteId: ForeignKey<Site['id'] | null>
  declare departementId: ForeignKey<Departement['id'] | null>
  declare localisationId: ForeignKey<Localisation['id'] | null>
  declare responsableNom: CreationOptional<string>
  declare dateAffectation: string
  declare dateRetour: CreationOptional<string>
  declare motif: CreationOptional<string>
  declare readonly createdAt: CreationOptional<Date>
  declare readonly updatedAt: CreationOptional<Date>
}

Affectation.init({
  id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
  immobilisationId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  siteId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
  departementId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
  localisationId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
  responsableNom: { type: new DataTypes.STRING, allowNull: true },
  dateAffectation: { type: DataTypes.DATEONLY, allowNull: false },
  dateRetour: { type: DataTypes.DATEONLY, allowNull: true },
  motif: { type: DataTypes.TEXT, allowNull: true },
  createdAt: DataTypes.DATE,
  updatedAt: DataTypes.DATE,
}, {
  sequelize: DatabaseConnection.getInstance().sequelize,
  paranoid: true,
  modelName: MODULE_MODEL_PREFIX + 'Affectation',
  tableName: MODULE_TABLE_PREFIX + 'affectation',
  timestamps: true
})
