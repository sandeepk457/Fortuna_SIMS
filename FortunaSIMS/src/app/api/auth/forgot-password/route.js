import { Pool } from "pg";
import crypto from "crypto";

const pool = new Pool({
  host: "localhost",
  port: 5432,
  user: "postgres",
  password: "Tanvitha@0506",
  database: "fortuna_sims_db",
});

export async function POST(req) {
  try {

    const { email } = await req.json();

    const client = await pool.connect();

    const result = await client.query(
      "SELECT user_id FROM users WHERE email=$1",
      [email]
    );

    if (result.rowCount === 0) {
      console.log("User not found");
      return Response.json({ ok:false });
    }

    const token = crypto.randomBytes(32).toString("hex");

    const resetLink =
      `http://localhost:3000/reset-password?token=${token}`;

    console.log("================================");
    console.log("RESET PASSWORD LINK:");
    console.log(resetLink);
    console.log("================================");

    client.release();

    return Response.json({ ok:true });

  } catch (error) {

    console.error(error);
    return Response.json({ ok:false });

  }
}