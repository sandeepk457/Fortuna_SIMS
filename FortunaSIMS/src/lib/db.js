import pkg from "pg";

const { Pool } = pkg;

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
      password: "Tanvitha@0506",
      database: "fortuna_sims_db",
    });

export { pool };