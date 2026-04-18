import { simpleEmaCrossStrategy } from "./indicator.js";

// ✅ ฟังก์ชันหลักสำหรับตรวจจับสัญญาณ (ปรับให้รับ candles จากข้างนอก)
export async function fetchAndAnalyzeSignal({ symbol, timeframe, candles: inputCandles }) {
  try {
    console.log(`🎯 [DATA-ENGINE] เริ่มตรวจจับสัญญาณ: ${symbol} ${timeframe}`);
    console.log(`🔄 [DATA-ENGINE] รับคำสั่งจากหน้าเว็บ: ${symbol} ${timeframe} | ${new Date().toLocaleTimeString()}`);

    // ✅ ใช้ Public API ดึงข้อมูล (ไม่ต้องใช้ API Key)
    let candles = inputCandles;
    
    if (!candles || candles.length === 0) {
      candles = await fetchCandlesPublic({ symbol, timeframe, limit: 500 });
    }

    if (!candles || candles.length === 0) {
      throw new Error('ไม่สามารถดึงข้อมูลแท่งเทียนได้');
    }

    console.log(`📊 [DATA-ENGINE] ได้รับข้อมูล ${candles.length} แท่งเทียน`);

    // 2. คำนวณ Indicators (EMA12, EMA26)
    const { closes, ema12, ema26 } = calculateIndicators(candles);
    
    // 3. คำนวณ RSI และ Divergence
    const closesArray = candles.map(c => c.close);
    const rsiResult = calculateRSI(closesArray, 14);
    const divergence = detectDivergence(candles, rsiResult.rsiValues, 20);
    const ema26Slope = checkEMASlope(ema26, 3);
    
    console.log(`📈 [DATA-ENGINE] คำนวณ indicators สำเร็จ:`, {
      symbol,
      timeframe,
      ema12: ema12[ema12.length-1]?.toFixed(2),
      ema26: ema26[ema26.length-1]?.toFixed(2),
      lastClose: closes[closes.length-1]?.toFixed(2),
      rsi: rsiResult.rsi?.toFixed(2),
    });

    // 4. เรียกใช้ Strategy เพื่อตรวจจับสัญญาณ
    const signal = await simpleEmaCrossStrategy({
      closes,
      ema12,
      ema26,
      symbol,
      timeframe,
      candles,
      rsi: rsiResult.rsi,
      divergence,
      ema26Slope
    });

    console.log(`✅ [DATA-ENGINE] การวิเคราะห์สัญญาณเสร็จสิ้น:`, {
      action: signal.action,
      status: signal.status,
    });

    return {
      candles: candles,
      ema12: ema12[ema12.length-1],
      ema26: ema26[ema26.length-1],
      rsi: rsiResult.rsi,
      rsiValues: rsiResult.rsiValues,
      divergence: divergence,
      ema26Slope: ema26Slope,
      signal: signal
    };

  } catch (error) {
    console.error('❌ [DATA-ENGINE] ข้อผิดพลาดในการวิเคราะห์สัญญาณ:', error.message);
    throw error;
  }
}

// ✅ ฟังก์ชันดึงข้อมูลจาก Public API (ไม่ต้องใช้ Key)
export async function fetchCandlesPublic({ symbol, timeframe, limit = 500 }) {
  try {
    console.log(`[DATA-ENGINE] ขอข้อมูลแท่งเทียน: ${symbol} ${timeframe}`);
    
    const url = `https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=${timeframe}&limit=${limit}`;
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

    console.log(`[DATA-ENGINE] ได้รับข้อมูล ${candles.length} แท่งเทียนสำเร็จ`);
    return candles;
    
  } catch (err) {
    console.error('[DATA-ENGINE] เกิดข้อผิดพลาด:', err.message);
    
    if (err.message.includes('Invalid symbol')) {
      throw new Error(`สัญลักษณ์ ${symbol} ไม่ถูกต้อง`);
    }
    
    throw err;
  }
}

// ✅ ฟังก์ชันคำนวณ Indicators
function calculateIndicators(candles) {
  const closes = candles.map(c => c.close);
  const ema12 = calculateEMA(closes, 12);
  const ema26 = calculateEMA(closes, 26);
  return { closes, ema12, ema26 };
}

