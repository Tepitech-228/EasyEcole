import { Model, InferAttributes, InferCreationAttributes, CreationOptional, DataTypes, ForeignKey } from "sequelize";
import { DatabaseConnection } from "../../../core/helpers/DatabaseConnection";
import { MODULE_MODEL_PREFIX, MODULE_TABLE_PREFIX } from "../ImmobilisationModule";
import { CategorieImmobilisation } from "./CategorieImmobilisation";
import { Localisation } from "./Localisation";
import { Departement } from "./Departement";
import { Site } from "./Site";

export class Immobilisation extends Model<InferAttributes<Immobilisation>, InferCreationAttributes<Immobilisation>> {
  declare id: CreationOptional<string>
  declare nom: string
  declare reference: string
  declare description: CreationOptional<string>
  declare codeQR: CreationOptional<string>
  declare categorieId: ForeignKey<CategorieImmobilisation['id'] | null>
  declare localisationId: ForeignKey<Localisation['id'] | null>
  declare departementId: ForeignKey<Departement['id'] | null>
  declare siteId: ForeignKey<Site['id'] | null>
  declare etat: CreationOptional<string>
  declare dateMiseEnService: string
  declare valeurAcquisition: number
  declare responsableNom: CreationOptional<string>
  declare readonly createdAt: CreationOptional<Date>
  declare readonly updatedAt: CreationOptional<Date>
}

Immobilisation.init({
  id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
  nom: { type: new DataTypes.STRING, allowNull: false },
  reference: { type: new DataTypes.STRING, allowNull: false, unique: true },
  description: { type: DataTypes.TEXT, allowNull: true },
  codeQR: { type: DataTypes.TEXT, allowNull: true },
  categorieId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
  localisationId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
  departementId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
  siteId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
  etat: { type: DataTypes.ENUM('neuf', 'bon', 'moyen', 'mauvais', 'reforme'), defaultValue: 'bon' },
  dateMiseEnService: { type: DataTypes.DATEONLY, allowNull: false },
  valeurAcquisition: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
  responsableNom: { type: new DataTypes.STRING, allowNull: true },
  createdAt: DataTypes.DATE,
  updatedAt: DataTypes.DATE,
}, {
  sequelize: DatabaseConnection.getInstance().sequelize,
  paranoid: true,
  modelName: MODULE_MODEL_PREFIX + 'Immobilisation',
  tableName: MODULE_TABLE_PREFIX + 'immobilisation',
  timestamps: true
})
