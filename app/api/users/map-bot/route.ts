import { NextResponse } from "next/server";
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const { email, mt5_login, mt5_server, mt5_broker, status } = await request.json();

    if (!email || !mt5_login || !mt5_server || !mt5_broker) {
      return NextResponse.json(
        { error: "กรุณากรอกข้อมูลให้ครบ" },
        { status: 400 }
      );
    }

    // ===== 🔥 เพิ่มโค้ดนี้ตรงนี้ =====
    // ตรวจสอบว่า MT5 Login นี้มีเจ้าของแล้วหรือยัง
    const existingBot = await prisma.userBotMapping.findUnique({
      where: { mt5_login: mt5_login }
    });

    // ถ้าเจอว่ามี MT5 นี้ในระบบแล้ว และไม่ใช่อีเมลเดียวกัน
    if (existingBot && existingBot.email !== email) {
      return NextResponse.json({
        success: false,
        error: "DUPLICATE_MT5_LOGIN",
        message: "❌ MT5 Login นี้มีเจ้าของแล้ว ไม่สามารถใช้อีเมลอื่นเชื่อมต่อได้"
      }, { status: 409 });
    }

    const mapping = await prisma.userBotMapping.upsert({
      where: { email: email },
      update: {
        mt5_login: mt5_login,
        mt5_server: mt5_server,
        mt5_broker: mt5_broker,
        status: status || 'active'
      },
      create: {
        email: email,
        mt5_login: mt5_login,
        mt5_server: mt5_server,
        mt5_broker: mt5_broker,
        status: status || 'active'
      }
    });

    return NextResponse.json({ success: true, data: mapping });

  } catch (error) {
    console.error("Error saving mapping:", error);
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดในการบันทึกข้อมูล" },
      { status: 500 }
    );
  }
}