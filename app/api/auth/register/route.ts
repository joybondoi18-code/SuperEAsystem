import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { signToken } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const { email, password, referralCode } = await req.json();
    
    // เช็ค email ซ้ำ
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ 
        success: false, 
        message: "อีเมลนี้มีอยู่แล้ว" 
      }, { status: 400 });
    }
    
    const hashed = await bcrypt.hash(password, 10);
    const myCode = "REF" + Math.random().toString(36).substring(2, 8).toUpperCase();
    
    const user = await prisma.user.create({
      data: {
        email, 
        password: hashed, 
        role: "USER",
        referralCode: myCode, 
        referredBy: referralCode || null,
        isActive: true, 
        planExpiresAt: new Date(Date.now() + 30*24*60*60*1000)
      }
    });
    
    // ✅ แก้: ต้องใช้ await เพราะ signToken เป็น async แล้ว
    const token = await signToken({ 
      uid: user.id, 
      email: user.email, 
      role: "USER" 
    });
    
    const res = NextResponse.json({ 
      success: true, 
      message: "สมัครสำเร็จ (ทดลองใช้ฟรี 30 วัน)", 
      user: { email: user.email } 
    });
    
    res.cookies.set("auth", token, { 
      httpOnly: true, 
      path: "/",
      maxAge: 60 * 60 * 24 // 24 ชั่วโมง
    });
    
    return res;
    
  } catch (error: any) {
    console.error('Register error:', error);
    
    // ถ้าเป็น Prisma error
    if (error.code === 'P2002') {
      return NextResponse.json({
        success: false,
        message: "อีเมลนี้มีการใช้งานแล้ว"
      }, { status: 400 });
    }
    
    return NextResponse.json({
      success: false,
      message: "เกิดข้อผิดพลาดในการสมัครสมาชิก"
    }, { status: 500 });
  }
}