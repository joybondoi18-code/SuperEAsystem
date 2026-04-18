import { NextResponse } from "next/server";
import { getAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { query } from "@/lib/db";

export async function POST(req: Request) {
  // ✅ ตรวจสอบว่าเป็น Admin เท่านั้น
  const auth = await getAuth();
  if (!auth || auth.role !== "ADMIN") {
    console.log(`❌ Unauthorized: ${auth?.email || "Unknown"} tried to disconnect`);
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { email } = await req.json();
  
  if (!email) {
    return NextResponse.json({ error: "Email required" }, { status: 400 });
  }

  // ✅ 1. ลบ mt5Login และ apiKey จากตาราง user
  await prisma.user.update({
    where: { email },
    data: {
      mt5Login: null,
      apiKey: null,
      eaConnectedAt: null,
    },
  });

  // ✅ 2. ปิดการใช้งาน license ในตาราง licenses
  await query(
    `UPDATE licenses SET is_active = false WHERE email = $1`,
    [email]
  );

  console.log(`✅ Admin ${auth.email} disconnected EA for user: ${email}`);

  return NextResponse.json({ 
    success: true, 
    message: `Disconnected EA for ${email}` 
  });
}