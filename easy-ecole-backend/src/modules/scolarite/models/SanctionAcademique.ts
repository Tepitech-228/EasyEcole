import { Model, InferAttributes, InferCreationAttributes, CreationOptional, DataTypes, ForeignKey, NonAttribute } from "sequelize";
import { DatabaseConnection } from "../../../core/helpers/DatabaseConnection";
import { MODULE_MODEL_PREFIX, MODULE_TABLE_PREFIX } from "../ScolariteModule";
import { CursusApprenant } from "../../inscription/models/CursusApprenant";
import { Utilisateur } from "../../auth/models/Utilisateur";

export class SanctionAcademique extends Model<InferAttributes<SanctionAcademique>, InferCreationAttributes<SanctionAcademique>> {
  declare id: CreationOptional<string>
  declare cursusApprenantId: ForeignKey<CursusApprenant['id']>
  declare cursusApprenant?: NonAttribute<CursusApprenant>
  declare type: 'avertissement' | 'suspension' | 'exclusion'
  declare dateDebut: Date
  declare dateFin: CreationOptional<Date>
  declare motif: string
  declare decidePar: ForeignKey<Utilisateur['id']>
  declare decideParUtilisateur?: NonAttribute<Utilisateur>

  declare readonly createdAt: CreationOptional<Date>
  declare readonly updatedAt: CreationOptional<Date>
}

SanctionAcademique.init({
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    autoIncrement: true,
    primaryKey: true
  },
  type: {
    type: DataTypes.ENUM('avertissement', 'suspension', 'exclusion'),
    allowNull: false
  },
  dateDebut: {
    type: DataTypes.DATE,
    allowNull: false
  },
  dateFin: {
    type: DataTypes.DATE,
    allowNull: true
  },
  motif: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  createdAt: DataTypes.DATE,
  updatedAt: DataTypes.DATE,
}, {
  sequelize: DatabaseConnection.getInstance().sequelize,
  modelName: MODULE_MODEL_PREFIX + 'SanctionAcademique',
  tableName: MODULE_TABLE_PREFIX + 'sanctions_academiques',
  timestamps: true
})
