import { Model, InferAttributes, InferCreationAttributes, CreationOptional, DataTypes, ForeignKey, Association } from "sequelize";
import { DatabaseConnection } from "../../../core/helpers/DatabaseConnection";
import { MODULE_MODEL_PREFIX, MODULE_TABLE_PREFIX } from "../InscriptionModule";
import { Cours } from "./Cours";
import { DemandeInscription } from "./DemandeInscription";
import { EtatsCoursChoisi } from "../../../core/enums/EtatsCoursChoisi";

export class DemandeInscriptionCours extends Model<InferAttributes<DemandeInscriptionCours>, InferCreationAttributes<DemandeInscriptionCours>> {
  declare demandeInscriptionId: ForeignKey<DemandeInscription['id']>
  declare coursId: ForeignKey<Cours['id']>
  declare etat: EtatsCoursChoisi

  declare readonly createdAt: CreationOptional<Date>
  declare readonly updatedAt: CreationOptional<Date>

  declare static associations: {
    demandeInscription: Association<DemandeInscriptionCours, DemandeInscription>,
    cours: Association<DemandeInscriptionCours, Cours>
  };
}

DemandeInscriptionCours.init({
  demandeInscriptionId: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false,
    unique: 'demande-cours'
  },
  coursId: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false,
    unique: 'demande-cours'
  },
  etat: {
    type: DataTypes.ENUM,
    values: [EtatsCoursChoisi.ENCOURS, EtatsCoursChoisi.VALIDE, EtatsCoursChoisi.REJETE],
    defaultValue: EtatsCoursChoisi.ENCOURS
  },
  createdAt: DataTypes.DATE,
  updatedAt: DataTypes.DATE,
}, {
  sequelize: DatabaseConnection.getInstance().sequelize,
  paranoid: true,
  modelName: MODULE_MODEL_PREFIX + 'DemandeInscriptionCours',
  tableName: MODULE_TABLE_PREFIX + 'cours_choisis',
  timestamps: true
})