import { BinanceConnector } from "../../../connectors/binance.js";

export async function POST(req) {
  try {
    const { symbol, timeframe, limit = 200 } = await req.json();
    
    if (!symbol || !timeframe) {
      return new Response(
        JSON.stringify({ error: "กรุณาระบุ symbol และ timeframe" }),
        { status: 400 }
      );
    }

    // ✅ ใช้ Testnet endpoint
    const url = `https://testnet.binance.vision/api/v3/klines?symbol=${symbol}&interval=${timeframe}&limit=${limit}`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Binance API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    const candles = data.map(k => ({
      time: k[0],
      open: parseFloat(k[1]),
      high: parseFloat(k[2]),
      low: parseFloat(k[3]),
      close: parseFloat(k[4]),
      volume: parseFloat(k[5]),
    }));

    return new Response(
      JSON.stringify({ candles }),
      { status: 200 }
    );
  } catch (err) {
    console.error("❌ Error:", err.message);
    return new Response(
      JSON.stringify({ error: err.message, candles: [] }),
      { status: 500 }
    );
  }
}
    
