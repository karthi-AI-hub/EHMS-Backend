module.exports = (sequelize, DataTypes) => {
  const ReportInstructions = sequelize.define(
    "report_instructions",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      report_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      instruction: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      created_by: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      created_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      tableName: "report_instructions",
      timestamps: false,
    }
  );

  // Define associations
  ReportInstructions.associate = (models) => {
    ReportInstructions.belongsTo(models.users, {
      foreignKey: "created_by",
      as: "creator", // Alias used in the include statement
    });
    ReportInstructions.belongsTo(models.reports_metadata, {
      foreignKey: "report_id",
      as: "report",
    });
  };

  return ReportInstructions;
};