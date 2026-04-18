import { prisma } from '../lib/prisma';
import { fetchAndAnalyzeSignal } from './dataEngine';
import { executeForAllCustomers } from './centralEngine';

let activeBots = new Map(); // userId -> { intervalId, symbol, timeframe }

// เริ่ม Bot สำหรับลูกค้า
export async function startBotForUser(userId, symbol = 'BTCUSDT', timeframe = '15m') {
  // ✅ ตรวจสอบว่าลูกค้ามี API Key ใน Database หรือไม่
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { binanceApiKey: true, binanceSecretKey: true }
  });
  
  if (!user || !user.binanceApiKey || !user.binanceSecretKey) {
    console.log(`⚠️ [${userId}] ไม่มี API Key ใน Database ไม่เริ่ม Bot`);
    return { running: false, message: 'ไม่มี API Key' };
  }
  
  if (activeBots.has(userId)) {
    console.log(`🤖 Bot สำหรับ ${userId} กำลังทำงานอยู่แล้ว`);
    return { running: true };
  }
  
  console.log(`🚀 เริ่ม Bot สำหรับ ${userId} (${symbol} ${timeframe})`);
  
  const intervalId = setInterval(async () => {
    try {
      // ✅ ตรวจสอบ API Key อีกครั้งก่อนทำงาน (เผื่อถูกยกเลิกไปแล้ว)
      const currentUser = await prisma.user.findUnique({
        where: { id: userId },
        select: { binanceApiKey: true }
      });
      
      if (!currentUser || !currentUser.binanceApiKey) {
        console.log(`⚠️ [${userId}] API Key ถูกลบแล้ว หยุด Bot`);
        await stopBotForUser(userId);
        return;
      }
      
      console.log(`🔍 [${userId}] วิเคราะห์สัญญาณ ${symbol} ${timeframe}...`);
      
      const analysis = await fetchAndAnalyzeSignal({ symbol, timeframe });
      
      if (analysis.signal && analysis.signal.action !== 'HOLD') {
        console.log(`📊 [${userId}] พบสัญญาณ: ${analysis.signal.action} ${symbol}`);
        
        const signal = {
          action: analysis.signal.action.toLowerCase(),
          symbol: symbol,
          price: analysis.signal.price || analysis.candles?.[analysis.candles.length-1]?.close,
          sl: null,
          tp: null
        };
        
        const results = await executeForAllCustomers(signal);
        console.log(`📊 [${userId}] ส่ง order สำเร็จ: ${results.filter(r => r.success).length}/${results.length}`);
      }
      
    } catch (error) {
      console.error(`❌ [${userId}] Bot error:`, error.message);
    }
  }, 300000); // ทุก 5 นาที
  
  activeBots.set(userId, {
    intervalId,
    symbol,
    timeframe,
    startTime: new Date()
  });
  
  return { running: true, message: `Bot เริ่มทำงานสำหรับ ${userId}` };
}

// หยุด Bot สำหรับลูกค้า
export async function stopBotForUser(userId) {
  const bot = activeBots.get(userId);
  if (bot) {
    clearInterval(bot.intervalId);
    activeBots.delete(userId);
    console.log(`🛑 หยุด Bot สำหรับ ${userId}`);
    return { running: false };
  }
  return { running: false, message: 'ไม่พบ Bot ที่ทำงาน' };
}

// เพิ่มฟังก์ชันนี้ต่อท้ายไฟล์
export async function startAllBots() {
  console.log('🚀 เริ่ม Bot ให้ลูกค้าทุกคน...');
  
  const customers = await prisma.user.findMany({
    where: {
      binanceApiKey: { not: null },
      binanceSecretKey: { not: null }
    }
  });
  
  if (customers.length === 0) {
    console.log('⚠️ ไม่มีลูกค้าที่มี API Key');
    return;
  }
  
  for (const customer of customers) {
    await startBotForUser(customer.id, 'BTCUSDT', '15m');
  }
  
  console.log(`✅ เริ่ม Bot ครบ ${customers.length} ราย`);
}

// ตรวจสอบสถานะ
export function getBotStatus(userId) {
  return activeBots.has(userId);
}

export function getAllBotStatus() {
  const status = {};
  for (const [userId, bot] of activeBots) {
    status[userId] = {
      running: true,
      symbol: bot.symbol,
      timeframe: bot.timeframe,
      startTime: bot.startTime
    };
  }
  return status;
}