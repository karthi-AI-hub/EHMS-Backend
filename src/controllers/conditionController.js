const db = require("../config/sequelize");

const addCondition = async (req, res) => {
    const { employeeId, condition_name } = req.body;
    const created_by = req.user.employeeId;

    try {
        const condition = await db.employee_conditions.create({
            employee_id: employeeId,
            condition_name,
            created_by,
        });
        res.status(201).json(condition);
    } catch (error) {
        console.error("Error adding condition:", error);
        res.status(500).json({ message: "Failed to add condition." });
    }
};

const getConditions = async (req, res) => {
    const { employeeId } = req.params;

    try {
        const conditions = await db.employee_conditions.findAll({
            where: { employee_id: employeeId },
        });
        res.status(200).json(conditions);
    } catch (error) {
        console.error("Error fetching conditions:", error);
        res.status(500).json({ message: "Failed to fetch conditions." });
    }
};

const updateCondition = async (req, res) => {
    const { id } = req.params;
    const { condition_name } = req.body;
    const updated_by = req.user.employeeId;

    try {
        const condition = await db.employee_conditions.findByPk(id);
        if (!condition) {
            return res.status(404).json({ message: "Condition not found." });
        }

        await condition.update({ condition_name, updated_by });
        res.status(200).json(condition);
    } catch (error) {
        console.error("Error updating condition:", error);
        res.status(500).json({ message: "Failed to update condition." });
    }
};

const getLatestCondition = async (req, res) => {
    const { employeeId } = req.params;

    try {
        const latestCondition = await db.employee_conditions.findOne({
            where: { employee_id: employeeId },
            order: [["updated_at", "DESC"]],
        });
        res.status(200).json(latestCondition || {});
    } catch (error) {
        console.error("Error fetching latest condition:", error);
        res.status(500).json({ message: "Failed to fetch latest condition." });
    }
};

module.exports = { addCondition, getConditions, updateCondition, getLatestCondition };