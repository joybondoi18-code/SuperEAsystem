import { NextResponse } from "next/server";
import { query } from "@/lib/db";

function corsResponse(data: any, status: number = 200) {
  return new NextResponse(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    console.log("📥 ADMIN POST received:", body);
    
    const { adminApiKey, symbol, side, sl, tp } = body;
    
    // ✅ ตรวจสอบ adminApiKey ว่ามี is_admin = true หรือไม่
    if (!adminApiKey) {
      return corsResponse({ error: "Admin API Key required" }, 400);
    }
    
    const dbResult = await query(
      `SELECT * FROM licenses 
       WHERE api_key = $1 
       AND is_admin = true 
       AND is_active = true 
       AND expires_at > NOW()`,
      [adminApiKey]
    );
    
    if (dbResult.rows.length === 0) {
      console.log(`❌ Invalid Admin API Key: ${adminApiKey}`);
      return corsResponse({ error: "Unauthorized: Admin access only" }, 403);
    }
    
    if (!symbol || !side) {
      return corsResponse({ error: "Missing symbol or side" }, 400);
    }
    
    // ✅ ลบ signal เก่า
    await query(`DELETE FROM signals WHERE status = 'active'`);
    
    // ✅ เก็บ signal ใหม่
    await query(
      `INSERT INTO signals (symbol, side, sl, tp, status, created_at, expires_at)
      VALUES ($1, $2, $3, $4, 'active', NOW(), NOW() + INTERVAL '1 minute')`,  // ← แก้ตรงนี้
      [symbol.toUpperCase(), side.toUpperCase(), sl || 0, tp || 0]
    );
    
    console.log(`✅ GLOBAL Signal saved: ${symbol} ${side}`);
    
    return corsResponse({ 
      status: "ok", 
      message: `Global signal for ${symbol} saved` 
    });
    
  } catch (error: any) {
    console.error("❌ POST Error:", error.message);
    return corsResponse({ error: error.message || "Internal server error" }, 500);
  }
}