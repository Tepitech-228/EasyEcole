import { Model, InferAttributes, InferCreationAttributes, CreationOptional, DataTypes, ForeignKey, NonAttribute, Association } from "sequelize";
import { DatabaseConnection } from "../../../core/helpers/DatabaseConnection";
import { EtatsValidationParcours } from "../../../core/enums/EtatsValidationParcours";
import { DemandeOrientation } from "./DemandeOrientation";
import { Parcours } from "./Parcours";
import { PrerequisParcoursChoisi } from "./PrerequisParcoursChoisi";
import { MODULE_MODEL_PREFIX, MODULE_TABLE_PREFIX } from "../OrientationModule";

export class ParcoursChoisi extends Model<InferAttributes<ParcoursChoisi>, InferCreationAttributes<ParcoursChoisi>> {
  declare id: CreationOptional<string>
  declare etatDeValidation: EtatsValidationParcours
  declare messageDeValidation: string
  declare parcoursId: ForeignKey<Parcours['id']>
  declare parcours?: NonAttribute<Parcours>
  declare demandeOrientationId?: ForeignKey<DemandeOrientation['id']>
  declare demandeOrientation?: NonAttribute<DemandeOrientation>
  declare prerequisParcoursChoisis?: PrerequisParcoursChoisi[]
  
  declare readonly createdAt: CreationOptional<Date>
  declare readonly updatedAt: CreationOptional<Date>

  declare static associations: {
    prerequisParcoursChoisis: Association<ParcoursChoisi, PrerequisParcoursChoisi>
  };
}

ParcoursChoisi.init({
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    autoIncrement: true,
    primaryKey: true
  },
  etatDeValidation: {
    type: DataTypes.ENUM,
    values: [EtatsValidationParcours.VALIDE, EtatsValidationParcours.ENCOURS, EtatsValidationParcours.REJETE],
    defaultValue: EtatsValidationParcours.ENCOURS,
    allowNull: false
  },
  messageDeValidation: {
    type: new DataTypes.STRING,
    allowNull: true
  },
  createdAt: DataTypes.DATE,
  updatedAt: DataTypes.DATE,
}, {
  sequelize: DatabaseConnection.getInstance().sequelize,
  paranoid: true,
  modelName: MODULE_MODEL_PREFIX + 'ParcoursChoisi',
  tableName: MODULE_TABLE_PREFIX + 'parcours_choisis',
  timestamps: true
})