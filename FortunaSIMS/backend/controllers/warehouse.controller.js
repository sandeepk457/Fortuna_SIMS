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


// ======================================================
// WAREHOUSE DASHBOARD ANALYTICS
// ======================================================

exports.getWarehouseDashboard = async (req, res) => {

  try {

    const { code } = req.params;

    // =====================================================
    // Warehouse
    // =====================================================

    const warehouseResult = await pool.query(
      `
      SELECT *
      FROM warehouses
      WHERE warehouse_code=$1
      `,
      [code]
    );

    if (warehouseResult.rows.length === 0) {

      return res.status(404).json({
        success:false,
        message:"Warehouse not found"
      });

    }

    const warehouse = warehouseResult.rows[0];

    const warehouseId = warehouse.warehouse_id;

    // =====================================================
    // Statistics
    // =====================================================

    const zoneCount = await pool.query(
      `
      SELECT COUNT(*)::int count
      FROM warehouse_zones
      WHERE warehouse_id=$1
      `,
      [warehouseId]
    );

    const aisleCount = await pool.query(
      `
      SELECT COUNT(*)::int count
      FROM warehouse_aisles
      WHERE zone_id IN
      (
        SELECT zone_id
        FROM warehouse_zones
        WHERE warehouse_id=$1
      )
      `,
      [warehouseId]
    );

    const rackCount = await pool.query(
      `
      SELECT COUNT(*)::int count
      FROM warehouse_racks
      WHERE aisle_id IN
      (
        SELECT aisle_id
        FROM warehouse_aisles
        WHERE zone_id IN
        (
          SELECT zone_id
          FROM warehouse_zones
          WHERE warehouse_id=$1
        )
      )
      `,
      [warehouseId]
    );

    const binCount = await pool.query(
      `
      SELECT COUNT(*)::int count
      FROM warehouse_bins
      WHERE rack_id IN
      (
        SELECT rack_id
        FROM warehouse_racks
        WHERE aisle_id IN
        (
          SELECT aisle_id
          FROM warehouse_aisles
          WHERE zone_id IN
          (
            SELECT zone_id
            FROM warehouse_zones
            WHERE warehouse_id=$1
          )
        )
      )
      `,
      [warehouseId]
    );

    // =====================================================
    // Zone Analytics
    // =====================================================

    const zoneResult = await pool.query(

      `
      SELECT

      z.zone_id,
      z.zone_name,
      z.zone_type,

      COUNT(DISTINCT a.aisle_id)::int AS aisles,

      COUNT(DISTINCT r.rack_id)::int AS racks,

      COUNT(DISTINCT b.bin_id)::int AS bins

      FROM warehouse_zones z

      LEFT JOIN warehouse_aisles a
      ON a.zone_id=z.zone_id

      LEFT JOIN warehouse_racks r
      ON r.aisle_id=a.aisle_id

      LEFT JOIN warehouse_bins b
      ON b.rack_id=r.rack_id

      WHERE z.warehouse_id=$1

      GROUP BY
      z.zone_id,
      z.zone_name,
      z.zone_type

      ORDER BY z.zone_name

      `,
      [warehouseId]

    );


    // =====================================================
// Capacity Metrics
// =====================================================

// Currently inventory is not mapped to bins,
// so assume all bins are available.

const totalBins = binCount.rows[0].count;

const occupiedBins = 0;

const availableBins = totalBins - occupiedBins;

const occupancyPercentage =
  totalBins > 0
    ? Number(((occupiedBins / totalBins) * 100).toFixed(2))
    : 0;

const rackUtilization =
  rackCount.rows[0].count > 0
    ? Number(
        (
          (occupiedBins / rackCount.rows[0].count) *
          100
        ).toFixed(2)
      )
    : 0;

const capacity = {
  totalBins,
  availableBins,
  occupiedBins,
  occupancyPercentage,
  rackUtilization,
};





    // =====================================================
    // Final Response
    // =====================================================

    res.json({

      success: true,

      warehouse,

      statistics: {

        zones: zoneCount.rows[0].count,

        aisles: aisleCount.rows[0].count,

        racks: rackCount.rows[0].count,

        bins: binCount.rows[0].count

      },

      capacity,

      zones: zoneResult.rows

    });

  } catch (err) {

    console.error(err);

    res.status(500).json({

      success: false,

      message: "Dashboard API Failed",

      error: err.message

    });

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


// get warehouse by code (for edit form) //
exports.getFullWarehouseByCode = async (req, res) => {
  try {
    const { code } = req.params;

    const warehouseRes = await pool.query(
      `SELECT * FROM warehouses WHERE warehouse_code = $1`,
      [code]
    );

    if (warehouseRes.rows.length === 0) {
      return res.status(404).json({ error: "Not found" });
    }

    const warehouse = warehouseRes.rows[0];

    const settingsRes = await pool.query(
      `SELECT * FROM warehouse_settings WHERE warehouse_id = $1`,
      [warehouse.warehouse_id]
    );

    const zonesRes = await pool.query(
      `SELECT * FROM warehouse_zones WHERE warehouse_id = $1`,
      [warehouse.warehouse_id]
    );

    const aislesRes = await pool.query(
      `SELECT * FROM warehouse_aisles WHERE zone_id IN 
        (SELECT zone_id FROM warehouse_zones WHERE warehouse_id = $1)`,
      [warehouse.warehouse_id]
    );

    const racksRes = await pool.query(
      `SELECT * FROM warehouse_racks WHERE aisle_id IN 
        (SELECT aisle_id FROM warehouse_aisles WHERE zone_id IN 
          (SELECT zone_id FROM warehouse_zones WHERE warehouse_id = $1))`,
      [warehouse.warehouse_id]
    );

    const binsRes = await pool.query(
      `SELECT * FROM warehouse_bins WHERE rack_id IN 
        (SELECT rack_id FROM warehouse_racks WHERE aisle_id IN 
          (SELECT aisle_id FROM warehouse_aisles WHERE zone_id IN 
            (SELECT zone_id FROM warehouse_zones WHERE warehouse_id = $1)))`,
      [warehouse.warehouse_id]
    );

    res.json({
      warehouse,
      settings: settingsRes.rows[0],
      zones: zonesRes.rows,
      aisles: aislesRes.rows,
      racks: racksRes.rows,
      bins: binsRes.rows
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Full fetch failed" });
  }
};

//update warehouse by code (for edit form) //
exports.updateFullWarehouse = async (req, res) => {
  const client = await pool.connect();

  try {
    const { code } = req.params;
    const data = req.body;

    await client.query("BEGIN");

    // 🟦 1. UPDATE WAREHOUSE
    const warehouseRes = await client.query(
      `UPDATE warehouses SET
        warehouse_name = $1,
        warehouse_type = $2,
        address_line1 = $3,
        city = $4,
        state = $5,
        pincode = $6,
        status = $7,
        updated_at = NOW()
      WHERE warehouse_code = $8
      RETURNING warehouse_id`,
      [
        data.warehouse.warehouse_name,
        data.warehouse.warehouse_type,
        data.warehouse.address_line1,
        data.warehouse.city,
        data.warehouse.state,
        data.warehouse.pincode,
        data.warehouse.status,
        code
      ]
    );

    const warehouseId = warehouseRes.rows[0]?.warehouse_id;

    if (!warehouseId) {
      throw new Error("Warehouse not found");
    }

    // 🟩 2. UPDATE SETTINGS
    await client.query(
      `UPDATE warehouse_settings SET
        allow_negative_stock = $1,
        enable_bin_tracking = $2,
        storage_type = $3,
        hazardous_allowed = $4,
        costing_method = $5
      WHERE warehouse_id = $6`,
      [
        data.settings.allow_negative_stock,
        data.settings.enable_bin_tracking,
        data.settings.storage_type,
        data.settings.hazardous_allowed,
        data.settings.costing_method,
        warehouseId
      ]
    );

    // 🟥 3. DELETE OLD LAYOUT (IMPORTANT 🔥)

    await client.query(`
      DELETE FROM warehouse_bins WHERE rack_id IN (
        SELECT rack_id FROM warehouse_racks WHERE aisle_id IN (
          SELECT aisle_id FROM warehouse_aisles WHERE zone_id IN (
            SELECT zone_id FROM warehouse_zones WHERE warehouse_id = $1
          )
        )
      )
    `, [warehouseId]);

    await client.query(`
      DELETE FROM warehouse_racks WHERE aisle_id IN (
        SELECT aisle_id FROM warehouse_aisles WHERE zone_id IN (
          SELECT zone_id FROM warehouse_zones WHERE warehouse_id = $1
        )
      )
    `, [warehouseId]);

    await client.query(`
      DELETE FROM warehouse_aisles WHERE zone_id IN (
        SELECT zone_id FROM warehouse_zones WHERE warehouse_id = $1
      )
    `, [warehouseId]);

    await client.query(`
      DELETE FROM warehouse_zones WHERE warehouse_id = $1
    `, [warehouseId]);

    // 🟨 4. RE-INSERT LAYOUT (LIKE SP)

    for (const zone of data.layout) {
      const zoneRes = await client.query(
        `INSERT INTO warehouse_zones (warehouse_id, zone_name, zone_type)
         VALUES ($1, $2, $3)
         RETURNING zone_id`,
        [warehouseId, zone.zone_name, zone.zone_type]
      );

      const zoneId = zoneRes.rows[0].zone_id;

      for (const aisle of zone.aisles) {
        const aisleRes = await client.query(
          `INSERT INTO warehouse_aisles (zone_id, aisle_name)
           VALUES ($1, $2)
           RETURNING aisle_id`,
          [zoneId, aisle.aisle_name]
        );

        const aisleId = aisleRes.rows[0].aisle_id;

        for (const rack of aisle.racks) {
          const rackRes = await client.query(
            `INSERT INTO warehouse_racks (
              aisle_id, rack_name, levels, bins_per_level
            )
            VALUES ($1, $2, $3, $4)
            RETURNING rack_id`,
            [aisleId, rack.rack_name, rack.levels, rack.bins_per_level]
          );

          const rackId = rackRes.rows[0].rack_id;

          // 🔥 BINS GENERATION
          for (let lvl = 1; lvl <= rack.levels; lvl++) {
            for (let pos = 1; pos <= rack.bins_per_level; pos++) {

              const binCode =
                `${data.warehouse.warehouse_code}-${zone.zone_name}-${aisle.aisle_name}-${rack.rack_name}-L${String(lvl).padStart(2, "0")}-B${String(pos).padStart(2, "0")}`;

              await client.query(
                `INSERT INTO warehouse_bins (
                  rack_id, bin_code, level, position, status
                )
                VALUES ($1, $2, $3, $4, 'Available')`,
                [rackId, binCode, lvl, pos]
              );
            }
          }
        }
      }
    }

    await client.query("COMMIT");

    res.json({
      success: true,
      message: "Full Warehouse Updated Successfully 🔥"
    });

  } catch (err) {
    await client.query("ROLLBACK");
    console.error(err);

    res.status(500).json({
      error: "Update failed",
      details: err.message
    });
  } finally {
    client.release();
  }
  
};