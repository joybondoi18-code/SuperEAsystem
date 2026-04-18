import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const {
      symbol,
      signal,           // "BUY" หรือ "SELL"
      h1Trend,          // 1 (ขึ้น), -1 (ลง), 0 (sideways)
      distance_points,  // ระยะห่างจาก EMA50 (จุด)
      spread,           // spread ปัจจุบัน
      body: candleBody, // ขนาดตัวเทียน
      wick_up,          // ไส้บน
      wick_down,        // ไส้ล่าง
    } = body;

    let shouldSend = false;
    let confidence = 0;
    const reasons: string[] = [];

    // ========== 1. H1 Trend ต้องตรงกับ signal ==========
    if (signal === "BUY" && h1Trend === 1) {
      reasons.push("✅ H1 trend ขาขึ้น สอดคล้องกับ BUY");
      confidence += 40;
    } else if (signal === "SELL" && h1Trend === -1) {
      reasons.push("✅ H1 trend ขาลง สอดคล้องกับ SELL");
      confidence += 40;
    } else {
      reasons.push("❌ H1 trend ไม่สอดคล้องกับ signal");
      return NextResponse.json({
        shouldSend: false,
        confidence,
        reason: reasons.join(" | "),
        suggestedSL: null,
        suggestedTP: null,
      });
    }

    // ========== 2. ระยะห่างจาก EMA50 (Zone) ==========
    if (distance_points <= 20) {
      reasons.push(`✅ ราคาห่าง EMA50 เพียง ${distance_points} จุด (ดีมาก)`);
      confidence += 25;
    } else if (distance_points <= 40) {
      reasons.push(`⚠️ ราคาห่าง EMA50 ${distance_points} จุด (พอใช้)`);
      confidence += 15;
    } else {
      reasons.push(`❌ ราคาห่าง EMA50 ${distance_points} จุด (ไกลเกินไป)`);
    }

    // ========== 3. Spread ==========
    if (spread <= 2) {
      reasons.push(`✅ Spread ${spread} จุด (ดี)`);
      confidence += 10;
    } else if (spread <= 5) {
      reasons.push(`⚠️ Spread ${spread} จุด (ปานกลาง)`);
      confidence += 5;
    } else {
      reasons.push(`❌ Spread ${spread} จุด (สูงเกินไป)`);
    }

    // ========== 4. Price Action ==========
    if (candleBody > wick_up + wick_down) {
      reasons.push(`✅ แท่งเทียนแข็งแรง (ตัวเทียน ${candleBody})`);
      confidence += 15;
    } else {
      reasons.push(`⚠️ แท่งเทียนมีไส้ยาว (wick up ${wick_up}, wick down ${wick_down})`);
    }

    // ========== 5. ตัดสินใจ ==========
    if (confidence >= 70) {
      shouldSend = true;
      reasons.push("🎯 สรุป: ผ่านเกณฑ์กรอง แนะนำให้ส่งสัญญาณ");
    } else {
      reasons.push("⚠️ สรุป: ยังไม่ผ่านเกณฑ์กรอง แนะนำให้รอ");
    }

    // ========== 6. แนะนำ SL/TP เบื้องต้น ==========
    let suggestedSL = null;
    let suggestedTP = null;
    if (shouldSend) {
      const atr = 10; // TODO: ดึง ATR จริงจาก market หรือใช้ fixed ตาม symbol
      if (signal === "BUY") {
        suggestedSL = body.price - atr;
        suggestedTP = body.price + atr * 2;
      } else {
        suggestedSL = body.price + atr;
        suggestedTP = body.price - atr * 2;
      }
    }

    return NextResponse.json({
      shouldSend,
      confidence,
      reason: reasons.join(" | "),
      suggestedSL,
      suggestedTP,
    });
  } catch (error) {
    console.error("AI Analyze Error:", error);
    return NextResponse.json({ error: "AI analysis failed" }, { status: 500 });
  }
}