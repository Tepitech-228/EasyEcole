import { Model, InferAttributes, InferCreationAttributes, CreationOptional, DataTypes, ForeignKey, NonAttribute, Association } from "sequelize";
import { DatabaseConnection } from "../../../core/helpers/DatabaseConnection";
import { MODULE_MODEL_PREFIX, MODULE_TABLE_PREFIX } from "../RhModule";
import { RhOffreEmploi } from "./RhOffreEmploi";
import { RhEntretien } from "./RhEntretien";

export class RhCandidature extends Model<InferAttributes<RhCandidature>, InferCreationAttributes<RhCandidature>> {
  declare id: CreationOptional<string>
  declare offreId: ForeignKey<RhOffreEmploi['id']>
  declare nom: string
  declare email: string
  declare telephone: CreationOptional<string>
  declare cv: CreationOptional<string>
  declare lettreMotivation: CreationOptional<string>
  declare statut: CreationOptional<string>
  declare readonly createdAt: CreationOptional<Date>
  declare readonly updatedAt: CreationOptional<Date>

  declare offre?: NonAttribute<RhOffreEmploi>
  declare entretiens?: NonAttribute<RhEntretien[]>

  declare static associations: {
    offre: Association<RhCandidature, RhOffreEmploi>
    entretiens: Association<RhCandidature, RhEntretien>
  }
}

RhCandidature.init({
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    autoIncrement: true,
    primaryKey: true
  },
  nom: {
    type: new DataTypes.STRING,
    allowNull: false
  },
  email: {
    type: new DataTypes.STRING,
    allowNull: false
  },
  telephone: {
    type: new DataTypes.STRING,
    allowNull: true
  },
  cv: {
    type: new DataTypes.STRING,
    allowNull: true
  },
  lettreMotivation: {
    type: new DataTypes.STRING,
    allowNull: true
  },
  statut: {
    type: DataTypes.ENUM('soumise', 'étudiée', 'retenue', 'rejetée'),
    defaultValue: 'soumise'
  },
  createdAt: DataTypes.DATE,
  updatedAt: DataTypes.DATE,
}, {
  sequelize: DatabaseConnection.getInstance().sequelize,
  paranoid: true,
  modelName: MODULE_MODEL_PREFIX + 'Candidature',
  tableName: MODULE_TABLE_PREFIX + 'candidatures',
  timestamps: true
})
