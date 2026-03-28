const pool = require("../config/db");
const XLSX = require("xlsx");
const fs = require("fs");
const toNumberOrNull = (val) => {
  if (val === "" || val === undefined || val === null) return null;
  return Number(val);
};
  

// ===============================
// 🔥 GENERATE ITEM CODE (SEQUENCE BASED)
// ===============================
const generateItemCode = async (client) => {
  const res = await client.query(`
    SELECT 'ITM-' || LPAD(nextval('item_code_seq')::TEXT, 4, '0') AS code
  `);
  return res.rows[0].code;
};


// ===============================
// 📥 BULK UPLOAD ITEMS (EXCEL)
// ===============================

exports.bulkUploadItems = async (req, res) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const workbook = XLSX.readFile(req.file.path);
    const sheetName = workbook.SheetNames[0];
    const data = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);

    let insertedCount = 0;
    let skippedRows = [];

        // ===============================
        // 🔹 BASIC INFO
        // ===============================
        // ===============================

//  FLEXIBLE HEADER MAPPING
// ===============================

// helper function (case-insensitive + space/underscore handling)
const getValue = (row, keys) => {
  for (let key of keys) {
    if (row[key] !== undefined) return row[key];
  }

  // fallback: normalize keys
  const normalizedRow = {};
  Object.keys(row).forEach(k => {
    normalizedRow[k.toLowerCase().replace(/\s+/g, "_")] = row[k];
  });

  for (let key of keys) {
    const normalizedKey = key.toLowerCase().replace(/\s+/g, "_");
    if (normalizedRow[normalizedKey] !== undefined) {
      return normalizedRow[normalizedKey];
    }
  }

  return null;
};


for (const row of data) {
      try {
        const item_code = await generateItemCode(client);
// ===============================
// 🔹 BASIC INFO (FLEXIBLE)
// ===============================

const itemName = getValue(row, ["item_name", "Item Name"]);
const shortName = getValue(row, ["short_name", "Short Name"]);
const itemType = getValue(row, ["item_type", "Item Type"]);
const category = getValue(row, ["category", "Category"]);
const subCategory = getValue(row, ["sub_category", "Sub Category"]);
const brand = getValue(row, ["brand", "Brand"]);
const uom = getValue(row, ["uom", "UOM"]);
const altUom = getValue(row, ["alt_uom", "Alt UOM"]);
const conversionFactor = getValue(row, ["conversion_factor", "Conversion Factor"]);
const barcode = getValue(row, ["barcode", "Barcode"]);
const hsnSac = getValue(row, ["hsn_sac", "HSN/SAC"]);
const description = getValue(row, ["description", "Description"]);

const status = getValue(row, ["status", "Status"]) || "Active";

// ===============================
// ❗ VALIDATION
// ===============================
if (!itemName || !uom || !itemType) {
  skippedRows.push({ row, reason: "Missing required fields" });
  continue;
}

// ===============================
// 1️⃣ ITEMS
// ===============================
const itemResult = await client.query(
  `INSERT INTO items (
    item_code, item_name, short_name, item_type,
    category, sub_category, brand,
    uom, alt_uom, conversion_factor,
    barcode, hsn_sac, description,
    status
  )
  VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
  RETURNING id`,
  [
    item_code,
    itemName,
    shortName,
    itemType,
    category,
    subCategory,
    brand,
    uom,
    altUom,
    conversionFactor,
    barcode,
    hsnSac,
    description,
    status
  ]
);

const itemId = itemResult.rows[0].id;

        // ===============================
        // 2️⃣ INVENTORY
        // ===============================
        await client.query(
          `INSERT INTO item_inventory (
            item_id, inventory_controlled, batch_controlled,
            serial_controlled, expiry_controlled,
            min_stock_level, max_stock_level, reorder_qty
          )
          VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
          [
            itemId,
            row.inventory_controlled === "true",
            row.batch_controlled === "true",
            row.serial_controlled === "true",
            row.expiry_controlled === "true",
            toNumberOrNull(row.min_stock_level),
            toNumberOrNull(row.max_stock_level),
            toNumberOrNull(row.reorder_qty)
          ]
        );

        // ===============================
        // 3️⃣ STORAGE
        // ===============================
        await client.query(
          `INSERT INTO item_storage (
            item_id, storage_type, hazardous, fragile, stackable,
            default_warehouse, default_zone, default_bin
          )
          VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
          [
            itemId,
            row.storage_type,
            row.hazardous === "true",
            row.fragile === "true",
            row.stackable === "true",
            row.default_warehouse,
            row.default_zone,
            row.default_bin
          ]
        );

        // ===============================
        // 4️⃣ VALUATION
        // ===============================
        await client.query(
          `INSERT INTO item_valuation (
            item_id, valuation_method, standard_cost, inventory_gl_code
          )
          VALUES ($1,$2,$3,$4)`,
          [
            itemId,
            row.valuation_method || "FIFO",
            toNumberOrNull(row.standard_cost),
            row.inventory_gl_code
          ]
        );

        insertedCount++;

      } catch (rowError) {
        console.error("Row Error:", row, rowError);
        skippedRows.push({ row, reason: "Insert failed" });
      }
    }

    await client.query("COMMIT");
    // ===============================
