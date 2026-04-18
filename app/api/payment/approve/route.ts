// app/api/payment/approve/route.ts
import { NextResponse } from "next/server";
import { getAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const REFERRAL_BONUS = 10;
const DAYS = 30;

export async function POST(req: Request) {
  // ✅ ตรวจสอบว่าเป็น admin
  const auth = await getAuth();
  if (!auth) return NextResponse.json({ error: "not auth" }, { status: 401 });
  
  const admin = await prisma.user.findUnique({ where: { id: auth.uid } });
  if (!admin || admin.role !== "ADMIN") {
    return NextResponse.json({ error: "unauthorized" }, { status: 403 });
  }

  const { transactionId } = await req.json();
  
  // ✅ ดึง transaction
  const tx = await prisma.transaction.findUnique({
    where: { id: transactionId },
  });
  
  if (!tx) {
    return NextResponse.json({ error: "transaction not found" }, { status: 404 });
  }
  
  if (tx.status !== "pending") {
    return NextResponse.json({ error: "transaction already processed" }, { status: 400 });
  }

  // ✅ ดึง user
  const user = await prisma.user.findUnique({ where: { id: tx.userId } });
  if (!user) {
    return NextResponse.json({ error: "user not found" }, { status: 404 });
  }

  let vpsId = null;
  
  // ✅ ถ้าเป็น premium ให้สร้าง VPS (TODO: เชื่อม VPS Provider จริง)
  if (tx.packageType === "PREMIUM") {
    // TODO: เรียก API สร้าง VPS
    // vpsId = await createVPS(user.id);
    vpsId = `vps_${Date.now()}_${user.id}`; // mock
  }

  // ✅ อัปเดต transaction เป็น approved
  await prisma.transaction.update({
    where: { id: transactionId },
    data: { 
      status: "approved",
      adminId: admin.id,
      approvedAt: new Date(),
    },
  });

  // ✅ อัปเดต subscription ของ user
  const newExpire = new Date(Math.max(Date.now(), user.planExpiresAt?.getTime() || 0) + DAYS * 24 * 60 * 60 * 1000);
  await prisma.user.update({
    where: { id: user.id },
    data: {
      isActive: true,
      planExpiresAt: newExpire,
      packageType: tx.packageType,
      vpsId: vpsId,
    },
  });

  // ✅ จัดการ referral bonus (เฉพาะ standard)
  if (user.referredBy && tx.packageType === "STANDARD") {
    const referrer = await prisma.user.findFirst({ where: { referralCode: user.referredBy } });
    if (referrer && referrer.id !== user.id) {
      await prisma.user.update({
        where: { id: referrer.id },
        data: { balance: { increment: REFERRAL_BONUS } },
      });
      await prisma.transaction.create({
        data: {
          userId: referrer.id,
          type: "bonus",
          amount: REFERRAL_BONUS,
          status: "approved",
          method: "system",
          refUserId: user.id,
        },
      });
    }
  }

  return NextResponse.json({ 
    success: true, 
    message: `อนุมัติ ${tx.packageType} สำเร็จ`, 
    vpsId 
  });
}