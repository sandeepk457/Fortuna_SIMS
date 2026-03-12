import { NextResponse } from "next/server";
import { pool } from "@/lib/db";

/* GET USERS */

export async function GET() {

  const result = await pool.query(`
    SELECT
      id,
      employee_id AS "employeeId",
      name,
      email,
      phone,
      department,
      role,
      status
    FROM user_master
    ORDER BY id DESC
  `);

  return NextResponse.json(result.rows);

}

/* ADD USER */

export async function POST(req: Request) {

  const body = await req.json();

  const {
    employeeId,
    name,
    email,
    phone,
    department,
    role,
    status
  } = body;

  const result = await pool.query(
    `
    INSERT INTO user_master
    (employee_id, name, email, phone, department, role, status)
    VALUES ($1,$2,$3,$4,$5,$6,$7)
    RETURNING
      id,
      employee_id AS "employeeId",
      name,
      email,
      phone,
      department,
      role,
      status
    `,
    [
      employeeId.trim().toUpperCase(),
      name,
      email,
      phone,
      department,
      role,
      status
    ]
  );

  return NextResponse.json(result.rows[0]);

}