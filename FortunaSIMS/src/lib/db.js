import pkg from "pg";

const { Pool } = pkg;

const pool = new Pool({
  host: "localhost",
  port: 5432,
  user: "postgres",
  password: "Tanvitha@0506",
  database: "fortuna_sims_db",
});

export default pool;