
import crypto from "crypto";
import bcrypt from "bcryptjs";
import { Pool } from "pg";

// Local uses .env.local DB settings.
// Production uses DATABASE_URL (Neon).
const isCloudDB = Boolean(process.env.DATABASE_URL);

const pool = new Pool(
  isCloudDB
    ? {
        connectionString: process.env.DATABASE_URL,
        ssl: {
          rejectUnauthorized: false,
        },
      }
    : {
        host: process.env.DB_HOST || "localhost",
        port: Number(process.env.DB_PORT || 5432),
        user: process.env.DB_USER || "postgres",
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME || "fortuna_sims_db",
        ssl: false,
      }
);

export async function POST(req) {
  let client;

  try {
    const body = await req.json();
    const { token, password } = body;

    if (!token || !password) {
      return Response.json(
        {
          ok: false,
          message: "Token and password required",
        },
        { status: 400 }
      );
    }

    if (typeof password !== "string" || password.length < 8) {
      return Response.json(
        {
          ok: false,
          message: "Password must be at least 8 characters",
        },
        { status: 400 }
      );
    }

    client = await pool.connect();

    const tokenHash = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");

    const tokenRes = await client.query(
      `SELECT id, user_id
       FROM password_reset_tokens
       WHERE token_hash = $1
         AND expires_at > NOW()
         AND used_at IS NULL
       LIMIT 1`,
      [tokenHash]
    );

    if (tokenRes.rowCount === 0) {
      return Response.json(
        {
          ok: false,
          message: "Invalid or expired reset link",
        },
        { status: 400 }
      );
    }

    const { id, user_id } = tokenRes.rows[0];

    const hashedPassword = await bcrypt.hash(password, 10);

    await client.query("BEGIN");

    await client.query(
      `UPDATE users_signup
       SET password = $1
       WHERE user_id = $2`,
      [hashedPassword, user_id]
    );

    await client.query(
      `UPDATE password_reset_tokens
       SET used_at = NOW()
       WHERE id = $1`,
      [id]
    );

    await client.query("COMMIT");

    return Response.json({
      ok: true,
      message: "Password updated successfully",
    });
  } catch (err) {
    if (client) {
      try {
        await client.query("ROLLBACK");
      } catch {}
    }

    console.error("RESET PASSWORD ERROR:", err);

    return Response.json(
      {
        ok: false,
        message:
          process.env.NODE_ENV === "production"
            ? "Unable to reset password. Please try again."
            : err.message,
      },
      { status: 500 }
    );
  } finally {
    if (client) {
      client.release();
    }
  }
}