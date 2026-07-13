import { Model, InferAttributes, InferCreationAttributes, CreationOptional, DataTypes, ForeignKey, NonAttribute, Association } from "sequelize";
import { DatabaseConnection } from "../../../core/helpers/DatabaseConnection";
import { NiveauEtude } from "./NiveauEtude";
import { DeboucheParcours } from "./DeboucheParcours";
import { PrerequisParcours } from "./PrerequisParcours";
import { Categorie } from "./Categorie";
import { MODULE_MODEL_PREFIX, MODULE_TABLE_PREFIX } from "../OrientationModule";

export class Parcours extends Model<InferAttributes<Parcours>, InferCreationAttributes<Parcours>> {
  declare id: CreationOptional<string>
  declare titre: string
  declare image: CreationOptional<string>
  declare dureeDeFormation: CreationOptional<string>
  declare type: CreationOptional<string>
  declare videoExplicative: CreationOptional<string>
  declare contenu: string
  declare categorieId: ForeignKey<Categorie['id']>
  declare categorie?: NonAttribute<Categorie>
  declare niveauEtudeId: ForeignKey<NiveauEtude['id']>
  declare niveauEtude?: NonAttribute<NiveauEtude>
  declare debouchesParcours?: DeboucheParcours[]
  declare prerequisParcours?: NonAttribute<PrerequisParcours[]>

  declare readonly createdAt: CreationOptional<Date>
  declare readonly updatedAt: CreationOptional<Date>

  declare static associations: {
    categorie: Association<Parcours, Categorie>
    niveauEtude: Association<Parcours, NiveauEtude>
    debouchesParcours: Association<Parcours, DeboucheParcours>
    prerequisParcours: Association<Parcours, PrerequisParcours>
  };
}

Parcours.init({
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    autoIncrement: true,
    primaryKey: true
  },
  titre: {
    type: new DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  dureeDeFormation: {
    type: new DataTypes.STRING,
    allowNull: true
  },
  type: {
    type: DataTypes.ENUM('LICENCE', 'MASTER', 'DOCTORAT'),
    allowNull: true
  },
  image: {
    type: new DataTypes.STRING,
    allowNull: true
  },
  videoExplicative: {
    type: new DataTypes.STRING,
    allowNull: true
  },
  contenu: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  createdAt: DataTypes.DATE,
  updatedAt: DataTypes.DATE,
}, {
  sequelize: DatabaseConnection.getInstance().sequelize,
  paranoid: true,
  modelName: MODULE_MODEL_PREFIX + 'Parcours',
  tableName: MODULE_TABLE_PREFIX + 'parcours',
  timestamps: true
})