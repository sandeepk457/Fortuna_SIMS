import { pool } from "@/lib/db";

export async function GET() {

  try {

    const result = await pool.query("SELECT NOW()");

    return Response.json({
      status: "Database Connected",
      time: result.rows[0]
    });

  } catch (error) {

    return Response.json({
      status: "Database Connection Failed",
      error: error.message
    });

  }

}