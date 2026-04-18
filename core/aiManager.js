
// คำนวณ ATR (Average True Range)
function calculateATR(candles, period = 14) {
  if (candles.length < period + 1) return null;

  let trs = [];
  for (let i = 1; i < candles.length; i++) {
    const high = candles[i].high;
    const low = candles[i].low;
    const prevClose = candles[i - 1].close;

    const tr = Math.max(
      high - low,
      Math.abs(high - prevClose),
      Math.abs(low - prevClose)
    );
    trs.push(tr);
  }

  const atr = trs.slice(-period).reduce((a, b) => a + b, 0) / period;
  return atr;
}

export async function processSignalAI(signal) {
  const { action, price, symbol, timeframe, candles } = signal;

  console.log(`[AI] เริ่มวิเคราะห์สัญญาณแบบสมบูรณ์ Symbol=${symbol}`);

  // ✅ ตรวจสอบข้อมูลพื้นฐาน (ลบ apiKey, secretKey)
  if (!action || !symbol || !price || !candles || !Array.isArray(candles)) {
    console.error(`[AI] ข้อมูลสัญญาณไม่ครบถ้วน:`, { action, symbol, price, candles: candles?.length });
    return { status: "AI_FAILED", reason: "ข้อมูลสัญญาณไม่ครบถ้วน" };
  }

  // ❌ ลบส่วนตรวจสอบ API Keys เพราะไม่ต้องใช้แล้ว
  // if (!apiKey || !secretKey) {
  //   console.error("❌ [AI] ขาด API Keys");
  //   return { status: "AI_FAILED", reason: "API Keys ไม่ครบถ้วน" };
  // }

  // 📌 Balance (รอเชื่อมต่อ API จริง — ตอนนี้ static)
  const balance = 1000;
  const riskPercent = 1;  // เสี่ยง 1%
  const riskAmount = balance * (riskPercent / 100);

  // คำนวณ ATR จากแท่งเทียน
  const atr = calculateATR(candles);
  if (!atr || atr <= 0) {
    console.log(`[AI] ข้อมูล ATR ไม่เพียงพอหรือไม่ถูกต้อง: ${atr}`);
    return { status: "AI_FAILED", reason: "ข้อมูล ATR ไม่พอ" };
  }

  console.log(`[AI] ATR = ${atr.toFixed(4)}`);

  // ✅ แปลง action เป็น lowercase
  const normalizedAction = action.toLowerCase();
  if (normalizedAction !== 'buy' && normalizedAction !== 'sell') {
    console.error(`[AI] Action ไม่ถูกต้อง: ${action}`);
    return { status: "AI_FAILED", reason: "Action ไม่ถูกต้อง" };
  }

  // 📌 ใช้ ATR กำหนด SL & TP
  const sl = normalizedAction === "buy"
    ? price - (atr * 2)
    : price + (atr * 2);

  const tp = normalizedAction === "buy"
    ? price + (atr * 4)
    : price - (atr * 4);

  const stopLossDistance = Math.abs(price - sl);

  // ✅ ป้องกันการหารด้วยศูนย์
  if (stopLossDistance <= 0) {
    console.error(`[AI] Stop Loss Distance เป็นศูนย์: ${stopLossDistance}`);
    return { status: "AI_FAILED", reason: "Stop Loss Distance ไม่ถูกต้อง" };
  }

  // คำนวณ LOT จากระดับความเสี่ยง
  let lot = riskAmount / stopLossDistance;
  
  // ✅ ตรวจสอบว่า lot อยู่ในขอบเขตที่สมเหตุสมผล
  const MIN_LOT = 0.001;
  const MAX_LOT = 10;
  
  if (lot <= 0) {
    console.error(`[AI] Lot ที่คำนวณได้เป็นศูนย์หรือติดลบ: ${lot}`);
    return { status: "AI_FAILED", reason: "Lot ไม่สมเหตุสมผล" };
  }
  
  if (lot < MIN_LOT) {
    console.warn(`[AI] Lot ต่ำกว่าขั้นต่ำ, ปรับจาก ${lot} เป็น ${MIN_LOT}`);
    lot = MIN_LOT;
  }
  
  if (lot > MAX_LOT) {
    console.warn(`[AI] Lot สูงเกินไป, ปรับจาก ${lot} เป็น ${MAX_LOT}`);
    lot = MAX_LOT;
  }

  const finalOrder = {
    action: normalizedAction,
    symbol,
    timeframe,
    price,
    sl: Number(sl.toFixed(4)),
    tp: Number(tp.toFixed(4)),
    lot: Number(lot.toFixed(6)),
    atr: Number(atr.toFixed(4)),
    // ❌ ลบ apiKey, secretKey ออก
    status: "AI_PROCESSED",
  };

  console.log(`[AI] ผลลัพธ์คำสั่งหลังประมวลผล:`, {
    ...finalOrder,
    balance,
    riskAmount,
    stopLossDistance
  });

  // ✅ หมายเหตุ: การส่ง order จริงจะทำที่ centralEngine
  // ที่นี่แค่คืนค่าสัญญาณที่คำนวณแล้ว
  return {
    ...finalOrder,
    status: "AI_PROCESSED",
    timestamp: new Date().toISOString(),
    message: "สัญญาณถูกประมวลผลเรียบร้อย (รอส่ง order ผ่าน centralEngine)"
  };
}