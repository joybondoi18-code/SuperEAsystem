import { prisma } from '../../../lib/prisma';
import { encryptSecret } from '../../../lib/encryption';
import { startBotForUser } from '../../../core/botService';

export async function POST(req) {
  try {
    // ✅ รับ email ด้วย
    const { userId, email, apiKey, secretKey } = await req.json();

    // ✅ ตรวจสอบ email ด้วย
    if (!userId || !email || !apiKey || !secretKey) {
      return new Response(
        JSON.stringify({ error: 'กรุณากรอกข้อมูลให้ครบ (userId, email, apiKey, secretKey)' }),
        { status: 400 }
      );
    }

    // ✅ ตรวจสอบว่าอีเมลหมดอายุหรือไม่
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser && existingUser.planExpiresAt && new Date(existingUser.planExpiresAt) < new Date()) {
      return new Response(
        JSON.stringify({ error: 'สิทธิ์การใช้งานหมดอายุ กรุณาติดต่อ Admin' }),
        { status: 403 }
      );
    }

    // หา user จาก userId
    let user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      // ✅ ใช้ email จริง ไม่ใช่ email ปลอม
      user = await prisma.user.create({
        data: {
          id: userId,
          email: email,  // ✅ ใช้ email ที่รับมา
          password: 'temp_' + Math.random().toString(36).slice(2),
          referralCode: userId,
          isActive: true,
        }
      });
    }

    const encryptedSecret = encryptSecret(secretKey);

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        binanceApiKey: apiKey,
        binanceSecretKey: encryptedSecret,
      }
    });

    console.log(`🚀 กำลังเริ่ม Bot สำหรับ ${userId}...`);
    await startBotForUser(userId, 'BTCUSDT', '15m');

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'บันทึก API Key สำเร็จ และ Bot เริ่มทำงานแล้ว',
        userId: updatedUser.id 
      }),
      { status: 200 }
    );

  } catch (err) {
    console.error('❌ Error:', err);
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500 }
    );
  }
}

export async function GET(req) {
  try {
    const users = await prisma.user.findMany({
      where: {
        binanceApiKey: { not: null }
      },
      select: {
        id: true,
        email: true,
        binanceApiKey: true,
        isActive: true,
        balance: true
      }
    });

    return new Response(JSON.stringify(users), { status: 200 });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500 }
    );
  }
}