import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { symbol, side, lot, price, sl, tp } = body;

    if (!symbol || !side) {
      return NextResponse.json({ status: "error", message: "missing symbol or side" }, { status: 400 });
    }

    // 1. Manual XM Signal (lot เท่านั้น)
    if (lot !== undefined && lot !== null && (price === undefined || price === null)) {
      await query("DELETE FROM signals WHERE status = 'active' AND is_pending IS NOT TRUE", []);
      await query(
        `INSERT INTO signals (symbol, side, lot, status, created_at, expires_at)
         VALUES ($1, $2, $3, 'active', NOW(), NOW() + INTERVAL '1 minute')`,
        [symbol.toUpperCase(), side.toUpperCase(), lot]
      );
      return NextResponse.json({ status: "ok", message: "XM manual signal saved" });
    }

    // 2. Pending Order (มี price, sl, tp) - รองรับ lot ด้วย (optional)
    if (price !== undefined && sl !== undefined && tp !== undefined) {
      const lotValue = (lot !== undefined && lot !== null) ? lot : null;
      
      await query("DELETE FROM signals WHERE status = 'active' AND is_pending = true", []);
      await query(
        `INSERT INTO signals (symbol, side, sl, tp, price, lot, is_pending, status, created_at, expires_at)
         VALUES ($1, $2, $3, $4, $5, $6, true, 'active', NOW(), NOW() + INTERVAL '1 hour')`,
        [symbol.toUpperCase(), side.toUpperCase(), sl, tp, price, lotValue]
      );
      return NextResponse.json({ status: "ok", message: "pending signal saved" });
    }

    // 3. Signal เดิม (มี sl, tp)
    if (sl === undefined || tp === undefined) {
      return NextResponse.json({ status: "error", message: "missing sl or tp" }, { status: 400 });
    }

    await query("DELETE FROM signals WHERE status = 'active' AND is_pending IS NOT TRUE", []);
    await query(
      `INSERT INTO signals (symbol, side, sl, tp, status, created_at, expires_at)
       VALUES ($1, $2, $3, $4, 'active', NOW(), NOW() + INTERVAL '1 minute')`,
      [symbol.toUpperCase(), side.toUpperCase(), sl, tp]
    );
    return NextResponse.json({ status: "ok", message: "signal saved" });

  } catch (err: any) {
    console.error("❌ API Error:", err);
    return NextResponse.json({ status: "error", message: err.message }, { status: 500 });
  }
}

export async function GET() {
  try {
    // 1. Pending Signal (รวม lot ถ้ามี)
    let result = await query(
      `SELECT symbol, side, price, sl, tp, lot, created_at
       FROM signals
       WHERE status = 'active' AND is_pending = true
       ORDER BY created_at DESC
       LIMIT 1`
    );

    if (result.rows.length > 0) {
      const row = result.rows[0];
      const responseData: any = {
        status: "ok",
        type: "pending",
        symbol: row.symbol,
        side: row.side,
        price: parseFloat(row.price),
        sl: parseFloat(row.sl),
        tp: parseFloat(row.tp),
        time: row.created_at
      };
      if (row.lot !== null && row.lot !== undefined) {
        responseData.lot = parseFloat(row.lot);
      }
      return NextResponse.json(responseData);
    }

    // 2. Manual Signal (lot)
    result = await query(
      `SELECT symbol, side, lot, created_at
       FROM signals
       WHERE status = 'active' AND lot IS NOT NULL AND (is_pending IS NULL OR is_pending = false)
       ORDER BY created_at DESC
       LIMIT 1`
    );

    if (result.rows.length > 0) {
      const row = result.rows[0];
      return NextResponse.json({
        status: "ok",
        type: "manual",
        symbol: row.symbol,
        side: row.side,
        lot: parseFloat(row.lot),
        time: row.created_at
      });
    }

    // 3. Signal เดิม (sl,tp)
    result = await query(
      `SELECT symbol, side, sl, tp, created_at
       FROM signals
       WHERE status = 'active' AND (is_pending IS NULL OR is_pending = false) AND (lot IS NULL OR lot = 0)
       ORDER BY created_at DESC
       LIMIT 1`
    );

    if (result.rows.length === 0) return NextResponse.json({ status: "empty" });

    const row = result.rows[0];
    return NextResponse.json({
      status: "ok",
      type: "legacy",
      symbol: row.symbol,
      side: row.side,
      sl: parseFloat(row.sl),
      tp: parseFloat(row.tp),
      time: row.created_at
    });

  } catch (err: any) {
    console.error("❌ API GET Error:", err);
    return NextResponse.json({ status: "error", message: err.message }, { status: 500 });
  }
}