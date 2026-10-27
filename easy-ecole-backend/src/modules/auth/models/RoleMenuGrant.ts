import { Model, InferAttributes, InferCreationAttributes, CreationOptional, DataTypes, ForeignKey } from "sequelize";
import { DatabaseConnection } from "../../../core/helpers/DatabaseConnection";
import { MODULE_MODEL_PREFIX, MODULE_TABLE_PREFIX } from "../AuthModule";

export class RoleMenuGrant extends Model<InferAttributes<RoleMenuGrant>, InferCreationAttributes<RoleMenuGrant>> {
    declare id: CreationOptional<string>
    declare roleId: ForeignKey<string>
    declare permissionKey: string

    declare readonly createdAt: CreationOptional<Date>
    declare readonly updatedAt: CreationOptional<Date>
}

RoleMenuGrant.init({
    id: {
        type: DataTypes.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true
    },
    roleId: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false
    },
    permissionKey: {
        type: new DataTypes.STRING(255),
        allowNull: false
    },
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE,
}, {
    sequelize: DatabaseConnection.getInstance().sequelize,
    modelName: MODULE_MODEL_PREFIX + 'RoleMenuGrant',
    tableName: MODULE_TABLE_PREFIX + 'role_menu_grants',
    paranoid: true,
    timestamps: true
});
