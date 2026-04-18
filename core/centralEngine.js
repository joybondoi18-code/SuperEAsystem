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

function calculateLot(balance, price) {
  // ทดสอบด้วย Lot คงที่ 0.001 BTC
  return 0.001;
}

export async function executeForAllCustomers(signal) {
  const customers = await getActiveCustomers();
  
  if (customers.length === 0) {
    console.log('⚠️ ไม่มีลูกค้าที่มี API Key ครบถ้วน');
    return [];
  }

  console.log(`🚀 ส่งออเดอร์ ${signal.action} ให้ลูกค้า ${customers.length} ราย`);
  console.log(`📊 สัญญาณ: ${signal.action} ${signal.symbol} @ ${signal.price}`);

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
      
      const lot = calculateLot(customer.balance || 1000, signal.price);
      
      console.log(`\n📤 [${customer.email}] กำลังส่งออเดอร์...`);
      
      const order = await binanceOrder({
        apiKey: customer.binanceApiKey,
        secretKey: realSecret,
        side: signal.action,
        symbol: signal.symbol,
        amount: lot,
        sl: signal.sl,
        tp: signal.tp
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