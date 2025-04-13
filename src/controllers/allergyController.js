const db = require("../config/sequelize");

const addAllergy = async (req, res) => {
    const { employeeId, allergy_name } = req.body;
    const created_by = req.user.employeeId;

    try {
        const allergy = await db.employee_allergies.create({
            employee_id: employeeId,
            allergy_name,
            created_by,
        });
        res.status(201).json(allergy);
    } catch (error) {
        console.error("Error adding allergy:", error);
        res.status(500).json({ message: "Failed to add allergy." });
    }
};

const getAllergies = async (req, res) => {
    const { employeeId } = req.params;

    try {
        const allergies = await db.employee_allergies.findAll({
            where: { employee_id: employeeId },
        });
        res.status(200).json(allergies);
    } catch (error) {
        console.error("Error fetching allergies:", error);
        res.status(500).json({ message: "Failed to fetch allergies." });
    }
};

const updateAllergy = async (req, res) => {
    const { id } = req.params;
    const { allergy_name } = req.body;
    const updated_by = req.user.employeeId;

    try {
        const allergy = await db.employee_allergies.findByPk(id);
        if (!allergy) {
            return res.status(404).json({ message: "Allergy not found." });
        }

        await allergy.update({ allergy_name, updated_by });
        res.status(200).json(allergy);
    } catch (error) {
        console.error("Error updating allergy:", error);
        res.status(500).json({ message: "Failed to update allergy." });
    }
};

const getLatestAllergy = async (req, res) => {
    const { employeeId } = req.params;

    try {
        const latestAllergy = await db.employee_allergies.findOne({
            where: { employee_id: employeeId },
            order: [["updated_at", "DESC"]],
        });
        res.status(200).json(latestAllergy || {});
    } catch (error) {
        console.error("Error fetching latest allergy:", error);
        res.status(500).json({ message: "Failed to fetch latest allergy." });
    }
};

module.exports = { addAllergy, getAllergies, updateAllergy, getLatestAllergy };