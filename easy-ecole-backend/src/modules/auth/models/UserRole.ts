import { Model, InferAttributes, InferCreationAttributes, CreationOptional, DataTypes, ForeignKey } from "sequelize";
import { DatabaseConnection } from "../../../core/helpers/DatabaseConnection";
import { MODULE_MODEL_PREFIX, MODULE_TABLE_PREFIX } from "../AuthModule";

export class UserRole extends Model<InferAttributes<UserRole>, InferCreationAttributes<UserRole>> {
    declare id: CreationOptional<string>
    declare utilisateurId: ForeignKey<string>
    declare roleId: ForeignKey<string>

    declare readonly createdAt: CreationOptional<Date>
    declare readonly updatedAt: CreationOptional<Date>
}

UserRole.init({
    id: {
        type: DataTypes.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true
    },
    utilisateurId: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false
    },
    roleId: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false
    },
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE,
}, {
    sequelize: DatabaseConnection.getInstance().sequelize,
    modelName: MODULE_MODEL_PREFIX + 'UserRole',
    tableName: MODULE_TABLE_PREFIX + 'user_roles',
    paranoid: true,
    timestamps: true
});
