import { Buffer } from "buffer";
import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { parse } from "csv-parse/sync";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file");

    // =========================
    // 1. validate file
    // =========================
    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { status: "error", message: "no file uploaded" },
        { status: 400 }
      );
    }

    // =========================
    // 2. read CSV
    // =========================
    const buffer = Buffer.from(await file.arrayBuffer());
    const csvText = buffer.toString("utf-8");

    const records = parse(csvText, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    }) as any[];

    let success = 0;

    // =========================
    // 3. loop insert login only
    // =========================
    for (const row of records) {
      // รองรับหลายชื่อ column
      const login =
        row["MT4/MT5 ID"] ||
        row["login"] ||
        row["Login"] ||
        row["account"];

      if (!login) continue;

      const mt5_login = String(login).trim();

      await query(
        `
        INSERT INTO ib_clients (login, ib_code, status)
        VALUES ($1, $2, $3)
        ON CONFLICT (login)
        DO UPDATE SET
          status = EXCLUDED.status
        `,
        [mt5_login, "IB001", "approved"]
      );

      success++;
    }

    // =========================
    // 4. response
    // =========================
    return NextResponse.json({
      status: "ok",
      message: `synced ${success} records`,
      total: records.length
    });

  } catch (err: any) {
    console.error("IB SYNC ERROR:", err);

    return NextResponse.json(
      { status: "error", message: err.message },
      { status: 500 }
    );
  }
}