// ✅ ฟังก์ชันคำนวณ EMA
function calculateEMA(data, period) {
  if (data.length < period) {
    return new Array(data.length).fill(0);
  }

  const ema = [];
  const multiplier = 2 / (period + 1);
  
  let sum = 0;
  for (let i = 0; i < period; i++) {
    sum += data[i];
  }
  ema.push(sum / period);

  for (let i = period; i < data.length; i++) {
    const value = (data[i] - ema[ema.length - 1]) * multiplier + ema[ema.length - 1];
    ema.push(value);
  }

  return ema;
}

// ✅ ฟังก์ชันคำนวณ RSI
function calculateRSI(closes, period = 14) {
  if (closes.length < period + 1) {
    return { rsi: null, rsiValues: [] };
  }

  let gains = [];
  let losses = [];
  
  for (let i = 1; i < closes.length; i++) {
    const diff = closes[i] - closes[i-1];
    gains.push(diff > 0 ? diff : 0);
    losses.push(diff < 0 ? -diff : 0);
  }
  
  let avgGain = gains.slice(0, period).reduce((a, b) => a + b, 0) / period;
  let avgLoss = losses.slice(0, period).reduce((a, b) => a + b, 0) / period;
  
  let rsiValues = [];
  
  for (let i = period; i < gains.length; i++) {
    if (i > period) {
      avgGain = (avgGain * (period - 1) + gains[i]) / period;
      avgLoss = (avgLoss * (period - 1) + losses[i]) / period;
    }
    
    if (avgLoss === 0) {
      rsiValues.push(100);
    } else {
      const rs = avgGain / avgLoss;
      rsiValues.push(100 - (100 / (1 + rs)));
    }
  }
  
  const fullRsi = new Array(closes.length - rsiValues.length).fill(null).concat(rsiValues);
  
  return {
    rsi: rsiValues[rsiValues.length - 1] || null,
    rsiValues: fullRsi
  };
}

// ✅ ตรวจจับ Divergence
function detectDivergence(candles, rsiValues, lookback = 20) {
  const lows = candles.map(c => c.low);
  const highs = candles.map(c => c.high);
  
  const validRsi = rsiValues.filter(v => v !== null);
  const validLows = lows.slice(-validRsi.length);
  const validHighs = highs.slice(-validRsi.length);
  
  if (validRsi.length < 5) {
    return {
      bullishRegular: false,
      bearishRegular: false,
      bullishHidden: false,
      bearishHidden: false,
      strength: 0
    };
  }
  
  let result = {
    bullishRegular: false,
    bearishRegular: false,
    bullishHidden: false,
    bearishHidden: false,
    strength: 0
  };
  
  const lastIdx = validRsi.length - 1;
  
  // Bullish Regular Divergence
  for (let i = 1; i < Math.min(lookback, lastIdx); i++) {
    const idx = lastIdx - i;
    if (validLows[idx] < validLows[idx-1] && validRsi[idx] > validRsi[idx-1]) {
      result.bullishRegular = true;
      result.strength += 1;
      break;
    }
  }
  
  // Bearish Regular Divergence
  for (let i = 1; i < Math.min(lookback, lastIdx); i++) {
    const idx = lastIdx - i;
    if (validHighs[idx] > validHighs[idx-1] && validRsi[idx] < validRsi[idx-1]) {
      result.bearishRegular = true;
      result.strength -= 1;
      break;
    }
  }
  
  return result;
}

// ✅ ตรวจสอบทิศทาง EMA
function checkEMASlope(emaValues, lookback = 3) {
  if (emaValues.length < lookback) {
    return { upward: false, downward: false, angle: 0 };
  }
  
  const recent = emaValues.slice(-lookback);
  let upward = true;
  let downward = true;
  
  for (let i = 1; i < recent.length; i++) {
    if (recent[i] <= recent[i-1]) upward = false;
    if (recent[i] >= recent[i-1]) downward = false;
  }
  
  const first = recent[0];
  const last = recent[recent.length - 1];
  const angle = ((last - first) / first) * 100;
  
  return { upward, downward, angle };
}

// ✅ ส่งออกฟังก์ชันทั้งหมด
export {
  fetchCandlesPublic as fetchCandlesFromAPI,
  calculateIndicators,
  calculateEMA,
  calculateRSI,
  detectDivergence,
  checkEMASlope
};