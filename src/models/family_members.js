module.exports = (sequelize, DataTypes) => {
    const FamilyMembers = sequelize.define(
        "family_members",
        {
            id: {
                type: DataTypes.INTEGER,
                autoIncrement: true,
                primaryKey: true,
            },
            employee_id: {
                type: DataTypes.STRING(50),
                allowNull: false,
            },
            dependent_id: {
                type: DataTypes.STRING(50),
                unique: true,
                allowNull: false,
            },
            name: {
                type: DataTypes.STRING(100),
                allowNull: false,
            },
            relation: {
                type: DataTypes.ENUM("HUSBAND", "WIFE", "SON", "DAUGHTER", "MOTHER", "FATHER", "OTHER"),
                allowNull: false,
            },
            created_at: {
                type: DataTypes.DATE,
                defaultValue: DataTypes.NOW,
            },
            status: {
                type: DataTypes.STRING(50),
                allowNull: true,
                defaultValue: 'ACTIVE'
            },
        },
        {
            timestamps: false,
        }
    );

    return FamilyMembers;
};