const pool = require("../config/db");

// CREATE
exports.createWarehouse = async (req, res) => {
  const client = await pool.connect();

  try {
    const {
      warehouse_code,
      warehouse_name,
      warehouse_type,
      city,
      state,
      status
    } = req.body;

    const result = await client.query(
      `INSERT INTO warehouses 
      (warehouse_code, warehouse_name, warehouse_type, city, state, status)
      VALUES ($1,$2,$3,$4,$5,$6)
      RETURNING *`,
      [warehouse_code, warehouse_name, warehouse_type, city, state, status]
    );

    res.status(201).json(result.rows[0]);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Create failed" });
  } finally {
    client.release();
  }
};


// GET ALL
exports.getWarehouses = async (req, res) => {
  try {
    const result = await pool.query(`SELECT * FROM warehouses ORDER BY created_at DESC`);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: "Fetch failed" });
  }
};

// 🔥 FULL CREATE (Stored Procedure)
exports.createFullWarehouse = async (req, res) => {
  try {
    const payload = req.body;

    await pool.query(
      `SELECT create_full_warehouse($1::jsonb)`,
      [payload]
    );

    res.status(201).json({
      success: true,
      message: "Warehouse created successfully (Full Setup)"
    });

  } catch (err) {
    console.error("SP Error:", err);

    res.status(500).json({
      success: false,
      error: err.message
    });
  }
};