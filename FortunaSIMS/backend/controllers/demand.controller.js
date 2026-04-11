const db = require("../config/db");

const saveForecast = async (req, res) => {
  const client = await db.connect();

  try {
    const records = Array.isArray(req.body) ? req.body : [req.body];

    await client.query("BEGIN");

    for (const record of records) {
      const {
        item_id,
        warehouse_id,
        from_month,
        to_month,
        demand,
        forecast,
        stock,
        reorder,
        mape,
        risk,
        trend = [],
        sku = [],
        actions = [],
      } = record;

      // MAIN INSERT
      const result = await client.query(
        `INSERT INTO demand_forecast
        (item_id, warehouse_id, from_month, to_month, total_demand, total_forecast, mape, risk_level)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
        RETURNING forecast_id`,
        [
          item_id,
          warehouse_id,
          from_month,
          to_month,
          demand || 0,
          forecast || 0,
          mape || 0,
          risk || "Low",
        ]
      );

      const forecast_id = result.rows[0].forecast_id;

      // TREND
      for (const t of trend) {
        await client.query(
          `INSERT INTO demand_forecast_trend
          (forecast_id, month, actual_demand, forecast_value)
          VALUES ($1,$2,$3,$4)`,
          [forecast_id, t.month, t.demand || 0, t.forecast || 0]
        );
      }

      // SKU
      for (const s of sku) {
        await client.query(
          `INSERT INTO demand_forecast_sku
          (forecast_id, item_id, demand, forecast, variance)
          VALUES ($1,$2,$3,$4,$5)`,
          [
            forecast_id,
            s.item_id,
            s.demand || 0,
            s.forecast || 0,
            s.variance || 0,
          ]
        );
      }

      // ACTIONS
      for (const a of actions) {
        await client.query(
          `INSERT INTO demand_actions
          (forecast_id, action_type, message, priority, is_resolved)
          VALUES ($1,$2,$3,$4,$5)`,
          [
            forecast_id,
            "AI",
            typeof a === "string" ? a : a.action,
            "MEDIUM",
            false,
          ]
        );
      }
    }

    await client.query("COMMIT");

    res.json({ success: true });

  } catch (err) {   // ✅ THIS MUST MATCH try
    await client.query("ROLLBACK");
    console.error("❌ BACKEND ERROR:", err);
    res.status(500).json({ success: false, message: err.message });
  } finally {
    client.release();
  }
};

module.exports = {
  saveForecast,
};