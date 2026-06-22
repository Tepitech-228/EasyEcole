import { Model, InferAttributes, InferCreationAttributes, CreationOptional, DataTypes, ForeignKey, NonAttribute, Association } from "sequelize";
import { DatabaseConnection } from "../../../core/helpers/DatabaseConnection";
import { MODULE_MODEL_PREFIX, MODULE_TABLE_PREFIX } from "../AchatsModule";
import { Utilisateur } from "../../auth/models/Utilisateur";
import { LigneDemande } from "./LigneDemande";
import { Validation } from "./Validation";
import { Engagement } from "./Engagement";
import { Commande } from "./Commande";

export class Demande extends Model<InferAttributes<Demande>, InferCreationAttributes<Demande>> {
  declare id: CreationOptional<string>
  declare soumisParId: ForeignKey<Utilisateur['id']>
  declare soumisPar?: NonAttribute<Utilisateur>
  declare description: string
  declare statut: CreationOptional<string>
  declare dateSoumission: CreationOptional<Date>
  declare validateurChoisiId: ForeignKey<Utilisateur['id'] | null>
  declare readonly createdAt: CreationOptional<Date>
  declare readonly updatedAt: CreationOptional<Date>

  declare lignesDemande?: NonAttribute<LigneDemande[]>
  declare validations?: NonAttribute<Validation[]>
  declare engagements?: NonAttribute<Engagement[]>
  declare commandes?: NonAttribute<Commande[]>

  declare static associations: {
    soumisPar: Association<Demande, Utilisateur>
    lignesDemande: Association<Demande, LigneDemande>
    validations: Association<Demande, Validation>
    engagements: Association<Demande, Engagement>
    commandes: Association<Demande, Commande>
  };
}

Demande.init({
  id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
  description: { type: DataTypes.TEXT, allowNull: false },
  statut: { type: DataTypes.ENUM('brouillon', 'soumise', 'validee', 'rejetee', 'commandee', 'recue'), defaultValue: 'brouillon' },
  dateSoumission: { type: DataTypes.DATE, allowNull: true },
  createdAt: DataTypes.DATE,
  updatedAt: DataTypes.DATE,
}, {
  sequelize: DatabaseConnection.getInstance().sequelize,
  paranoid: true,
  modelName: MODULE_MODEL_PREFIX + 'Demande',
  tableName: MODULE_TABLE_PREFIX + 'demandes',
  timestamps: true
})
