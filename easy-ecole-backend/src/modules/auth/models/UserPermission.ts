import { Model, InferAttributes, InferCreationAttributes, CreationOptional, DataTypes, ForeignKey } from "sequelize";
import { DatabaseConnection } from "../../../core/helpers/DatabaseConnection";
import { MODULE_MODEL_PREFIX, MODULE_TABLE_PREFIX } from "../AuthModule";

export class UserPermission extends Model<InferAttributes<UserPermission>, InferCreationAttributes<UserPermission>> {
    declare id: CreationOptional<string>
    declare utilisateurId: ForeignKey<string>
    declare permissionId: ForeignKey<string>
    declare estActif: boolean

    declare readonly createdAt: CreationOptional<Date>
    declare readonly updatedAt: CreationOptional<Date>
}

UserPermission.init({
    id: {
        type: DataTypes.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true
    },
    utilisateurId: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false
    },
    permissionId: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false
    },
    estActif: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
    },
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE,
}, {
    sequelize: DatabaseConnection.getInstance().sequelize,
    modelName: MODULE_MODEL_PREFIX + 'UserPermission',
    tableName: MODULE_TABLE_PREFIX + 'user_permissions',
    paranoid: true,
    timestamps: true
});
