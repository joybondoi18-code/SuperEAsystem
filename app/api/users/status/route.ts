import { NextResponse } from "next/server";
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const email = searchParams.get('email');

  if (!email) {
    return NextResponse.json(
      { error: "กรุณาระบุ email" },
      { status: 400 }
    );
  }

  try {
    // ค้นหา user จาก email ในตาราง users
    const user = await prisma.user.findUnique({
      where: { email },
      select: { 
        isActive: true,
        planExpiresAt: true 
      }
    });

    if (!user) {
      return NextResponse.json({ 
        exists: false,
        isExpired: true,  // ไม่มี user ในระบบ ถือว่าหมดอายุ
        message: "ไม่พบผู้ใช้"
      });
    }

    // ตรวจสอบวันหมดอายุ
    const now = new Date();
    const isExpired = !user.isActive || (user.planExpiresAt && user.planExpiresAt < now);

    return NextResponse.json({
      exists: true,
      isExpired,
      isActive: user.isActive,
      planExpiresAt: user.planExpiresAt
    });

  } catch (error) {
    console.error("Error checking user status:", error);
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาด" },
      { status: 500 }
    );
  }
}