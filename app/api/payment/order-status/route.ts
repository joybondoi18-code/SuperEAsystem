// app/api/payment/order-status/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const orderId = searchParams.get("orderId") || "";
  if (!orderId) return NextResponse.json({ error: "orderId required" }, { status: 400 });

  const tx = await prisma.transaction.findFirst({ where: { txHash: orderId } });
  if (!tx) return NextResponse.json({ error: "not found" }, { status: 404 });

  return NextResponse.json({
    status: tx.status,
    userId: tx.userId,
    method: tx.method,
    amount: tx.amount,
    packageType: tx.packageType,  // ✅ เพิ่ม packageType ใน response
    qrcodeUrl: tx.qrcodeUrl || "https://pay.binance.com/qr/TKGucdubahmptjs4BeeAyWjFzxShVGSAq4"
  });
}