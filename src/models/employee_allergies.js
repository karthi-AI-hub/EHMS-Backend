module.exports = (sequelize, DataTypes) => {
  const EmployeeAllergies = sequelize.define(
    "employee_allergies",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      employee_id: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      allergy_name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      created_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
      updated_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
      created_by: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      updated_by: {
        type: DataTypes.STRING,
        allowNull: true,
      },
    },
    {
      tableName: "employee_allergies",
      timestamps: false,
    }
  );

  EmployeeAllergies.associate = (models) => {
    EmployeeAllergies.belongsTo(models.users, {
      foreignKey: "created_by",
      as: "creator",
    });
    EmployeeAllergies.belongsTo(models.users, {
      foreignKey: "updated_by",
      as: "updater",
    });
  };

  return EmployeeAllergies;
};