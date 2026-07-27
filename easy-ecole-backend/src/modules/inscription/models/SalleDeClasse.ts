import { Model, InferAttributes, InferCreationAttributes, CreationOptional, DataTypes, NonAttribute, ForeignKey, Association } from "sequelize";
import { DatabaseConnection } from "../../../core/helpers/DatabaseConnection";
import { MODULE_MODEL_PREFIX, MODULE_TABLE_PREFIX } from "../InscriptionModule";
import { Classe } from "./Classe";
import { Localisation } from "../../immobilisation/models/Localisation";

export type EquipementSalle = 'tableau' | 'videoprojecteur' | 'climatisation' | 'ordinateur' | 'wifi' | 'sonorisation' | 'micro' | 'cameras';

export class SalleDeClasse extends Model<InferAttributes<SalleDeClasse>, InferCreationAttributes<SalleDeClasse>> {
  declare id: CreationOptional<number>
  declare libelle: string
  declare description: CreationOptional<string>
  declare capacite: CreationOptional<number>
  declare equipements: CreationOptional<string | null>
  declare localisationId: ForeignKey<Localisation['id'] | null>
  declare classeId: ForeignKey<Classe['id']>
  declare classe?: NonAttribute<Classe>
  declare localisation?: NonAttribute<Localisation>

  declare readonly createdAt: CreationOptional<Date>
  declare readonly updatedAt: CreationOptional<Date>

  declare static associations: {
    classe: Association<SalleDeClasse, Classe>
    localisation: Association<SalleDeClasse, Localisation>
  };
}

SalleDeClasse.init({
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    autoIncrement: true,
    primaryKey: true
  },
  libelle: {
    type: new DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  description: {
    type: new DataTypes.STRING,
    allowNull: true
  },
  capacite: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: true,
    defaultValue: 30
  },
  equipements: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: "Liste JSON des equipements de la salle: tableau, videoprojecteur, climatisation, ordinateur, wifi, sonorisation, micro, cameras"
  },
  localisationId: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: true
  },
  classeId: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: true
  },
  createdAt: DataTypes.DATE,
  updatedAt: DataTypes.DATE,
}, {
  sequelize: DatabaseConnection.getInstance().sequelize,
  paranoid: true,
  modelName: MODULE_MODEL_PREFIX + 'SalleDeClasse',
  tableName: MODULE_TABLE_PREFIX + 'salles_de_classes',
  timestamps: true
})
