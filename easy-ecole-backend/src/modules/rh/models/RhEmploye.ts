import { Model, InferAttributes, InferCreationAttributes, CreationOptional, DataTypes, ForeignKey, NonAttribute, Association } from "sequelize";
import { DatabaseConnection } from "../../../core/helpers/DatabaseConnection";
import { MODULE_MODEL_PREFIX, MODULE_TABLE_PREFIX } from "../RhModule";
import { RhDepartement } from "./RhDepartement";
import { RhPoste } from "./RhPoste";
import { RhTypeContrat } from "./RhTypeContrat";
import { RhFicheEvaluation } from "./RhFicheEvaluation";
import { RhParticipationFormation } from "./RhParticipationFormation";
import { RhBulletinPaie } from "./RhBulletinPaie";
import { RhPrestationEnseignant } from "./RhPrestationEnseignant";

export class RhEmploye extends Model<InferAttributes<RhEmploye>, InferCreationAttributes<RhEmploye>> {
  declare id: CreationOptional<string>
  declare utilisateurId: string
  declare posteId: ForeignKey<RhPoste['id']>
  declare departementId: ForeignKey<RhDepartement['id']>
  declare dateEmbauche: Date
  declare typeContratId: ForeignKey<RhTypeContrat['id']>
  declare salaireBase: CreationOptional<number>
  declare statut: CreationOptional<string>
  declare readonly createdAt: CreationOptional<Date>
  declare readonly updatedAt: CreationOptional<Date>

  declare poste?: NonAttribute<RhPoste>
  declare departement?: NonAttribute<RhDepartement>
  declare typeContrat?: NonAttribute<RhTypeContrat>
  declare fichesEvaluation?: NonAttribute<RhFicheEvaluation[]>
  declare participationsFormation?: NonAttribute<RhParticipationFormation[]>
  declare bulletinsPaie?: NonAttribute<RhBulletinPaie[]>
  declare prestationsEnseignant?: NonAttribute<RhPrestationEnseignant[]>

  declare static associations: {
    poste: Association<RhEmploye, RhPoste>
    departement: Association<RhEmploye, RhDepartement>
    typeContrat: Association<RhEmploye, RhTypeContrat>
    fichesEvaluation: Association<RhEmploye, RhFicheEvaluation>
    participationsFormation: Association<RhEmploye, RhParticipationFormation>
    bulletinsPaie: Association<RhEmploye, RhBulletinPaie>
    prestationsEnseignant: Association<RhEmploye, RhPrestationEnseignant>
  }
}

RhEmploye.init({
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    autoIncrement: true,
    primaryKey: true
  },
  utilisateurId: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false
  },
  dateEmbauche: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  salaireBase: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: true,
    defaultValue: 0
  },
  statut: {
    type: DataTypes.ENUM('actif', 'suspendu', 'quitté'),
    defaultValue: 'actif'
  },
  createdAt: DataTypes.DATE,
  updatedAt: DataTypes.DATE,
}, {
  sequelize: DatabaseConnection.getInstance().sequelize,
  paranoid: true,
  modelName: MODULE_MODEL_PREFIX + 'Employe',
  tableName: MODULE_TABLE_PREFIX + 'employes',
  timestamps: true
})
