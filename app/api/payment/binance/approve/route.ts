import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuth } from "@/lib/auth";

const DAYS = 30;
const REFERRAL_BONUS = 10;

export async function POST(req: Request) {
  const auth = await getAuth();
  if (!auth || auth.role !== "ADMIN") return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const { orderId } = await req.json();
  if (!orderId) return NextResponse.json({ error: "orderId required" }, { status: 400 });

  const tx = await prisma.transaction.findFirst({ where: { txHash: orderId, type: "upgrade", method: "binance" } });
  if (!tx) return NextResponse.json({ error: "order not found" }, { status: 404 });
  if (tx.status === "approved") return NextResponse.json({ success: true, message: "already approved" });

  const u = await prisma.user.findUnique({ where: { id: tx.userId } });
  if (!u) return NextResponse.json({ error: "user not found" }, { status: 404 });

  // Update transaction -> approved and extend plan
  const newExpire = new Date(Math.max(Date.now(), u.planExpiresAt?.getTime() || 0) + DAYS*24*60*60*1000);

  await prisma.$transaction([
    prisma.transaction.update({ where: { id: tx.id }, data: { status: "approved" } }),
    prisma.user.update({ where: { id: u.id }, data: { isActive: true, planExpiresAt: newExpire } })
  ]);

  // referral bonus
  if (u.referredBy) {
    const referrer = await prisma.user.findFirst({ where: { referralCode: u.referredBy } });
    if (referrer && referrer.id !== u.id) {
      await prisma.user.update({ where: { id: referrer.id }, data: { balance: { increment: REFERRAL_BONUS } } });
      await prisma.transaction.create({
        data: { userId: referrer.id, type: "bonus", amount: REFERRAL_BONUS, status: "approved", method: "system", refUserId: u.id }
      });
    }
  }

  return NextResponse.json({ success: true });
}
