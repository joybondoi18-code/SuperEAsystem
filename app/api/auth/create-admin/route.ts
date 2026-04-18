import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const hashedPassword = await bcrypt.hash("1234567", 10);
    
    const adminUser = await prisma.user.create({
      data: {
        email: "admin@example.com",
        password: hashedPassword,
        role: "ADMIN",
        referralCode: "ADMIN001",
        isActive: true
      }
    });

    return NextResponse.json({ 
      success: true, 
      message: "สร้าง Admin User เรียบร้อยแล้ว",
      user: { 
        email: adminUser.email, 
        role: adminUser.role 
      }
    });
  } catch (error: any) {
    return NextResponse.json({ 
      success: false, 
      message: "เกิดข้อผิดพลาด: " + error.message 
    }, { status: 500 });
  }
}