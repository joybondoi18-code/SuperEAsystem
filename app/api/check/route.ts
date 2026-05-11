import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const login = searchParams.get("mt5_login");

  if (!login) {
    return NextResponse.json(
      { status: "error", message: "missing mt5_login" },
      { status: 400 }
    );
  }

  try {
    const result = await query(
      `
      SELECT status 
      FROM ib_clients 
      WHERE login = $1
      LIMIT 1
      `,
      [login]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ status: "deny" });
    }

    const { status } = result.rows[0];

    return NextResponse.json({
      status: status === "approved" ? "allow" : "deny"
    });

  } catch (err: any) {
    return NextResponse.json(
      { status: "error", message: err.message },
      { status: 500 }
    );
  }
}