import crypto from "crypto";
import bcrypt from "bcryptjs";
import { Pool } from "pg";

const pool = new Pool({
  host: "localhost",
  port: 5432,
  user: "postgres",
  password: "Tanvitha@0506",
  database: "fortuna_sims_db",
});

export async function POST(req) {

  const client = await pool.connect();

  try {

    const body = await req.json();
    const { token, password } = body;

    if (!token || !password) {
      return Response.json({
        ok:false,
        message:"Token and password required"
      });
    }

    // hash token
    const tokenHash = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");

    // check reset token
    const tokenRes = await client.query(
      `SELECT id, user_id
       FROM password_reset_tokens
       WHERE token_hash=$1
       AND expires_at > NOW()
       AND used_at IS NULL`,
      [tokenHash]
    );

    if (tokenRes.rowCount === 0) {

      return Response.json({
        ok:false,
        message:"Invalid or expired reset link"
      });

    }

    const { id, user_id } = tokenRes.rows[0];

    // hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // update password
    await client.query(
      `UPDATE users_signup
       SET password=$1
       WHERE user_id=$2`,
      [hashedPassword, user_id]
    );

    // mark token used
    await client.query(
      `UPDATE password_reset_tokens
       SET used_at=NOW()
       WHERE id=$1`,
      [id]
    );

    return Response.json({
      ok:true,
      message:"Password updated successfully"
    });

  } catch (err) {

    console.error("RESET PASSWORD ERROR:", err);

    return Response.json({
      ok:false,
      message:"Server error"
    });

  } finally {

    client.release();

  }

}