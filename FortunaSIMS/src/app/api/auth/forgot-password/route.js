import { Pool } from "pg";
import crypto from "crypto";
import nodemailer from "nodemailer";

// Local PostgreSQL: no SSL
// Cloud PostgreSQL (Neon): SSL enabled
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

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    user: process.env.MAIL_USER?.trim(),
    pass: process.env.MAIL_PASS?.replace(/\s+/g, ""),
  },
});

export async function POST(req) {
  let client;

  try {
    const { email } = await req.json();

    if (!email || typeof email !== "string") {
      return Response.json(
        { ok: false, error: "Please provide a valid email address." },
        { status: 400 }
      );
    }

    if (!process.env.MAIL_USER || !process.env.MAIL_PASS) {
      console.error("Forgot password: MAIL_USER or MAIL_PASS is missing.");
      return Response.json(
        { ok: false, error: "Email service is not configured." },
        { status: 500 }
      );
    }

    if (!isCloudDB && !process.env.DB_PASSWORD) {
      console.error("Forgot password: local DB_PASSWORD is missing.");
      return Response.json(
        { ok: false, error: "Database is not configured." },
        { status: 500 }
      );
    }

    client = await pool.connect();

    const result = await client.query(
      `SELECT user_id
       FROM users_signup
       WHERE LOWER(email) = LOWER($1)
       LIMIT 1`,
      [email.trim()]
    );

    if (result.rowCount === 0) {
      return Response.json(
        {
          ok: false,
          error: "No account found with this email address.",
        },
        { status: 404 }
      );
    }

    const userId = result.rows[0].user_id;

    // Generate secure reset token
    const token = crypto.randomBytes(32).toString("hex");

    // Store only the hashed token in the database
    const tokenHash = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");

    await client.query(
      `INSERT INTO password_reset_tokens
        (user_id, token_hash, expires_at, created_at)
       VALUES ($1, $2, NOW() + INTERVAL '1 hour', NOW())`,
      [userId, tokenHash]
    );

    // Local .env.local: http://localhost:3000
    // Vercel Production: https://sims.fortunaglobalsupplychain.com
    const appUrl = (
      process.env.APP_URL || "http://localhost:3000"
    ).replace(/\/+$/, "");

    const resetLink =
      `${appUrl}/reset-password?token=${encodeURIComponent(token)}`;

    await transporter.sendMail({
      from: process.env.MAIL_USER,
      to: email.trim(),
      subject: "SIMS Password Reset",
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6;">
          <h2>Reset your SIMS password</h2>
          <p>We received a request to reset your password.</p>
          <p>
            <a href="${resetLink}"
               style="display:inline-block;padding:12px 20px;
                      background:#C8102E;color:#ffffff;
                      text-decoration:none;border-radius:6px;">
              Reset Password
            </a>
          </p>
          <p>This link expires in 1 hour.</p>
          <p>If you did not request a password reset, you can ignore this email.</p>
        </div>
      `,
    });

    return Response.json({ ok: true });
  } catch (error) {
    console.error("FORGOT PASSWORD ERROR:", error);

    return Response.json(
      {
        ok: false,
        error:
          process.env.NODE_ENV === "production"
            ? "Unable to send reset link. Please try again later."
            : error.message,
      },
      { status: 500 }
    );
  } finally {
    if (client) {
      client.release();
    }
  }
}