import { Model, InferAttributes, InferCreationAttributes, CreationOptional, DataTypes, ForeignKey, NonAttribute } from "sequelize";
import { DatabaseConnection } from "../../../core/helpers/DatabaseConnection";
import { MODULE_MODEL_PREFIX, MODULE_TABLE_PREFIX } from "../ScolariteModule";
import { CursusApprenant } from "../../inscription/models/CursusApprenant";
import { AnneeAcademique } from "../../inscription/models/AnneeAcademique";
import { Utilisateur } from "../../auth/models/Utilisateur";

export class DecisionPassage extends Model<InferAttributes<DecisionPassage>, InferCreationAttributes<DecisionPassage>> {
  declare id: CreationOptional<string>
  declare cursusApprenantId: ForeignKey<CursusApprenant['id']>
  declare cursusApprenant?: NonAttribute<CursusApprenant>
  declare anneeAcademiqueId: ForeignKey<AnneeAcademique['id']>
  declare anneeAcademique?: NonAttribute<AnneeAcademique>
  declare moyenneGenerale: number
  declare creditsAcquis: number
  declare creditsRequis: number
  declare decision: 'admis' | 'rattrapage' | 'redoublement' | 'exclusion'
  declare dateDecision: Date
  declare validePar: ForeignKey<Utilisateur['id']>
  declare valideParUtilisateur?: NonAttribute<Utilisateur>

  declare readonly createdAt: CreationOptional<Date>
  declare readonly updatedAt: CreationOptional<Date>
}

DecisionPassage.init({
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    autoIncrement: true,
    primaryKey: true
  },
  moyenneGenerale: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: false
  },
  creditsAcquis: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  creditsRequis: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  decision: {
    type: DataTypes.ENUM('admis', 'rattrapage', 'redoublement', 'exclusion'),
    allowNull: false
  },
  dateDecision: {
    type: DataTypes.DATE,
    allowNull: false
  },
  createdAt: DataTypes.DATE,
  updatedAt: DataTypes.DATE,
}, {
  sequelize: DatabaseConnection.getInstance().sequelize,
  modelName: MODULE_MODEL_PREFIX + 'DecisionPassage',
  tableName: MODULE_TABLE_PREFIX + 'decisions_passage',
  timestamps: true
})
