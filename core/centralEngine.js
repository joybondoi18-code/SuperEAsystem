import { prisma } from '../lib/prisma';
import { decryptSecret } from '../lib/encryption';
import { binanceOrder } from '../connectors/binance';

export async function getActiveCustomers() {
  try {
    const customers = await prisma.user.findMany({
      where: {
        binanceApiKey: { not: null },
        binanceSecretKey: { not: null }  // ✅ เพิ่มบรรทัดนี้
      },
      select: {
        id: true,
        email: true,
        binanceApiKey: true,
        binanceSecretKey: true,
        balance: true
      }
    });
    
    console.log(`📋 [CentralEngine] พบลูกค้า ${customers.length} รายที่มี API Key ครบถ้วน`);
    return customers;
    
  } catch (err) {
    console.error('❌ ดึงข้อมูลลูกค้าล้มเหลว:', err);
    return [];
  }
}

// ✅ แก้ไข: รับ requestedLot และใช้ค่านั้น (ถ้ามี)
function calculateLot(balance, requestedLot) {
  // ถ้า Admin ส่ง lot มา → ใช้ค่านั้น (Binance จะตรวจสอบ minLot อีกที)
  if (requestedLot && requestedLot > 0) {
    console.log(`🔍 [CentralEngine] ใช้ requestedLot: ${requestedLot}`);
    return requestedLot;
  }
  // ยังคงค่า default 0.001 สำหรับกรณีที่ไม่มี lot ส่งมา
  console.log(`🔍 [CentralEngine] ไม่มี requestedLot ใช้ default: 0.001`);
  return 0.001;
}

export async function executeForAllCustomers(signal) {
  const customers = await getActiveCustomers();
  
  if (customers.length === 0) {
    console.log('⚠️ ไม่มีลูกค้าที่มี API Key ครบถ้วน');
    return [];
  }

  console.log(`🚀 ส่งออเดอร์ ${signal.action} ให้ลูกค้า ${customers.length} ราย`);
  console.log(`📊 สัญญาณ: ${signal.action} ${signal.symbol}`);
  console.log(`🔍 Signal object:`, JSON.stringify(signal, null, 2));

  const results = [];

  for (const customer of customers) {
    try {
      // ✅ ตรวจสอบว่ามี Secret Key
      if (!customer.binanceSecretKey) {
        console.error(`❌ [${customer.email}] ไม่มี Secret Key`);
        results.push({
          customerId: customer.id,
          email: customer.email,
          success: false,
          error: 'ไม่มี Secret Key ในระบบ'
        });
        continue;
      }
      
      // ✅ ถอดรหัส Secret Key
      const realSecret = decryptSecret(customer.binanceSecretKey);
      
      // ✅ แก้ไข: ส่ง signal.lot เข้าไปใน calculateLot (ไม่ต้องส่ง price)
      const lot = calculateLot(customer.balance || 1000, signal.lot);
      
      console.log(`\n📤 [${customer.email}] กำลังส่งออเดอร์...`);
      console.log(`🔍 Final lot: ${lot}`);
      
      // ✅ ส่ง order (ไม่ต้องมี sl, tp)
      const order = await binanceOrder({
        apiKey: customer.binanceApiKey,
        secretKey: realSecret,
        side: signal.action,
        symbol: signal.symbol,
        amount: lot
      });

      console.log(`✅ [${customer.email}] ส่งออเดอร์สำเร็จ!`);
      results.push({
        customerId: customer.id,
        email: customer.email,
        success: true,
        orderId: order.mainOrder?.id,
        message: 'สำเร็จ'
      });

    } catch (err) {
      console.error(`❌ [${customer.email}] ส่งออเดอร์ล้มเหลว:`, err.message);
      results.push({
        customerId: customer.id,
        email: customer.email,
        success: false,
        error: err.message
      });
    }
  }

  console.log(`\n📊 ผลสรุป: สำเร็จ ${results.filter(r => r.success).length} ราย / ล้มเหลว ${results.filter(r => !r.success).length} ราย`);
  return results;
}