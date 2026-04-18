import { prisma } from '../../../../lib/prisma';
import { stopBotForUser } from '../../../../core/botService';

export async function POST(req) {
  try {
    const { userId } = await req.json();
    
    if (!userId) {
      return Response.json({ error: 'Missing userId' }, { status: 400 });
    }
    
    // ✅ หยุด Bot
    await stopBotForUser(userId);
    
    // ✅ ลบ API Key ออกจาก Database
    await prisma.user.update({
      where: { id: userId },
      data: {
        binanceApiKey: null,
        binanceSecretKey: null
      }
    });
    
    console.log(`🔌 ลูกค้า ${userId} ตัดการเชื่อมต่อแล้ว (ลบ API Key จาก DB)`);
    
    return Response.json({ 
      success: true, 
      message: 'ตัดการเชื่อมต่อเรียบร้อย' 
    });
    
  } catch (error) {
    console.error('Disconnect error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}