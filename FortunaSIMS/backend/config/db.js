require("dotenv").config();

console.log("=== DATABASE CONFIG ===");
console.log(
  "Environment:",
  process.env.NODE_ENV || "development"
);
console.log(
  "DATABASE_URL:",
  process.env.DATABASE_URL
    ? "FOUND → CLOUD DB"
    : "NOT FOUND → LOCAL DB"
);
console.log("=======================");

const { Pool } = require("pg");

const pool = process.env.DATABASE_URL
  ? new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: {
        rejectUnauthorized: false,
      },
    })
  : new Pool({
      host: "localhost",
      port: 5432,
      user: "postgres",
      password: process.env.DB_PASSWORD,
      database: "fortuna_sims_db",
    });

pool.on("error", (err) => {
  console.error("Unexpected PostgreSQL pool error:", err);
});

module.exports = pool;