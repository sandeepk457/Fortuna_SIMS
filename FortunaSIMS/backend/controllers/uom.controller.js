const pool = require("../config/db");

// CREATE
const createUom = async (req, res) => {
  try {
    const { code, name, category, status } = req.body;

    const result = await pool.query(
      `INSERT INTO uom_master (code, name, category, status)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [code.toUpperCase(), name, category, status]
    );

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET ALL
const getAllUoms = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM uom_master WHERE is_deleted = false ORDER BY id DESC`
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// UPDATE
const updateUom = async (req, res) => {
  try {
    const { id } = req.params;
    const { code, name, category, status } = req.body;

    const result = await pool.query(
      `UPDATE uom_master
       SET code=$1, name=$2, category=$3, status=$4, updated_at=NOW()
       WHERE id=$5 RETURNING *`,
      [code, name, category, status, id]
    );

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// DELETE
const deleteUom = async (req, res) => {
  try {
    const { id } = req.params;

    await pool.query(
      `UPDATE uom_master SET is_deleted = true WHERE id = $1`,
      [id]
    );

    res.json({ message: "Deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ✅ EXPORT (VERY IMPORTANT)
module.exports = {
  createUom,
  getAllUoms,
  updateUom,
  deleteUom,
};