const pool = require("../config/db");

const getEmployee = async (req, res) => {
  const { employeeId } = req.params;

  try {
    const [rows] = await pool.execute(
      `SELECT u.employee_id, u.name, u.email, u.phone, u.address, u.department, u.status, u.role,
              f.name AS family_member_name, f.relation, f.dependent_id, f.status AS family_status
       FROM users u
       LEFT JOIN family_members f ON u.employee_id = f.employee_id
       WHERE u.employee_id = ? OR f.dependent_id = ?`,
      [employeeId, employeeId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: "Employee or dependent not found" });
    }

    const isDependent = rows[0].dependent_id === employeeId;

    const profile = isDependent
      ? {
          dependentId: rows[0].dependent_id,
          name: rows[0].family_member_name,
          relation: rows[0].relation,
          status: rows[0].family_status,
          employeeId: rows[0].employee_id,
        }
      : {
          employeeId: rows[0].employee_id,
          name: rows[0].name,
          email: rows[0].email,
          phone: rows[0].phone,
          address: rows[0].address,
          department: rows[0].department,
          status: rows[0].status,
          role: rows[0].role,
          family: rows
            .filter((row) => row.family_member_name)
            .map((row) => ({
              name: row.family_member_name,
              relation: row.relation,
              dependentId: row.dependent_id,
              status: row.family_status,
            })),
        };

    res.json(profile);
  } catch (error) {
    console.error("Error fetching employee or dependent data:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const getAllEmployees = async (req, res) => {
  try {
    const [rows] = await pool.execute(
      `SELECT u.employee_id, u.name AS employee_name, u.department, u.status, u.role, u.email, u.phone, u.address,
              f.name AS family_member_name, f.relation, f.dependent_id, f.status AS family_status
       FROM users u
       LEFT JOIN family_members f ON u.employee_id = f.employee_id`
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: "No employees found" });
    }

    const employees = rows.reduce((acc, row) => {
      const employeeId = row.employee_id;

      if (!acc[employeeId]) {
        acc[employeeId] = {
          employeeId: row.employee_id,
          name: row.employee_name,
          department: row.department || "Unknown",
          status: row.status || "active",
          email: row.email || "Unknown",
          phone: row.phone || "Unknown",
          address: row.address || "Unknown",
          role: row.role,
          family: [],
        };
      }

      if (row.family_member_name) {
        acc[employeeId].family.push({
          name: row.family_member_name,
          relation: row.relation,
          dependentId: row.dependent_id,
          status: row.family_status || "inactive", // Use family_status here
        });
      }

      return acc;
    }, {});

    res.json(Object.values(employees));
  } catch (error) {
    console.error("Error fetching all employees:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const updateEmployee = async (req, res) => {
  const { employee_Id } = req.params;
  const { name, email, phone, address, department, status, role, family_members, refer_hospital } = req.body;

  if (!employee_Id) {
    return res.status(400).json({ error: "Employee ID is required" });
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    // Update user
    const [userResult] = await connection.execute(
      `UPDATE users
       SET name = ?, email = ?, phone = ?, address = ?, department = ?, status = ?, role = ?, refer_hospital = ?
       WHERE employee_id = ?`,
      [name, email, phone, address, department, status, role, refer_hospital ? 1 : 0, employee_Id]
    );

    if (userResult.affectedRows === 0) {
      await connection.rollback();
      return res.status(404).json({ error: "User not found" });
    }

    // Handle family members (if any)
    if (family_members && Array.isArray(family_members)) {
      // First get existing dependent IDs for this employee
      const [existingMembers] = await connection.execute(
        'SELECT dependent_id FROM family_members WHERE employee_id = ?',
        [employee_Id]
      );
      
      const existingDependentIds = existingMembers.map(m => m.dependent_id);
      const incomingDependentIds = family_members
        .filter(m => m.dependent_id)
        .map(m => m.dependent_id);

      // Delete members that are not in the new list
      const idsToDelete = existingDependentIds.filter(id => !incomingDependentIds.includes(id));
      
      if (idsToDelete.length > 0) {
        await connection.execute(
          'DELETE FROM family_members WHERE dependent_id IN (?)',
          [idsToDelete]
        );
      }

      // Process each family member
      for (const member of family_members) {
        if (!member.name || !member.relation) {
          throw new Error('Family member requires name and relation');
        }

        const status = member.status?.toUpperCase() || 'ACTIVE';
        
        if (member.dependent_id) {
          // Update existing member
          const [updateResult] = await connection.execute(
            `UPDATE family_members
             SET name = ?, relation = ?, status = ?
             WHERE dependent_id = ? AND employee_id = ?`,
            [member.name, member.relation, status, member.dependent_id, employee_Id]
          );
          
          if (updateResult.affectedRows === 0) {
            console.warn(`No rows updated for dependent_id: ${member.dependent_id}`);
          }
        } else {
          // Add new member
          const relationCodes = { 
            HUSBAND: 'HB', WIFE: 'WT', SON: 'SN', 
            DAUGHTER: 'DT', MOTHER: 'MT', FATHER: 'FT', OTHER: 'O' 
          };
          
          const relationCode = relationCodes[member.relation] || 'O';
          const dependent_id = await generateUniqueDependentId(connection, employee_Id, relationCode);

          await connection.execute(
            `INSERT INTO family_members 
             (employee_id, dependent_id, name, relation, status, created_at)
             VALUES (?, ?, ?, ?, ?, NOW())`,
            [employee_Id, dependent_id, member.name, member.relation, status]
          );
        }
      }
    }

    await connection.commit();
    res.json({
      success: true,
      message: "User and family members updated successfully",
      updatedFamilyMembers: family_members?.length || 0,
    });
  } catch (error) {
    await connection.rollback();
    console.error("Error in updateEmployee:", error);
    res.status(500).json({
      error: "Internal Server Error",
      details: error.message,
    });
  } finally {
    connection.release();
  }
};

const getFamilyMembers = async (req, res) => {
  try {
    const [rows] = await pool.execute(
      'SELECT * FROM family_members WHERE employee_id = ?',
      [req.params.employeeID]
    );
    res.json(rows);
  } catch (error) {
    console.error("Error fetching family members:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const addEmployee = async (req, res) => {
  const { employee_id, name, email, phone, address, department, role, status, family_members, refer_hospital } = req.body;

  if (!employee_id || !name) {
    return res.status(400).json({ error: "Employee ID and Name are required" });
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    await connection.execute(
      `INSERT INTO users 
       (employee_id, name, email, phone, address, department, role, status, password, created_at, refer_hospital)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), ?)`,
      [
        employee_id,
        name,
        email || null,
        phone || null,
        address || null,
        department || null,
        role?.toUpperCase() || "EMPLOYEE",
        status || "active",
        employee_id,
        refer_hospital ? 1 : 0, // Save as 1 (true) or 0 (false)
      ]
    );

    // Process family members (if any)
    if (family_members?.length > 0) {
      const relationCodes = { HUSBAND: "HB", WIFE: "WT", SON: "SN", DAUGHTER: "DT", MOTHER: "MT", FATHER: "FT", OTHER: "O" };

      for (const member of family_members) {
        if (!member.name || !member.relation) {
          await connection.rollback();
          return res.status(400).json({ error: "Family members require name and relationship" });
        }

        const relationCode = relationCodes[member.relation] || "O";
        const dependent_id = await generateUniqueDependentId(connection, employee_id, relationCode);

        await connection.execute(
          `INSERT INTO family_members 
           (employee_id, dependent_id, name, relation, status, created_at)
           VALUES (?, ?, ?, ?, ?, NOW())`,
          [
            employee_id,
            dependent_id,
            member.name,
            member.relation,
            member.status?.toUpperCase() || "ACTIVE",
          ]
        );
      }
    }

    await connection.commit();
    res.status(201).json({
      success: true,
      employee_id,
      family_members_added: family_members?.length || 0,
    });
  } catch (error) {
    await connection.rollback();
    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({
        error: error.message.includes("employee_id")
          ? "Employee ID already exists"
          : "Duplicate dependent ID - try again",
      });
    }
    res.status(500).json({ error: "Database error" });
  } finally {
    connection.release();
  }
};

const getAccess = async (req, res) => {
  try {
    const { employee_id, dependent_id } = req.query;
    
    if (!employee_id || !dependent_id) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }
    
    if (dependent_id === employee_id) {
      return res.json({ isFamilyMember: true });
    }
    
    // Use pool instead of db
    const [rows] = await pool.execute(
      `SELECT * FROM family_members 
       WHERE employee_id = ? AND dependent_id = ?`,
      [employee_id, dependent_id]
    );
    

    res.json({ 
      isFamilyMember: rows.length > 0,
      employeeId: employee_id,
      dependentId: dependent_id
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error checking family member access' });
  }
};

const generateUniqueDependentId = async (connection, employeeId, relationCode) => {
  const baseId = `${employeeId}${relationCode}`;
  const [existing] = await connection.execute(
    `SELECT dependent_id FROM family_members WHERE dependent_id LIKE ?`,
    [`${baseId}%`]
  );

  const existingIds = existing.map(row => row.dependent_id);
  if (!existingIds.includes(baseId)) return baseId;

  let maxIndex = 0;
  for (let id of existingIds) {
    const match = id.match(new RegExp(`^${baseId}(\\d+)?$`));
    if (match && match[1]) {
      maxIndex = Math.max(maxIndex, parseInt(match[1]));
    }
  }

  return `${baseId}${maxIndex + 1}`;
};


module.exports = { getEmployee, getAllEmployees, updateEmployee, addEmployee, getFamilyMembers, getAccess };
