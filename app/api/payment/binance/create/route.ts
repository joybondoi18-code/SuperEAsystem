import { NextResponse } from "next/server";
import { getAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createBinancePayIntent } from "@/lib/payment/binance";

const UPGRADE_PRICE = 20;

export async function POST() {
  const auth = await getAuth();
  if (!auth) return NextResponse.json({ error: "not auth" }, { status: 401 });

  const intent = await createBinancePayIntent({ amount: UPGRADE_PRICE, currency: "USDT" });

  // create pending transaction
  await prisma.transaction.create({
  data: {
    userId: auth.uid,
    type: "upgrade",
    amount: UPGRADE_PRICE,
    method: "binance",
    status: "PENDING",
    txHash: intent.orderId, 
    qrcodeUrl: intent.qrCodeContent || null, // ✅ ใช้ชื่อที่มีอยู่จริง

  },
});
  return NextResponse.json({ success: true, intent });
}
