export default {
  exchange: "binance", // "binance" | "bybit" | "okx"
  email: process.env.EMAIL || "",
  symbols: [
    "BTCUSDT","ETHUSDT","BNBUSDT","SOLUSDT","XRPUSDT",
    "DOGEUSDT","ADAUSDT","AVAXUSDT","TRXUSDT","DOTUSDT"
  ],
  // For OKX, symbols should be like "BTC-USDT","ETH-USDT", etc.
  timeframes: ["5m","15m","1h","4h"],
  candleLimit: 300,
  riskPerTradePct: 10,
  rr: 2,
  quoteAsset: "USDT",
  dryRun: true
};
