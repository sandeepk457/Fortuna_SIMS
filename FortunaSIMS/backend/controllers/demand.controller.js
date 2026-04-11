const db = require("../config/db");

const saveForecast = async (req, res) => {
  const client = await db.connect();

  try {
    const {
      item_id,
      warehouse_id,
      from_month,
      to_month,
      kpi,
      trend,
      sku,
    } = req.body;

    await client.query("BEGIN");

const kpiData = kpi || {};
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
    kpiData.demand || 0,
    kpiData.forecast || 0,
    kpiData.mape || 0,
    kpiData.risk || "Low",
  ]
);

    const forecast_id = result.rows[0].forecast_id;

    for (const t of trend) {
      await client.query(
        `INSERT INTO demand_forecast_trend
        (forecast_id, month, actual_demand, forecast_value)
        VALUES ($1,$2,$3,$4)`,
        [forecast_id, t.month, t.demand, t.forecast]
      );
    }

    for (const s of sku) {
      await client.query(
        `INSERT INTO demand_forecast_sku
        (forecast_id, item_id, demand, forecast, variance)
        VALUES ($1,$2,$3,$4,$5)`,
        [forecast_id, s.item_id, s.demand, s.forecast, s.variance]
      );
    }

    await client.query("COMMIT");

    res.json({ success: true, forecast_id });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error(err);
    res.status(500).json({ success: false, message: "Error saving forecast" });
  } finally {
    client.release();
  }
};

module.exports = {
  saveForecast,
};