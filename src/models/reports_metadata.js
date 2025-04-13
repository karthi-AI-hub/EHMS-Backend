module.exports = (sequelize, DataTypes) => {
  const ReportsMetadata = sequelize.define(
    "reports_metadata",
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
      report_type: {
        type: DataTypes.ENUM("Lab", "Ecg", "Scan", "Xray", "Pharmacy", "Others"),
        allowNull: false,
      },
      report_subtype: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      file_name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      file_path: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      notes: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      uploaded_by: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      uploaded_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
      is_deleted: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      deleted_by: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      deleted_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      delete_reason: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
    },
    {
      tableName: "reports_metadata",
      timestamps: false,
    }
  );

  ReportsMetadata.associate = (models) => {
    ReportsMetadata.belongsTo(models.users, {
      foreignKey: "uploaded_by",
      as: "uploader",
    });
  };

  return ReportsMetadata;
};