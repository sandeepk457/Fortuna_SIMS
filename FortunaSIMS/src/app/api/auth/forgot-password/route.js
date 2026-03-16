import { Pool } from "pg";
import crypto from "crypto";
import nodemailer from "nodemailer";

const pool = new Pool({
  host: "localhost",
  port: 5432,
  user: "postgres",
  password: process.env.DB_PASSWORD,
  database: "fortuna_sims_db",
});

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },
});

export async function POST(req) {
  try {

    const { email } = await req.json();

    const client = await pool.connect();

    const result = await client.query(
      "SELECT user_id FROM users_signup WHERE email=$1",
      [email]
    );

    if (result.rowCount === 0) {
      client.release();
      return Response.json({ ok: false });
    }

    const userId = result.rows[0].user_id;

    const token = crypto.randomBytes(32).toString("hex");

    const tokenHash = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");

    await client.query(
      `INSERT INTO password_reset_tokens
       (user_id, token_hash, expires_at, created_at)
       VALUES ($1,$2,NOW()+ interval '1 hour',NOW())`,
      [userId, tokenHash]
    );

    const resetLink =
      `http://localhost:3000/reset-password?token=${token}`;

    await transporter.sendMail({
      to: email,
      subject: "SIMS Password Reset",
      html: `
        <h2>Reset your password</h2>
        <p>Click the link below to reset your password:</p>
        <a href="${resetLink}">${resetLink}</a>
      `
    });

    client.release();

    return Response.json({ ok: true });

  } catch (error) {

    console.error("FORGOT PASSWORD ERROR:", error);

    return Response.json({
      ok: false,
      error: error.message
    });
    
  }
}