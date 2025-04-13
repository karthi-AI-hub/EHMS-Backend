const db = require("../config/sequelize");

const addInstruction = async (req, res) => {
  const { reportId, instruction } = req.body;
  const created_by = req.user.employeeId;

  try {

    if(!reportId || !instruction || !created_by) {
      return res.status(400).json({ message: "Missing Required fields." });
    }
    const newInstruction = await db.report_instructions.create({
      report_id: reportId,
      instruction,
      created_by,
    });
    res.status(201).json(newInstruction);
  } catch (error) {
    console.error("Error adding instruction:", error);
    res.status(500).json({ message: "Failed to add instruction." });
  }
};

const getInstructions = async (req, res) => {
  const { reportId } = req.params;

  try {
    const instructions = await db.report_instructions.findAll({
      where: { report_id: reportId },
      include: [
        {
          model: db.users,
          as: "creator", 
          attributes: ["employee_id", "name"],
        },
      ],
    });
    res.status(200).json(instructions);
  } catch (error) {
    console.error("Error fetching instructions:", error);
    res.status(500).json({ message: "Failed to fetch instructions." });
  }
};

const getLatestInstructions = async (req, res) => {
  const { employeeId } = req.params;

  try {
    const latestInstructions = await db.sequelize.query(
      `
      SELECT ri.*
      FROM report_instructions ri
      INNER JOIN (
        SELECT report_id, MAX(created_at) AS latest_created_at
        FROM report_instructions
        GROUP BY report_id
      ) latest
      ON ri.report_id = latest.report_id AND ri.created_at = latest.latest_created_at
      WHERE ri.report_id IN (
        SELECT id FROM reports_metadata WHERE employee_id = :employeeId
      )
      `,
      {
        replacements: { employeeId },
        type: db.sequelize.QueryTypes.SELECT,
      }
    );

    res.status(200).json(latestInstructions);
  } catch (error) {
    console.error("Error fetching latest instructions:", error);
    res.status(500).json({ message: "Failed to fetch latest instructions." });
  }
};

module.exports = { addInstruction, getInstructions, getLatestInstructions };