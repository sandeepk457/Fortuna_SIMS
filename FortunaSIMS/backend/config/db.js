const { Pool } = require("pg");

const pool = new Pool({
  host: "localhost",
  port: 5432,
  user: "postgres",
  password: "Tanvitha@0506",
  database: "fortuna_sims_db"
});

module.exports = pool;