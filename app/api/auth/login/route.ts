import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { signToken } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();
    
    // หาผู้ใช้
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return NextResponse.json({ 
        success: false, 
        message: "ไม่พบบัญชี" 
      }, { status: 401 });
    }
    
    // ตรวจสอบรหัสผ่าน
    const ok = await bcrypt.compare(password, user.password);
    if (!ok) {
      return NextResponse.json({ 
        success: false, 
        message: "รหัสผ่านไม่ถูกต้อง" 
      }, { status: 401 });
    }

    // สร้าง token (ต้องใช้ await เพราะ signToken เป็น async)
    const token = await signToken({ 
      uid: user.id, 
      email: user.email, 
      role: user.role || "USER"  // ใช้ค่า default ถ้าไม่มี
    });
    
    // สร้าง response
    const res = NextResponse.json({ 
      success: true, 
      role: user.role || "USER",
      message: "เข้าสู่ระบบสำเร็จ",
      userId: user.id
      
    });

    // ตั้งค่า cookie
    res.cookies.set("auth", token, { 
      httpOnly: true, 
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 วัน
      sameSite: "lax"
    });
    
    return res;
    
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json({
      success: false,
      message: "เกิดข้อผิดพลาดในการเข้าสู่ระบบ"
    }, { status: 500 });
  }
}