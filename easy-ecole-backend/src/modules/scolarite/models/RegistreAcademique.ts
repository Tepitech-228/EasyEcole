import { Model, InferAttributes, InferCreationAttributes, CreationOptional, DataTypes, ForeignKey } from "sequelize";
import { DatabaseConnection } from "../../../core/helpers/DatabaseConnection";
import { MODULE_MODEL_PREFIX, MODULE_TABLE_PREFIX } from "../ScolariteModule";
import { CursusApprenant } from "../../inscription/models/CursusApprenant";

export class RegistreAcademique extends Model<InferAttributes<RegistreAcademique>, InferCreationAttributes<RegistreAcademique>> {
  declare id: CreationOptional<number>
  declare etudiant: string
  declare matricule: string
  declare classe: string
  declare filiere: string | null
  declare niveau: string | null
  declare moyenne: number
  declare rang: number
  declare decision: string
  declare anneeScolaire: string
  declare cursusApprenantId: ForeignKey<CursusApprenant['id'] | null>

  declare readonly createdAt: CreationOptional<Date>
  declare readonly updatedAt: CreationOptional<Date>
}

RegistreAcademique.init({
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    autoIncrement: true,
    primaryKey: true
  },
  etudiant: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  matricule: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  classe: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  filiere: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  niveau: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  moyenne: {
    type: DataTypes.FLOAT,
    allowNull: false
  },
  rang: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  decision: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  anneeScolaire: {
    type: DataTypes.STRING(20),
    allowNull: false
  },
  cursusApprenantId: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: true,
    references: {
      model: CursusApprenant,
      key: 'id'
    },
    onDelete: 'SET NULL'
  },
  createdAt: DataTypes.DATE,
  updatedAt: DataTypes.DATE,
}, {
  sequelize: DatabaseConnection.getInstance().sequelize,
  paranoid: true,
  modelName: MODULE_MODEL_PREFIX + 'RegistreAcademique',
  tableName: MODULE_TABLE_PREFIX + 'registres_academiques',
  timestamps: true
})
