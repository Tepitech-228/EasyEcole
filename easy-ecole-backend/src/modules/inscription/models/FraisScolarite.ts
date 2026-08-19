import { Model, InferAttributes, InferCreationAttributes, CreationOptional, DataTypes, ForeignKey, NonAttribute, Association } from "sequelize";
import { DatabaseConnection } from "../../../core/helpers/DatabaseConnection";
import { MODULE_MODEL_PREFIX, MODULE_TABLE_PREFIX } from "../InscriptionModule";
import { Session } from "./Session";

/**
 * Modalités de paiement de la scolarité : 1 versement unique, 3 versements ou
 * 10 mensualités. Le montant global de scolarité est divisé en `n` échéances
 * (n = 1/3/10), la dernière absorbant le reste (voir
 * GenerateurEcheancierScolariteService).
 */
export const MODALITES_SCOLARITE: readonly ['1x', '3x', '10x'] = ['1x', '3x', '10x'] as const;
export type ModaliteScolarite = (typeof MODALITES_SCOLARITE)[number];

/**
 * Vérifie qu'une valeur brute (body / query) est une modalité de scolarité valide.
 */
export const estModaliteScolarite = (value: unknown): value is ModaliteScolarite =>
    typeof value === 'string' && (MODALITES_SCOLARITE as readonly string[]).includes(value);

export class FraisScolarite extends Model<InferAttributes<FraisScolarite>, InferCreationAttributes<FraisScolarite>> {
  declare id: CreationOptional<number>
  declare sessionId: ForeignKey<Session['id']>
  declare session?: NonAttribute<Session>
  declare montant: number
  declare modalite: CreationOptional<ModaliteScolarite>
  declare actif: CreationOptional<boolean>

  declare readonly createdAt: CreationOptional<Date>
  declare readonly updatedAt: CreationOptional<Date>

  declare static associations: {
    session: Association<FraisScolarite, Session>
  };
}

FraisScolarite.init({
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    autoIncrement: true,
    primaryKey: true
  },
  sessionId: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false
    // Un seul paramétrage de scolarité par session : l'upsert du contrôleur
    // met à jour la ligne existante au lieu d'en créer une seconde.
  },
  montant: {
    type: DataTypes.FLOAT.UNSIGNED,
    allowNull: false
  },
  modalite: {
    type: DataTypes.ENUM('1x', '3x', '10x'),
    defaultValue: '10x',
    allowNull: false
  },
  actif: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    allowNull: false
  },
  createdAt: DataTypes.DATE,
  updatedAt: DataTypes.DATE,
}, {
  sequelize: DatabaseConnection.getInstance().sequelize,
  paranoid: true,
  modelName: MODULE_MODEL_PREFIX + 'FraisScolarite',
  tableName: MODULE_TABLE_PREFIX + 'frais_scolarites',
  timestamps: true
})