const { Sequelize, DataTypes } = require("sequelize");
require("dotenv").config();

const sequelize = new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASSWORD, {
    host: process.env.DB_HOST,
    dialect: "mysql",
    logging: false, // Disable logging for cleaner output
});

const db = {};

// Initialize Sequelize models
db.Sequelize = Sequelize;
db.sequelize = sequelize;

// Import models
db.users = require("../models/users")(sequelize, DataTypes);
db.family_members = require("../models/family_members")(sequelize, DataTypes);
db.reports_metadata = require("../models/reports_metadata")(sequelize, DataTypes);
db.report_instructions = require("../models/report_instructions")(sequelize, DataTypes);
db.employee_allergies = require("../models/employee_allergies")(sequelize, DataTypes);
db.employee_conditions = require("../models/employee_conditions")(sequelize, DataTypes);

// Sync Sequelize models
const syncModels = async () => {
    try {
        await sequelize.sync({ alter: false }); // Disable altering existing tables
        console.log("✅ Sequelize models synced with the database.");
    } catch (err) {
        console.error("❌ Error syncing Sequelize models:", err);
    }
};

Object.keys(db).forEach((modelName) => {
    if (db[modelName].associate) {
      db[modelName].associate(db);
    }
  });
  
// Export the Sequelize instance, models, and sync function
module.exports = { ...db, syncModels };