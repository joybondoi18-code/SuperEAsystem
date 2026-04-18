// app/api/bot-status/route.ts
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const login = searchParams.get('login');

  if (!login) {
    return NextResponse.json({ isConnected: false });
  }

  try {
    // ✅ ถาม bridge ว่าสถานะจริงเป็นยังไง
    const bridgeRes = await fetch(`http://127.0.0.1:8003/status/${login}`);
    
    if (bridgeRes.ok) {
      const data = await bridgeRes.json();
      // data.running คือค่าที่ bridge ส่งกลับมาจาก /status/{account}
      return NextResponse.json({ isConnected: data.running || false });
    } else {
      return NextResponse.json({ isConnected: false });
    }
    
  } catch (error) {
    console.error("Error checking bot status:", error);
    return NextResponse.json({ isConnected: false });
  }
}