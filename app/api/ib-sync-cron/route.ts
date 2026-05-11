import { NextResponse } from "next/server";
import { query } from "@/lib/db";

// 👉 ตัวอย่าง: สมมติคุณมี data source (DB / mock / API ภายนอก)
function getIBData() {
  return [
    { login: "12345678" },
    { login: "87654321" },
    { login: "99999999" }
  ];
}

export async function GET() {
  try {
    const data = getIBData();

    for (const item of data) {
      const login = item.login?.toString().trim();
      if (!login) continue;

      await query(
        `
        INSERT INTO ib_clients (login, ib_code, status)
        VALUES ($1, $2, $3)
        ON CONFLICT (login)
        DO UPDATE SET
          status = EXCLUDED.status
        `,
        [login, "IB001", "approved"]
      );
    }

    return NextResponse.json({
      status: "ok",
      message: `synced ${data.length} records`
    });

  } catch (err: any) {
    return NextResponse.json(
      { status: "error", message: err.message },
      { status: 500 }
    );
  }
}