// 🔥 STEP-2: CREATE ERROR EXCEL (CORRECT PLACE)
// ===============================
let errorFilePath = null;

if (skippedRows.length > 0) {
  const errorData = skippedRows.map((item) => ({
    ...item.row,
    error_reason: item.reason
  }));

  const worksheet = XLSX.utils.json_to_sheet(errorData);
  const workbook = XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(workbook, worksheet, "Errors");

  errorFilePath = `uploads/error_${Date.now()}.xlsx`;

  XLSX.writeFile(workbook, errorFilePath);
}
    res.json({
      message: "Bulk upload completed",
      totalInserted: insertedCount,
      skipped: skippedRows.length,
      skippedRows // 🔥 useful for debugging
    });

  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Bulk Upload Error:", err);

    res.status(500).json({
      error: "Bulk upload failed"
    });
  } finally {
    if (req.file) fs.unlinkSync(req.file.path);
    client.release();
  }
};

// ===============================
// ✅ CREATE ITEM (FULL FLOW - FINAL)
// ===============================
exports.createItem = async (req, res) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // ===============================
    // 🔥 EXTRACT BODY
    // ===============================
    const {
      itemName,
      shortName,
      itemType,
      category,
      subCategory,
      brand,
      uom,
      altUom,
      conversionFactor,
      barcode,
      hsnSac,
      description,

      inventory_controlled,
      batch_controlled,
      serial_controlled,
      expiry_controlled,
      min_stock_level,
      max_stock_level,
      reorder_qty,

      storage_type,
      hazardous,
      fragile,
      stackable,
      default_warehouse,
      default_zone,
      default_bin,

      valuation_method,
      standard_cost,
      inventory_gl_code,

      status,
      created_by
    } = req.body;

    // ===============================
    // 🔥 ERP VALIDATIONS
    // ===============================
    if (!itemName || !itemName.trim()) {
      throw new Error("Item Name is required");
    }

    if (!uom || !uom.trim()) {
      throw new Error("UOM is required");
    }

    // Unique Item Name Check
    const existing = await client.query(
      `SELECT 1 FROM items WHERE LOWER(item_name) = LOWER($1)`,
      [itemName]
    );

    if (existing.rows.length > 0) {
      throw new Error("Item already exists");
    }

    // Conversion factor validation
    if (conversionFactor && Number(conversionFactor) <= 0) {
      throw new Error("Conversion Factor must be > 0");
    }

    // ===============================
    // 🔥 GENERATE ITEM CODE
    // ===============================
    const item_code = await generateItemCode(client);

    // ===============================
    // 1️⃣ ITEMS TABLE
    // ===============================
    const itemResult = await client.query(
      `INSERT INTO items (
        item_code, item_name, short_name, item_type,
        category, sub_category, brand,
        uom, alt_uom, conversion_factor,
        barcode, hsn_sac, description,
        status, created_by
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)
      RETURNING id`,
      [
        item_code,
        itemName,
        shortName,
        itemType,
        category,
        subCategory,
        brand,
        uom,
        altUom,
        toNumberOrNull(conversionFactor),
        barcode,
        hsnSac,
        description,
        status || "Active",
        created_by || "System"
      ]
    );

    const itemId = itemResult.rows[0].id;

    // ===============================
    // 2️⃣ INVENTORY TABLE
    // ===============================
    await client.query(
      `INSERT INTO item_inventory (
        item_id, inventory_controlled, batch_controlled,
        serial_controlled, expiry_controlled,
        min_stock_level, max_stock_level, reorder_qty
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
      [
        itemId,
        inventory_controlled || false,
        batch_controlled || false,
        serial_controlled || false,
        expiry_controlled || false,
        toNumberOrNull(min_stock_level),
        toNumberOrNull(max_stock_level),
        toNumberOrNull(reorder_qty),
      ]
    );

    // ===============================
    // 3️⃣ STORAGE TABLE
    // ===============================
    await client.query(
      `INSERT INTO item_storage (
        item_id, storage_type, hazardous, fragile, stackable,
        default_warehouse, default_zone, default_bin
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
      [
        itemId,
        storage_type || null,
        hazardous || false,
        fragile || false,
        stackable || false,
        default_warehouse || null,
        default_zone || null,
        default_bin || null
      ]
    );

    // ===============================
    // 4️⃣ VALUATION TABLE
    // ===============================
    await client.query(
      `INSERT INTO item_valuation (
        item_id, valuation_method, standard_cost, inventory_gl_code
      )
      VALUES ($1,$2,$3,$4)`,
      [
        itemId,
        valuation_method || "FIFO",
        toNumberOrNull(standard_cost),
        inventory_gl_code || null
      ]
    );

    // ===============================
    // 🔥 COMMIT
    // ===============================
    await client.query("COMMIT");

    res.status(201).json({
      message: "Item created successfully",
      item_id: itemId,
      item_code
    });

  } catch (err) {
    await client.query("ROLLBACK");

    console.error("Create Item Error:", err);

    res.status(500).json({
      error: err.message || "Failed to create item"
    });

  } finally {
    client.release();
  }
};


