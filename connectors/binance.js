import ccxt from "ccxt";
import dotenv from "dotenv";
dotenv.config();

export class BinanceConnector {
  constructor(apiKey, secretKey, useSandbox = false, customTimeout = 30000) {
    this.exchange = new ccxt.binance({
      apiKey: apiKey || process.env.BINANCE_API_KEY,
      secret: secretKey || process.env.BINANCE_API_SECRET,
      enableRateLimit: true,
      timeout: customTimeout,
      sandbox: useSandbox,
      options: {
        adjustForTimeDifference: true,
        defaultType: 'spot',
        fetchImpl: fetch,
        fetchMarginMarkets: false,
        fetchFuturesMarkets: false,
        fetchMarkets: true,
        fetchCurrencies: false,
        fetchTickers: false,
      },
    });
    
    console.log(`🔧 BinanceConnector: ${useSandbox ? 'TESTNET' : 'MAINNET'} mode (timeout: ${customTimeout}ms)`);
  }

  async testConnection() {
    try {
      await this.exchange.loadMarkets();
      return { success: true, msg: "เชื่อมต่อ Binance สำเร็จ ✅" };
    } catch (err) {
      return { success: false, msg: "เชื่อมต่อไม่สำเร็จ: " + err.message };
    }
  }

  // ✅ ฟังก์ชันแปลง Symbol
  formatSymbol(symbol) {
    return symbol.replace(/[\/\s]/g, '').toUpperCase();
  }

  async getOHLCV(symbol = "BTCUSDT", timeframe = "15m", limit = 200) {
    try {
      const formattedSymbol = this.formatSymbol(symbol);
      const candles = await this.exchange.fetchOHLCV(formattedSymbol, timeframe, undefined, limit);
      return candles.map(([time, open, high, low, close, volume]) => ({
        time,
        open: parseFloat(open),
        high: parseFloat(high),
        low: parseFloat(low),
        close: parseFloat(close),
        volume: parseFloat(volume),
      }));
    } catch (err) {
      throw new Error("ดึงข้อมูลกราฟไม่สำเร็จ: " + err.message);
    }
  }

  async createMarketOrder(symbol, side, amount) {
    try {
      const formattedSymbol = this.formatSymbol(symbol);
      console.log(`🛒 ส่ง Market Order: ${side} ${amount} ${formattedSymbol}`);
      const order = await this.exchange.createOrder(
        formattedSymbol,
        'market',
        side.toLowerCase(),
        amount
      );
      console.log('✅ Market Order สำเร็จ:', order.id);
      return order;
    } catch (err) {
      console.error('❌ Market Order ล้มเหลว:', err.message);
      throw new Error(`สร้างออเดอร์ไม่สำเร็จ: ${err.message}`);
    }
  }

  async createStopLoss(symbol, side, amount, stopPrice) {
    try {
      const formattedSymbol = this.formatSymbol(symbol);
      const stopLossSide = side.toLowerCase() === 'buy' ? 'sell' : 'buy';
      console.log(`🛡️  ส่ง Stop Loss: ${stopLossSide} ${amount} ${formattedSymbol} @ ${stopPrice}`);
      return await this.exchange.createOrder(
        formattedSymbol,
        'STOP_MARKET',
        stopLossSide,
        amount,
        undefined,
        { stopPrice: stopPrice }
      );
    } catch (err) {
      console.error('❌ Stop Loss ล้มเหลว:', err.message);
      throw new Error(`ตั้ง Stop Loss ไม่สำเร็จ: ${err.message}`);
    }
  }

  async createTakeProfit(symbol, side, amount, price) {
    try {
      const formattedSymbol = this.formatSymbol(symbol);
      const takeProfitSide = side.toLowerCase() === 'buy' ? 'sell' : 'buy';
      console.log(`🎯 ส่ง Take Profit: ${takeProfitSide} ${amount} ${formattedSymbol} @ ${price}`);
      return await this.exchange.createOrder(
        formattedSymbol,
        'LIMIT',
        takeProfitSide,
        amount,
        price,
        { timeInForce: 'GTC' }
      );
    } catch (err) {
      console.error('❌ Take Profit ล้มเหลว:', err.message);
      throw new Error(`ตั้ง Take Profit ไม่สำเร็จ: ${err.message}`);
    }
  }

  async getMarketInfo(symbol) {
    try {
      const formattedSymbol = this.formatSymbol(symbol);
      await this.exchange.loadMarkets();
      const market = this.exchange.markets[formattedSymbol];
      if (!market) {
        throw new Error(`ไม่พบสัญลักษณ์: ${symbol}`);
      }
      return {
        symbol: formattedSymbol,
        active: market.active,
        limits: market.limits,
        precision: market.precision
      };
    } catch (err) {
      throw new Error(`ตรวจสอบตลาดไม่สำเร็จ: ${err.message}`);
    }
  }
}

// ✅ ฟังก์ชันเปิดออเดอร์ (อันเดียว)
export async function binanceOrder({ 
  apiKey, 
  secretKey, 
  side, 
  symbol, 
  amount, 
  sl, 
  tp 
}) {
  try {
    console.log(`🔑 [binanceOrder] ใช้ API Key: ${apiKey?.slice(0,15)}...`);
    console.log(`📌 ส่งออเดอร์: ${side} ${amount} ${symbol}`);
    
    const binance = new BinanceConnector(apiKey, secretKey, false); // false = mainnet
    
    // ✅ ใช้ formattedSymbol
    const formattedSymbol = binance.formatSymbol(symbol);
    console.log(`🔍 ตรวจสอบ symbol: ${symbol} → formatted: ${formattedSymbol}`);
    
    const order = await binance.createMarketOrder(formattedSymbol, side, amount);
    console.log('✅ ออเดอร์หลักสำเร็จ:', order.id);

    const results = {
      success: true,
      mainOrder: order,
      stopLossOrder: null,
      takeProfitOrder: null,
      message: `เปิดออเดอร์ ${side} สำเร็จ`
    };

    if (sl) {
      try {
        results.stopLossOrder = await binance.createStopLoss(formattedSymbol, side, amount, sl);
        console.log('✅ ตั้ง Stop Loss สำเร็จ:', results.stopLossOrder.id);
      } catch (slError) {
        console.error('❌ ตั้ง Stop Loss ล้มเหลว:', slError.message);
      }
    }

    if (tp) {
      try {
        results.takeProfitOrder = await binance.createTakeProfit(formattedSymbol, side, amount, tp);
        console.log('✅ ตั้ง Take Profit สำเร็จ:', results.takeProfitOrder.id);
      } catch (tpError) {
        console.error('❌ ตั้ง Take Profit ล้มเหลว:', tpError.message);
      }
    }

    return results;

  } catch (err) {
    console.error('❌ binanceOrder failed:', err.message);
    throw new Error(`เปิดออเดอร์ไม่สำเร็จ: ${err.message}`);
  }
}

// ✅ ปรับให้ใช้ Public API
export async function connect({ symbol = "BTCUSDT", timeframe = "15m" }) {
  try {
    const url = `https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=${timeframe}&limit=200`;
    const response = await fetch(url);
    const data = await response.json();
    
    const candles = data.map(k => ({
      time: k[0],
      open: parseFloat(k[1]),
      high: parseFloat(k[2]),
      low: parseFloat(k[3]),
      close: parseFloat(k[4]),
      volume: parseFloat(k[5]),
    }));

    return { message: "เชื่อมต่อ Binance สำเร็จ ✅", candles };
  } catch (err) {
    throw new Error("เชื่อมต่อ Binance ไม่สำเร็จ: " + err.message);
  }
}
