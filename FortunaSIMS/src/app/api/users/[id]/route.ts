import { NextResponse } from "next/server";
import { pool } from "@/lib/db";

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {

    const { id } = await params;
    const employeeId = decodeURIComponent(id).trim().toUpperCase();

    const body = await req.json();

    const { name, email, phone, department, role, status } = body;

    const result = await pool.query(
      `
      UPDATE user_master
      SET
        name=$1,
        email=$2,
        phone=$3,
        department=$4,
        role=$5,
        status=$6,
        updated_at = NOW()
      WHERE employee_id = $7
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
        name,
        email,
        phone,
        department,
        role,
        status,
        id
      ]
    );

    if (!result.rows.length) {
      return NextResponse.json(
        { error: "User not found or nothing updated" },
        { status: 404 }
      );
    }

    return NextResponse.json(result.rows[0]);

  } catch (error) {

    console.error("UPDATE ERROR:", error);

    return NextResponse.json(
      { error: "Update failed" },
      { status: 500 }
    );

  }
}