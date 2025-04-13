module.exports = (sequelize, DataTypes) => {
  const EmployeeConditions = sequelize.define(
    "employee_conditions",
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
      condition_name: {
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
      tableName: "employee_conditions",
      timestamps: false,
    }
  );

  EmployeeConditions.associate = (models) => {
    EmployeeConditions.belongsTo(models.users, {
      foreignKey: "created_by",
      as: "creator",
    });
    EmployeeConditions.belongsTo(models.users, {
      foreignKey: "updated_by",
      as: "updater",
    });
  };

  return EmployeeConditions;
};