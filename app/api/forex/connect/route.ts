import { NextResponse } from "next/server";
import { getAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { randomUUID } from "crypto";

export async function POST(req: Request) {
  const auth = await getAuth();
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { email, mt5Login } = await req.json();

  if (!email || !mt5Login) {
    return NextResponse.json({ error: "Email and MT5 Login required" }, { status: 400 });
  }

  // ✅ ตรวจสอบว่า email ตรงกับ user ที่ login
  const user = await prisma.user.findUnique({
    where: { id: auth.uid },
  });

  if (!user || user.email !== email) {
    return NextResponse.json({ error: "Email does not match your account" }, { status: 400 });
  }

  // ✅ ตรวจสอบ Subscription (หมดอายุหรือยัง)
  const now = new Date();
  if (!user.isActive) {
    return NextResponse.json({ 
      error: "EXPIRED", 
      message: "บัญชีของคุณไม่ถูกต้อง กรุณาติดต่อ Admin" 
    }, { status: 400 });
  }
  
  if (user.planExpiresAt && user.planExpiresAt < now) {
    return NextResponse.json({ 
      error: "EXPIRED", 
      message: "บัญชีของคุณหมดอายุแล้ว กรุณาต่ออายุเพื่อใช้งาน EA" 
    }, { status: 400 });
  }

  // ✅ ตรวจสอบว่า MT5 Login นี้มีเจ้าของแล้วหรือยัง (ในตาราง licenses)
  const existingLicense = await prisma.licenses.findFirst({
    where: {
      mt5_login: mt5Login,
    }
  });

  if (existingLicense) {
    return NextResponse.json({ 
      error: "DUPLICATE", 
      message: "MT5 Login นี้มีเจ้าของแล้ว กรุณาตรวจสอบอีกครั้ง" 
    }, { status: 400 });
  }

  // ✅ สร้าง API Key
  const apiKey = randomUUID();

  // ✅ บันทึกข้อมูลในตาราง licenses (ไม่ใช่ user)
  await prisma.licenses.create({
    data: {
      api_key: apiKey,
      mt5_login: mt5Login,
      email: email,
      is_active: true,
      is_admin: false,
      expires_at: user.planExpiresAt || new Date('2027-12-31'),
      allowed_ips: ["*"],
      magic_number: 123456,
    },
  });

  // ✅ อัปเดต user ให้มี mt5Login และ apiKey ด้วย (optional)
  await prisma.user.update({
    where: { id: auth.uid },
    data: {
      mt5Login: mt5Login,
      apiKey: apiKey,
      eaConnectedAt: new Date(),
    },
  });

  console.log(`✅ EA Connected: ${email} | MT5: ${mt5Login} | API Key: ${apiKey}`);

  return NextResponse.json({
    success: true,
    apiKey: apiKey,
    apiUrl: `${process.env.NEXT_PUBLIC_APP_URL}/api/ea/signal`,
    message: "เชื่อมต่อ EA สำเร็จ! กรุณาคัดลอก API Key ไปใส่ใน EA",
  });
}