// ===============================
// 📥 GET ALL ITEMS
// ===============================
exports.getItems = async (req, res) => {
  try {

    res.set("Cache-Control", "no-store");
    const result = await pool.query(`
      SELECT 
        id,
        item_code AS code,
        item_name AS name,
        category,
        uom,
        status
      FROM items
      ORDER BY created_at DESC
    `);

    res.json(result.rows);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error fetching items" });
  }
};



// ===============================
// 🔍 GET ITEM BY ID
// ===============================
exports.getItemById = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(`
      SELECT 
        i.*,
        inv.*,
        st.*,
        val.*
      FROM items i
      LEFT JOIN item_inventory inv ON i.id = inv.item_id
      LEFT JOIN item_storage st ON i.id = st.item_id
      LEFT JOIN item_valuation val ON i.id = val.item_id
      WHERE i.id = $1
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Item not found" });
    }

    res.json(result.rows[0]);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error fetching item" });
  }
};



// ===============================
// ✏️ UPDATE ITEM
// ===============================
exports.updateItem = async (req, res) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const { id } = req.params;

    const {
      itemName,
      shortName,
      itemType,
      category,
      subCategory,
      brand,
      uom,
      altUom,
      conversionFactor,
      barcode,
      hsnSac,
      description,

      inventory_controlled,
      batch_controlled,
      serial_controlled,
      expiry_controlled,
      min_stock_level,
      max_stock_level,
      reorder_qty,

      storage_type,
      hazardous,
      fragile,
      stackable,
      default_warehouse,
      default_zone,
      default_bin,

      valuation_method,
      standard_cost,
      inventory_gl_code,

      status
    } = req.body;

    // ITEMS
    await client.query(
      `UPDATE items SET
        item_name=$1,
        short_name=$2,
        item_type=$3,
        category=$4,
        sub_category=$5,
        brand=$6,
        uom=$7,
        alt_uom=$8,
        conversion_factor=$9,
        barcode=$10,
        hsn_sac=$11,
        description=$12,
        status=$13,
        updated_at=NOW()
      WHERE id=$14`,
      [
        itemName,
        shortName,
        itemType,
        category,
        subCategory,
        brand,
        uom,
        altUom,
        toNumberOrNull(conversionFactor),
        barcode,
        hsnSac,
        description,
        status,
        id
      ]
    );

    // INVENTORY
    await client.query(
      `UPDATE item_inventory SET
        inventory_controlled=$1,
        batch_controlled=$2,
        serial_controlled=$3,
        expiry_controlled=$4,
        min_stock_level=$5,
        max_stock_level=$6,
        reorder_qty=$7
      WHERE item_id=$8`,
      [
        inventory_controlled,
        batch_controlled,
        serial_controlled,
        expiry_controlled,
        toNumberOrNull(min_stock_level),
        toNumberOrNull(max_stock_level),
        toNumberOrNull(reorder_qty),
        id
      ]
    );

    // STORAGE
    await client.query(
      `UPDATE item_storage SET
        storage_type=$1,
        hazardous=$2,
        fragile=$3,
        stackable=$4,
        default_warehouse=$5,
        default_zone=$6,
        default_bin=$7
      WHERE item_id=$8`,
      [
        storage_type,
        hazardous,
        fragile,
        stackable,
        default_warehouse,
        default_zone,
        default_bin,
        id
      ]
    );

    // VALUATION
    await client.query(
      `UPDATE item_valuation SET
        valuation_method=$1,
        standard_cost=$2,
        inventory_gl_code=$3
      WHERE item_id=$4`,
      [
        valuation_method,
        toNumberOrNull(standard_cost),
        inventory_gl_code,
        id
      ]
    );

    await client.query("COMMIT");

    res.json({ message: "Item updated successfully" });

  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Update Error:", err);
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
};

// ===============================
// ❌ SOFT DELETE
// ===============================
exports.deleteItem = async (req, res) => {
  try {
    const { id } = req.params;

    await pool.query(
      `UPDATE items 
       SET status = 'Inactive', updated_at = NOW()
       WHERE id = $1`,
      [id]
    );

    res.json({ message: "Item soft deleted successfully" });

  } catch (err) {
    console.error("Delete Error:", err);
    res.status(500).json({ error: "Delete failed" });
  }
};