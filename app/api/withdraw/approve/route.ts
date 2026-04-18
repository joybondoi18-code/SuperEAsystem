import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getAuth } from "@/lib/auth";

export async function POST(req: Request) {
  const auth = await getAuth();
  if (!auth || auth.role !== "ADMIN") return NextResponse.json({ error: "forbidden" }, { status: 403 });
  const { id } = await req.json();
  const t = await prisma.transaction.findUnique({ where: { id } });
  if (!t || t.type !== "withdraw" || t.status !== "pending") return NextResponse.json({ success: false, message: "ไม่พบคำขอถอน" }, { status: 404 });
  const u = await prisma.user.findUnique({ where: { id: t.userId } });
  if (!u || u.balance < t.amount) return NextResponse.json({ success: false, message: "ยอดเงินไม่พอ" });
  await prisma.$transaction([
    prisma.user.update({ where: { id: u.id }, data: { balance: { decrement: t.amount } } }),
    prisma.transaction.update({ where: { id: t.id }, data: { status: "approved" } }),
  ]);
  return NextResponse.json({ success: true, message: "อนุมัติถอนแล้ว" });
}
