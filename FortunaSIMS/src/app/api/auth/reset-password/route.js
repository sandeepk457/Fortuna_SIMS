import crypto from "crypto";
import { Pool } from "pg";

const pool = new Pool({
  host: "localhost",
  port: 5432,
  user: "postgres",
  password: "Tanvitha@0506",
  database: "fortuna_sims_db",
});

export async function POST(req) {

  const { token, password } = await req.json();

  const client = await pool.connect();

  try {

    const tokenHash = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");

    const tokenRes = await client.query(
      `SELECT * FROM password_reset_tokens
       WHERE token_hash=$1
       AND expires_at > NOW()
       AND used_at IS NULL`,
      [tokenHash]
    );

    if (tokenRes.rowCount === 0) {
      return Response.json({ ok: false });
    }

    const resetToken = tokenRes.rows[0];

    await client.query(
      `UPDATE users
       SET password=$1
       WHERE user_id=$2`,
      [password, resetToken.user_id]
    );

    await client.query(
      `UPDATE password_reset_tokens
       SET used_at=NOW()
       WHERE id=$1`,
      [resetToken.id]
    );

    return Response.json({ ok: true });

  } catch (err) {

    console.error(err);
    return Response.json({ ok: false });

  } finally {

    client.release();

  }

}