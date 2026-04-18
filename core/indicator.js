import { executeForAllCustomers } from './centralEngine';
import { useBotStore } from "../app/crypto/store";
import { processSignalAI } from "./aiManager.js";  
let ws = null;

// 🚀 ใช้ฝั่ง server ตั้งค่า WebSocket
export function setWebSocketClient(client) {
  ws = client;
}

// เก็บค่าครั้งก่อนเพื่อรู้ว่ามีการเปลี่ยน timeframe/symbol
let lastSymbol = null;
let lastTimeframe = null;

// ✅ เพิ่มตัวนับสำหรับทดสอบ
let testCounter = 0;

export async function simpleEmaCrossStrategy({ 
  closes, 
  ema12, 
  ema26, 
  symbol, 
  timeframe,
  candles,
  // ❌ ลบ apiKey, secretKey ออก เพราะไม่ต้องใช้แล้ว
  rsi,
  divergence,
  ema26Slope
}) {
  testCounter++;

  console.log(`🤖 [STRATEGY] กำลังวิเคราะห์ ${symbol} ${timeframe}...`);
  
  console.log(`\n🔔 [REAL-TIME-TEST-${testCounter}] วิเคราะห์: ${symbol} ${timeframe} | ข้อมูล: ${closes.length} แท่งเทียน`);
  console.log(`📊 [REAL-TIME-TEST-${testCounter}] เวลา: ${new Date().toLocaleTimeString()}`);

  console.log(`🔍 [DEBUG-${testCounter}] ข้อมูลที่ได้รับ:`, {
    closes_length: closes?.length,
    ema12_length: ema12?.length,
    ema26_length: ema26?.length,
    rsi: rsi?.toFixed(2),
    divergence: divergence,
    ema26Slope: ema26Slope
  });

  console.log(`\n===============================`);
  console.log(`[simpleEmaCrossStrategy] วิเคราะห์สัญญาณ`);
  console.log(`Symbol=${symbol}, Timeframe=${timeframe}`);
  console.log(`===============================`);

  // ✅ ตรวจสอบข้อมูลที่จำเป็น
  if (!candles || !Array.isArray(candles) || candles.length === 0) {
    console.error(`[simpleEmaCrossStrategy] ❌ ข้อมูล candles ไม่ถูกต้อง`);
    return { 
      status: "STRATEGY_FAILED", 
      reason: "ข้อมูล candles ไม่ถูกต้อง",
      action: "HOLD" 
    };
  }

  // 🔥 ตรวจจับการเปลี่ยน timeframe / symbol
  if (symbol !== lastSymbol || timeframe !== lastTimeframe) {
    console.log(`🆕 [REAL-TIME-TEST] เปลี่ยนข้อมูลใหม่! From: ${lastSymbol}/${lastTimeframe} → ${symbol}/${timeframe}`);
    console.log(`✅ [REAL-TIME-TEST] การเปลี่ยนตลาดสำเร็จ!`);

    if (ws && ws.readyState === ws.OPEN) {
      ws.send(JSON.stringify({
        type: "INFO",
        message: `🔄 เปลี่ยนไปใช้ข้อมูลใหม่: ${symbol} (${timeframe})`
      }));
    }

    lastSymbol = symbol;
    lastTimeframe = timeframe;
  }

  // ✅ ตรวจสอบความยาวข้อมูลให้ถูกต้อง
  if (closes.length < 2 || !ema12 || !ema26 || ema12.length < 2 || ema26.length < 2) {
    console.error(`[simpleEmaCrossStrategy] ❌ ข้อมูลไม่เพียงพอ:`, {
      closes: closes.length,
      ema12: ema12?.length,
      ema26: ema26?.length
    });
    return { 
      status: "STRATEGY_FAILED",
      action: "HOLD", 
      reason: "ข้อมูลไม่เพียงพอ"
    };
  }

  const lastClose = closes[closes.length - 1];
  
  const ema12Len = ema12.length;
  const ema26Len = ema26.length;
  
  const prevEMA12 = ema12[ema12Len - 2];
  const prevEMA26 = ema26[ema26Len - 2];
  const lastEMA12 = ema12[ema12Len - 1];
  const lastEMA26 = ema26[ema26Len - 1];

  if (typeof lastEMA12 !== 'number' || typeof lastEMA26 !== 'number') {
    console.error(`❌ [INDICATOR] ค่า EMA ไม่ถูกต้อง:`, {
      lastEMA12: lastEMA12,
      lastEMA26: lastEMA26
    });
    return { 
      status: "INDICATOR_ERROR",
      action: "HOLD", 
      reason: "ค่า EMA ไม่ถูกต้อง" 
    };
  }

  console.log(`📈 [REAL-TIME-TEST-${testCounter}] EMA12: ${lastEMA12.toFixed(2)} | EMA26: ${lastEMA26.toFixed(2)} | ราคาปิด: ${lastClose.toFixed(2)}`);

  // ========== ตรวจจับสัญญาณ ==========
  let actionType = null;
  let signalReason = "";

  // ✅ 1. ตรวจสอบ DIVERGENCE + EMA SLOPE (Priority สูงสุด)
  if (divergence) {
    if (divergence.bullishRegular && ema26Slope.upward) {
      actionType = "BUY";
      signalReason = "Bullish Regular Divergence + EMA26 ขาขึ้น";
      console.log(`🎯 [REAL-TIME-TEST-${testCounter}] 🟢 BULLISH DIVERGENCE + EMA26 UP = BUY!`);
    }
    else if (divergence.bearishRegular && ema26Slope.downward) {
      actionType = "SELL";
      signalReason = "Bearish Regular Divergence + EMA26 ขาลง";
      console.log(`🎯 [REAL-TIME-TEST-${testCounter}] 🔴 BEARISH DIVERGENCE + EMA26 DOWN = SELL!`);
    }
    else if (divergence.bullishHidden && ema26Slope.upward) {
      actionType = "BUY";
      signalReason = "Bullish Hidden Divergence (แนวโน้มต่อเนื่อง)";
      console.log(`🎯 [REAL-TIME-TEST-${testCounter}] 🟢 BULLISH HIDDEN DIVERGENCE = BUY!`);
    }
    else if (divergence.bearishHidden && ema26Slope.downward) {
      actionType = "SELL";
      signalReason = "Bearish Hidden Divergence (แนวโน้มต่อเนื่อง)";
      console.log(`🎯 [REAL-TIME-TEST-${testCounter}] 🔴 BEARISH HIDDEN DIVERGENCE = SELL!`);
    }
  }

  // ✅ 2. ถ้าไม่มี Divergence ให้ใช้ EMA Crossover
  if (!actionType) {
    const emaCrossUp = prevEMA12 < prevEMA26 && lastEMA12 > lastEMA26;
    const emaCrossDown = prevEMA12 > prevEMA26 && lastEMA12 < lastEMA26;

    if (emaCrossUp) {
      actionType = "BUY";
      signalReason = "EMA Golden Cross";
      console.log(`🎯 [REAL-TIME-TEST-${testCounter}] 🟢 Golden Cross = BUY!`);
    } else if (emaCrossDown) {
      actionType = "SELL";
      signalReason = "EMA Death Cross";
      console.log(`🎯 [REAL-TIME-TEST-${testCounter}] 🔴 Death Cross = SELL!`);
    }
  }

  // ❕ ไม่มีสัญญาณ
  if (!actionType) {
    console.log(`[simpleEmaCrossStrategy] HOLD (ไม่มีสัญญาณ)`);
    console.log(`➖ [REAL-TIME-TEST-${testCounter}] ไม่พบสัญญาณ`);
    return { 
      status: "NO_SIGNAL",
      action: "HOLD", 
      reason: "ไม่มีสัญญาณ",
      details: {
        ema12: lastEMA12,
        ema26: lastEMA26,
        close: lastClose,
        divergence,
        ema26Slope
      }
    };
  }

  // ✅ มีสัญญาณ: บันทึกประวัติ
  useBotStore.getState().addSignalToHistory({
    action: actionType,
    symbol,
    timeframe,
    price: lastClose,
    reason: signalReason,
    time: new Date().toLocaleString(),
    status: 'SIGNAL_DETECTED'
  });

  // ✅ เพิ่ม: บันทึกสัญญาณผ่าน API
  try {
    await fetch('http://localhost:3000/api/signals/add', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: actionType,
        symbol: symbol,
        timeframe: timeframe,
        price: lastClose,
        reason: signalReason
      })
    });
    console.log(`📝 บันทึกสัญญาณ: ${actionType} ${symbol}`);
  } catch (err) {
    console.error('❌ บันทึกสัญญาณล้มเหลว:', err.message);
  }


  // ✅ ส่งแจ้งเตือน WebSocket
  if (ws && ws.readyState === ws.OPEN) {
    ws.send(JSON.stringify({
      type: "SIGNAL",
      message: `${actionType === "BUY" ? "🟢" : "🔴"} ${actionType}: ${signalReason} | ${symbol} ${timeframe} @ ${lastClose.toFixed(2)}`
    }));
  }

  // ✅ สร้างสัญญาณสำหรับส่งให้ลูกค้า
  const signalForCustomers = {
    action: actionType.toLowerCase(),
    symbol: symbol,
    price: lastClose,
    sl: null,
    tp: null
  };

  console.log(`📤 [STRATEGY] ส่งออเดอร์ให้ลูกค้าทุกคน: ${signalForCustomers.action} ${signalForCustomers.symbol}`);

  // ✅ ส่งออเดอร์ให้ลูกค้าทุกคน (ไม่ต้องรอ)
  try {
    const results = await executeForAllCustomers(signalForCustomers);
    console.log('📊 ผลการส่งออเดอร์ให้ลูกค้า:', 
      results.filter(r => r.success).length, 'สำเร็จ /', 
      results.filter(r => !r.success).length, 'ล้มเหลว'
    );
  } catch (error) {
    console.error('❌ ส่งออเดอร์ให้ลูกค้าล้มเหลว:', error.message);
  }

  // ✅ ถ้ามี AI ให้ประมวลผลเพิ่ม
  const rawSignal = { 
    action: actionType,
    price: lastClose,
    symbol,
    timeframe,
    candles, 
    signalReason,
    divergence,
    rsi
  };

  try {
    console.log(`[simpleEmaCrossStrategy] ส่งสัญญาณไปยัง AI...`);
    const aiProcessed = await processSignalAI(rawSignal);

    console.log(`[simpleEmaCrossStrategy] ผลลัพธ์ AI:`, {
      ...aiProcessed
    });

    if (ws && ws.readyState === ws.OPEN && aiProcessed.status === "AI_EXECUTED") {
      ws.send(JSON.stringify({
        type: "TRADE_EXECUTED",
        message: `✅ เปิดออเดอร์สำเร็จ: ${actionType} ${symbol} @ ${lastClose.toFixed(2)} (${signalReason})`,
        data: aiProcessed
      }));
    }

    return aiProcessed;

  } catch (error) {
    console.error(`[simpleEmaCrossStrategy] ❌ AI Processing ล้มเหลว:`, error.message);
    
    return {
      status: "AI_PROCESSING_FAILED",
      action: actionType,
      reason: error.message,
      originalSignal: {
        action: actionType,
        price: lastClose,
        symbol,
        timeframe,
        signalReason
      }
    };
  }
}

// ✅ เพิ่มฟังก์ชันทดสอบ
export function runTest() {
  console.log('🧪 ===== เริ่มการทดสอบ Strategy =====');
  console.log('📝 สถานะปัจจุบัน:');
  console.log(`   - Symbol: ${lastSymbol}`);
  console.log(`   - Timeframe: ${lastTimeframe}`);
  console.log(`   - จำนวนการเรียก: ${testCounter}`);
  console.log('✅ การทดสอบพร้อมใช้งาน');
}