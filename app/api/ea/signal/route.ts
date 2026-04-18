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

function isIPAllowed(allowedIPs: string[], clientIP: string): boolean {
  if (!allowedIPs || allowedIPs.length === 0) return true;
  if (allowedIPs.includes("*")) return true;
  return allowedIPs.includes(clientIP);
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

// ==================== EA GET (อ่าน Signal) ====================
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const apiKey = searchParams.get("apiKey");
    const mt5Login = searchParams.get("mt5Login");
    const clientIP = req.headers.get("x-forwarded-for") || req.headers.get("cf-connecting-ip") || "unknown";
    
    console.log("📤 EA GET - apiKey:", apiKey, "mt5Login:", mt5Login);
    
    if (!apiKey || !mt5Login) {
      return corsResponse({ error: "apiKey and mt5Login required" }, 400);
    }
    
    // ✅ ตรวจสอบสิทธิ์ EA
    const dbResult = await query(
      `SELECT * FROM licenses 
       WHERE api_key = $1 
       AND is_active = true 
       AND expires_at > NOW()`,
      [apiKey]
    );
    
    if (dbResult.rows.length === 0) {
      console.log(`❌ GET: Invalid API Key: ${apiKey}`);
      return corsResponse({ error: "Invalid or expired API Key" }, 401);
    }
    
    const license = dbResult.rows[0];
    
    if (license.mt5_login !== mt5Login) {
      console.log(`❌ GET: API Key not paired with MT5 Login: ${mt5Login}`);
      return corsResponse({ error: "API Key not authorized for this MT5 account" }, 403);
    }
    
    const allowedIPs = license.allowed_ips || ["*"];
    if (!isIPAllowed(allowedIPs, clientIP)) {
      console.log(`❌ GET: IP not allowed: ${clientIP}`);
      return corsResponse({ error: "IP not authorized" }, 403);
    }
    
    // ✅ อ่าน signal จาก database (ไม่ลบ)
    const signalResult = await query(
      `SELECT symbol, side, sl, tp, status, created_at, expires_at
       FROM signals 
       WHERE status = 'active' 
       AND expires_at > NOW() 
       ORDER BY created_at DESC 
       LIMIT 1`
    );
    
    if (signalResult.rows.length === 0) {
      return corsResponse({ status: "waiting", message: "No signal" });
    }
    
    const signal = signalResult.rows[0];
    
    // ✅ สร้าง response
    const responseSignal = {
      status: "active",
      action: "OPEN",
      symbol: signal.symbol,
      side: signal.side,
      sl: signal.sl || 0,
      tp: signal.tp || 0,
      timestamp: signal.created_at
    };
    
    console.log(`📤 Signal sent to ${mt5Login}: ${signal.side} ${signal.symbol}`);
    console.log(`📤 Signal expires at: ${signal.expires_at}`);
    
    return corsResponse(responseSignal);
    
  } catch (error: any) {
    console.error("❌ GET Error:", error.message);
    return corsResponse({ error: error.message }, 500);
  }
}