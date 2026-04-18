import { prisma } from '../../../../lib/prisma';
import { stopBotForUser } from '../../../../core/botService';

export async function POST(req) {
  try {
    const { email } = await req.json();
    
    if (!email) {
      return Response.json({ error: 'Missing email' }, { status: 400 });
    }
    
    const user = await prisma.user.findUnique({
      where: { email }
    });
    
    if (!user) {
      return Response.json({ error: 'User not found' }, { status: 404 });
    }
    
    console.log(`📢 ลูกค้า ${email} หมดอายุ → ลบข้อมูลและปิดปุ่ม`);
    
    // 1. ลบ API Key
    await prisma.user.update({
      where: { email },
      data: {
        binanceApiKey: null,
        binanceSecretKey: null,
        isActive: false
      }
    });
    
    // 2. หยุด Bot
    await stopBotForUser(user.id);
    
    // ✅ 3. อัปเดต planExpiresAt ให้หมดอายุแล้ว
    await prisma.user.update({
      where: { email },
      data: {
        planExpiresAt: new Date(Date.now() - 86400000) // เมื่อวาน
      }
    });
    
    return Response.json({ success: true });
    
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}