import { Model, InferAttributes, InferCreationAttributes, CreationOptional, DataTypes, ForeignKey, NonAttribute, Association } from "sequelize";
import { DatabaseConnection } from "../../../core/helpers/DatabaseConnection";
import { MODULE_MODEL_PREFIX, MODULE_TABLE_PREFIX } from "../InscriptionModule";
import { DemandeInscription } from "./DemandeInscription";
import { Utilisateur } from "../../auth/models/Utilisateur";

export class ComiteVote extends Model<InferAttributes<ComiteVote>, InferCreationAttributes<ComiteVote>> {
  declare id: CreationOptional<number>
  declare demandeInscriptionId: ForeignKey<DemandeInscription['id']>
  declare membreId: ForeignKey<Utilisateur['id']>
  declare decision: 'valide' | 'correction_demandee' | 'rejete'
  declare motif: CreationOptional<string | null>
  /**
   * Règle métier — validation collégiale du comité :
   *   • Unanimité requise pour valider : TOUS les membres doivent voter 'valide'.
   *   • Un seul rejet suffit : un vote 'rejete' de n'importe quel membre
   *     bloque le dossier (principe du veto individuel).
   *
   * La validation effective du dossier (statutPipeline = 'valide')
   * est déterminée côté service en vérifiant :
   *   - absence de tout vote 'rejete' sur ce dossier,
   *   - presence d'au moins un vote par membre du comité,
   *   - tous les votes = 'valide'.
   */
  declare demandeInscription?: NonAttribute<DemandeInscription>
  declare membre?: NonAttribute<Utilisateur>

  declare readonly createdAt: CreationOptional<Date>
  declare readonly updatedAt: CreationOptional<Date>

  declare static associations: {
    demandeInscription: Association<ComiteVote, DemandeInscription>
    membre: Association<ComiteVote, Utilisateur>
  };
}

ComiteVote.init({
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    autoIncrement: true,
    primaryKey: true
  },
  demandeInscriptionId: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false
  },
  membreId: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false
  },
  decision: {
    type: DataTypes.ENUM('valide', 'correction_demandee', 'rejete'),
    allowNull: false
  },
  motif: {
    type: new DataTypes.TEXT,
    allowNull: true,
    defaultValue: null
  },
  createdAt: DataTypes.DATE,
  updatedAt: DataTypes.DATE,
}, {
  sequelize: DatabaseConnection.getInstance().sequelize,
  paranoid: false,
  modelName: MODULE_MODEL_PREFIX + 'ComiteVote',
  tableName: MODULE_TABLE_PREFIX + 'comite_votes',
  timestamps: true
})
