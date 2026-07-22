import pkg from "pg";

const { Pool } = pkg;

console.log("DATABASE_URL exists:", !!process.env.DATABASE_URL);
console.log("DATABASE_URL length:", process.env.DATABASE_URL?.length);

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