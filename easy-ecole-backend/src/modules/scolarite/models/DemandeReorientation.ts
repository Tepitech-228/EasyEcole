import { Model, InferAttributes, InferCreationAttributes, CreationOptional, DataTypes, ForeignKey, NonAttribute } from "sequelize";
import { DatabaseConnection } from "../../../core/helpers/DatabaseConnection";
import { MODULE_MODEL_PREFIX, MODULE_TABLE_PREFIX } from "../ScolariteModule";
import { CursusApprenant } from "../../inscription/models/CursusApprenant";
import { Parcours } from "../../inscription/models/Parcours";
import { Utilisateur } from "../../auth/models/Utilisateur";

export class DemandeReorientation extends Model<InferAttributes<DemandeReorientation>, InferCreationAttributes<DemandeReorientation>> {
  declare id: CreationOptional<string>
  declare cursusApprenantId: ForeignKey<CursusApprenant['id']>
  declare cursusApprenant?: NonAttribute<CursusApprenant>
  declare parcoursActuelId: ForeignKey<Parcours['id']>
  declare parcoursActuel?: NonAttribute<Parcours>
  declare parcoursCibleId: ForeignKey<Parcours['id']>
  declare parcoursCible?: NonAttribute<Parcours>
  declare motif: string
  declare statut: CreationOptional<'soumise' | 'etude' | 'approuvee' | 'rejetee'>
  declare dateTraitement: CreationOptional<Date>
  declare traitePar: CreationOptional<ForeignKey<Utilisateur['id']>>
  declare traiteParUtilisateur?: NonAttribute<Utilisateur>

  declare readonly createdAt: CreationOptional<Date>
  declare readonly updatedAt: CreationOptional<Date>
}

DemandeReorientation.init({
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    autoIncrement: true,
    primaryKey: true
  },
  motif: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  statut: {
    type: DataTypes.ENUM('soumise', 'etude', 'approuvee', 'rejetee'),
    defaultValue: 'soumise'
  },
  dateTraitement: {
    type: DataTypes.DATE,
    allowNull: true
  },
  createdAt: DataTypes.DATE,
  updatedAt: DataTypes.DATE,
}, {
  sequelize: DatabaseConnection.getInstance().sequelize,
  modelName: MODULE_MODEL_PREFIX + 'DemandeReorientation',
  tableName: MODULE_TABLE_PREFIX + 'demandes_reorientation',
  timestamps: true
})
