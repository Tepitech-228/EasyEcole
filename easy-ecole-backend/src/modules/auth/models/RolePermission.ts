import { Model, InferAttributes, InferCreationAttributes, CreationOptional, DataTypes, ForeignKey } from "sequelize";
import { DatabaseConnection } from "../../../core/helpers/DatabaseConnection";
import { MODULE_MODEL_PREFIX, MODULE_TABLE_PREFIX } from "../AuthModule";

export class RolePermission extends Model<InferAttributes<RolePermission>, InferCreationAttributes<RolePermission>> {
    declare id: CreationOptional<string>
    declare roleId: ForeignKey<string>
    declare permissionId: ForeignKey<string>

    declare readonly createdAt: CreationOptional<Date>
    declare readonly updatedAt: CreationOptional<Date>
}

RolePermission.init({
    id: {
        type: DataTypes.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true
    },
    roleId: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false
    },
    permissionId: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false
    },
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE,
}, {
    sequelize: DatabaseConnection.getInstance().sequelize,
    modelName: MODULE_MODEL_PREFIX + 'RolePermission',
    tableName: MODULE_TABLE_PREFIX + 'role_permissions',
    paranoid: true,
    timestamps: true
});
