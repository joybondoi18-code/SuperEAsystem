import { executeForAllCustomers } from '../../../../core/centralEngine';
import { prisma } from '../../../../lib/prisma';

export async function POST(req) {
  try {
    const body = await req.json();
    console.log('📡 Admin signal received:', body);
    
    const { symbol, timeframe, action, price, lot, sl, tp } = body;
    
    // ตรวจสอบข้อมูล
    if (!symbol || !action || !price || !lot) {
      return new Response(
        JSON.stringify({ error: 'กรุณากรอกข้อมูลให้ครบ (symbol, action, price, lot)' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // ตรวจสอบว่ามีลูกค้าหรือไม่
    const customers = await prisma.user.findMany({
      where: {
        binanceApiKey: { not: null },
        binanceSecretKey: { not: null }
      }
    });
    
    if (customers.length === 0) {
      return new Response(
        JSON.stringify({ error: 'ไม่มีลูกค้าที่มี API Key ในระบบ' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    console.log(`\n🎮 ===== ADMIN ส่งสัญญาณเทรด =====`);
    console.log(`📊 สัญญาณ: ${action.toUpperCase()} ${symbol} @ ${price}`);
    console.log(`📦 จำนวน: ${lot} | SL: ${sl || '-'} | TP: ${tp || '-'}`);
    console.log(`👥 ส่งให้ลูกค้า ${customers.length} ราย`);
    
    // สร้างสัญญาณ
    const signal = {
      action: action.toLowerCase(),
      symbol: symbol.toUpperCase(),
      price: parseFloat(price),
      sl: sl ? parseFloat(sl) : null,
      tp: tp ? parseFloat(tp) : null,
      lot: parseFloat(lot)
    };
    
    // ✅ ส่ง order ให้ลูกค้าทุกคน (แค่ครั้งเดียว)
    const startTime = Date.now();
    const results = await executeForAllCustomers(signal);
    const elapsed = Date.now() - startTime;
    
    const successCount = results.filter(r => r.success).length;
    const failCount = results.filter(r => !r.success).length;
    
    console.log(`📊 ผลสรุป: สำเร็จ ${successCount} ราย / ล้มเหลว ${failCount} ราย`);
    console.log(`⏱️ ใช้เวลา: ${elapsed}ms`);
    
    // ✅ บันทึกสัญญาณผ่าน API
    try {
      await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/signals/add`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: action.toUpperCase(),
          symbol: symbol.toUpperCase(),
          timeframe: timeframe,
          price: parseFloat(price),
          reason: `สัญญาณเทรด (Lot: ${lot})`  
        })
      });
      console.log(`📝 บันทึกสัญญาณจาก Admin: ${action} ${symbol}`);
    } catch (err) {
      console.error('❌ บันทึกสัญญาณล้มเหลว:', err.message);
    }
    
    return new Response(
      JSON.stringify({
        success: true,
        message: `ส่งสัญญาณสำเร็จ: ${successCount}/${customers.length} ราย`,
        signal,
        results,
        summary: {
          total: customers.length,
          success: successCount,
          failed: failCount,
          elapsed
        }
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error('❌ Admin signal error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}