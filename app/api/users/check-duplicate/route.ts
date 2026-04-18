import { NextResponse } from "next/server";
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');
    const mt5_login = searchParams.get('mt5_login');

    console.log("📡 API check-duplicate ถูกเรียก:", { email, mt5_login }); // ✅ Debug

    if (!mt5_login) {
      return NextResponse.json(
        { error: "กรุณาระบุ MT5 Login" },
        { status: 400 }
      );
    }

    // ค้นหาจาก MT5 Login
    const existingBot = await prisma.userBotMapping.findUnique({
      where: { mt5_login: mt5_login }
    });

    console.log("📦 ผลจาก DB:", existingBot); // ✅ Debug

    // กรณีที่ 1: MT5 Login นี้ยังไม่มีในระบบ
    if (!existingBot) {
      return NextResponse.json({
        isDuplicate: false,
        message: "✓ สามารถใช้งานได้"
      });
    }

    // กรณีที่ 2: MT5 Login มีในระบบแล้ว
    if (existingBot) {
      // เช็คว่าอีเมลตรงกันไหม
      const isSameEmail = existingBot.email === email;

      // ถ้าเป็นอีเมลเดียวกัน
      if (isSameEmail) {
        return NextResponse.json({
          isDuplicate: true,
          isOwner: true,
          isSameEmail: true,
          message: "✅ MT5 Login นี้คือบัญชีของคุณ"
        });
      } 
      
      // กรณีสำคัญ: อีเมลใหม่ แต่ MT5 Login เก่า
      else {
        return NextResponse.json({
          isDuplicate: true,
          isOwner: false,
          isSameEmail: false,
          message: "❌ อีเมลใหม่ แต่ MT5 นี้มีเจ้าของแล้ว"
        });
      }
    }

  } catch (error) {
    console.error("Error checking duplicate:", error);
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดในการตรวจสอบข้อมูล" },
      { status: 500 }
    );
  }
}