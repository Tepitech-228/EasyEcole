import { Model, InferAttributes, InferCreationAttributes, CreationOptional, DataTypes, ForeignKey } from "sequelize";
import { DatabaseConnection } from "../../../core/helpers/DatabaseConnection";
import { MODULE_MODEL_PREFIX, MODULE_TABLE_PREFIX } from "../GedModule";
import { ProcessusGenerateur } from "./ProcessusGenerateur";
import Domain from "./Domain";

class RolePermission extends Model<InferAttributes<RolePermission>, InferCreationAttributes<RolePermission>> {
  declare id: CreationOptional<number>
  declare confidentialityLevel: string
  declare role: string

  // Granular permissions
  declare canRead: CreationOptional<boolean>
  declare canWrite: CreationOptional<boolean>
  declare canDelete: CreationOptional<boolean>
  declare canDownload: CreationOptional<boolean>

  // Scoped permissions
  declare processusGenerateurId: ForeignKey<ProcessusGenerateur['id']> | null
  declare domainId: ForeignKey<Domain['id']> | null

  declare readonly createdAt: CreationOptional<Date>
  declare readonly updatedAt: CreationOptional<Date>
  declare readonly deletedAt: CreationOptional<Date>
}

RolePermission.init({
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    autoIncrement: true,
    primaryKey: true
  },
  confidentialityLevel: {
    type: DataTypes.ENUM('public', 'interne', 'restreint', 'confidentiel'),
    allowNull: false
  },
  role: {
    type: new DataTypes.STRING,
    allowNull: false
  },
  canRead: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true
  },
  canWrite: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  canDelete: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  canDownload: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true
  },
  processusGenerateurId: {
    type: DataTypes.UUID,
    allowNull: true
  },
  domainId: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: true
  },
  createdAt: DataTypes.DATE,
  updatedAt: DataTypes.DATE,
  deletedAt: DataTypes.DATE
}, {
  sequelize: DatabaseConnection.getInstance().sequelize,
  paranoid: true,
  modelName: MODULE_MODEL_PREFIX + 'RolePermission',
  tableName: MODULE_TABLE_PREFIX + 'role_permissions',
  timestamps: true,
  indexes: [
    {
      unique: true,
      name: 'idx_rp_conf_level_role_proc_dom',
      fields: ['confidentialityLevel', 'role', 'processusGenerateurId', 'domainId']
    }
  ]
});

export default RolePermission;
