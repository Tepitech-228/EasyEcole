import { Model, InferAttributes, InferCreationAttributes, CreationOptional, DataTypes, ForeignKey, NonAttribute, Association } from "sequelize";
import { DatabaseConnection } from "../../../core/helpers/DatabaseConnection";
import { Classe } from "./Classe";
import { Cours } from "./Cours";
import { MODULE_MODEL_PREFIX, MODULE_TABLE_PREFIX } from "../InscriptionModule";
import { ChapitreCours } from "./ChapitreCours";
import { TypesRessource } from "../../../core/enums/TypesRessource";
import { FichierRessource } from "./FichierRessource";

export class Ressource extends Model<InferAttributes<Ressource>, InferCreationAttributes<Ressource>> {
  declare id: CreationOptional<string>
  declare titre: string
  declare description: CreationOptional<string>
  declare type: CreationOptional<TypesRessource>
  declare dateDebut: CreationOptional<Date>
  declare dateFin: CreationOptional<Date>
  declare active: CreationOptional<boolean>
  declare chapitreCoursId?: ForeignKey<ChapitreCours['id']>
  declare chapitreCours?: NonAttribute<ChapitreCours>
  declare fichiersRessource?: NonAttribute<FichierRessource[]>

  declare readonly createdAt: CreationOptional<Date>
  declare readonly updatedAt: CreationOptional<Date>

  declare static associations: {
    chapitreCours: Association<Ressource, ChapitreCours>
    fichiersRessource: Association<Ressource, FichierRessource>
  };
}

Ressource.init({
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    autoIncrement: true,
    primaryKey: true
  },
  titre: {
    type: new DataTypes.STRING,
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  type: {
    type: DataTypes.ENUM,
    values: [TypesRessource.NORMALE, TypesRessource.SIMPLE_DOCUMENT, TypesRessource.TRAVAIL_A_RENDRE, TypesRessource.TEST],
    defaultValue: TypesRessource.NORMALE
  },
  dateDebut: {
    type: DataTypes.DATE,
    allowNull: true
  },
  dateFin: {
    type: DataTypes.DATE,
    allowNull: true
  },
  active: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    allowNull: false
  },
  createdAt: DataTypes.DATE,
  updatedAt: DataTypes.DATE,
}, {
  sequelize: DatabaseConnection.getInstance().sequelize,
  paranoid: true,
  modelName: MODULE_MODEL_PREFIX + 'Ressource',
  tableName: MODULE_TABLE_PREFIX + 'ressources',
  timestamps: true
})