import { fetchAndAnalyzeSignal } from "../../../core/dataEngine.js";

// ✅ ฟังก์ชันตอบกลับสำหรับ preflight (OPTIONS)
export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}

export async function POST(req) {
  try {
    const body = await req.json();
    console.log("📦 DATA ที่ได้รับจาก frontend:", body);

    const { symbol, timeframe } = body;

    if (!symbol || !timeframe) {
      return new Response(
        JSON.stringify({ error: "กรุณาระบุ symbol และ timeframe" }),
        {
          status: 400,
          headers: {
            "Access-Control-Allow-Origin": "*",
          },
        }
      );
    }

    // ✅ ใช้ Public API ดึงข้อมูลกราฟ (ไม่ต้องใช้ API Key)
    const candles = await fetchCandlesPublic(symbol, timeframe);
    
    console.log(`✅ ดึงข้อมูล ${symbol} ${timeframe} สำเร็จ (${candles.length} แท่ง)`);

    // ✅ เรียก dataEngine ให้วิเคราะห์สัญญาณ (ไม่ต้องใช้ API Key)
    let resultAnalysis = null;
    try {
      resultAnalysis = await fetchAndAnalyzeSignal({
        symbol,
        timeframe,
        candles, // ส่ง candles ไปให้ dataEngine เลย
      });

      console.log("🤖 SIGNAL RESULT FROM ENGINE:", resultAnalysis);
    } catch (e) {
      console.error("❌ ERROR in dataEngine:", e.message);
    }

    // ⭐ ส่งผลลัพธ์กลับไปให้ frontend
    return new Response(
      JSON.stringify({
        candles: candles,
        signal: resultAnalysis,
      }),
      {
        status: 200,
        headers: {
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
    
  } catch (err) {
    console.error("❌ ERROR connecting to exchange:", err.message);
    return new Response(
      JSON.stringify({
        error: "เกิดข้อผิดพลาดระหว่างเชื่อมต่อ",
        details: err.message,
      }),
      {
        status: 500,
        headers: {
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  }
}

// ✅ ฟังก์ชันดึงข้อมูลกราฟจาก Public API (ไม่ต้องใช้ Key)
async function fetchCandlesPublic(symbol, timeframe, limit = 500) {
  const url = `https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=${timeframe}&limit=${limit}`;
  const response = await fetch(url);
  
  if (!response.ok) {
    throw new Error(`Binance API error: ${response.status}`);
  }
  
  const data = await response.json();
  
  return data.map(k => ({
    time: k[0],
    open: parseFloat(k[1]),
    high: parseFloat(k[2]),
    low: parseFloat(k[3]),
    close: parseFloat(k[4]),
    volume: parseFloat(k[5]),
  }));
}