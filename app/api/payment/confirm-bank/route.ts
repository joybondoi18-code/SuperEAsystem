import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuth } from "@/lib/auth";

const DAYS = 30;

export async function POST(req: Request) {
  const auth = await getAuth();
  if (!auth || auth.role !== "ADMIN") return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const { userId } = await req.json();
  const u = await prisma.user.findUnique({ where: { id: userId } });
  if (!u) return NextResponse.json({ error: "user not found" }, { status: 404 });

  const newExpire = new Date(Math.max(Date.now(), u.planExpiresAt?.getTime() || 0) + DAYS*24*60*60*1000);
  await prisma.transaction.create({ data: { userId: u.id, type: "upgrade", amount: 20, status: "APPROVED", method: "bank" } });
  await prisma.user.update({ where: { id: u.id }, data: { isActive: true, planExpiresAt: newExpire } });

  if (u.referredBy) {
    const referrer = await prisma.user.findFirst({ where: { referralCode: u.referredBy } });
    if (referrer && referrer.id !== u.id) {
      await prisma.user.update({ where: { id: referrer.id }, data: { balance: { increment: 10 } } });
      await prisma.transaction.create({ data: { userId: referrer.id, type: "bonus", amount: 10, status: "APPROVED", method: "system", refUserId: u.id } });
    }
  }
  return NextResponse.json({ success: true });
}
