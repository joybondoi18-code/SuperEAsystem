// app/api/payment/create-intent/route.ts
import { NextResponse } from "next/server";
import { getAuth } from "@/lib/auth";
import { createBinancePayIntent } from "@/lib/payment/binance";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const auth = await getAuth();
  if (!auth) return NextResponse.json({ error: "not auth" }, { status: 401 });

  const { method, amount, packageType } = await req.json(); // ✅ รับ packageType
  
  if (method === "binance") {
    // ✅ ส่ง packageType ไปด้วย
    const intent = await createBinancePayIntent({ 
      amount: amount || 20, 
      currency: "USDT",
      packageType: packageType,
    });
    
    // ✅ บันทึก transaction ลง database
    const tx = await prisma.transaction.create({
      data: {
        userId: auth.uid,
        type: "upgrade",
        amount: amount || 20,
        method: "binance",
        status: "pending",
        txHash: intent.orderId,
        qrcodeUrl: intent.qrCodeContent,
        packageType: packageType, // ✅ บันทึก packageType
      },
    });
    
    return NextResponse.json({ 
      success: true, 
      method, 
      intent: {
        orderId: intent.orderId,
        qrCodeContent: intent.qrCodeContent,
      },
      transactionId: tx.id,
    });
  }
  
  if (method === "bank") {
    return NextResponse.json({ 
      success: true, 
      method, 
      instructions: "โอนเข้าบัญชีธนาคารลาว (บัญชีบาท) แล้วอัปโหลดสลิปให้ admin ตรวจ" 
    });
  }
  
  return NextResponse.json({ 
    success: false, 
    message: "method not supported" 
  }, { status: 400 });
}