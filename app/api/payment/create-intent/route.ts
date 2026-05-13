// app/api/payment/create-intent/route.ts
import { NextResponse } from "next/server";
import { getAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const auth = await getAuth();
  if (!auth) return NextResponse.json({ error: "not auth" }, { status: 401 });

  const { method, amount, packageType } = await req.json();
  
  if (method === "binance") {
    // ✅ สร้าง Order ID เอง (ไม่ต้องเรียก Binance Pay)
    const orderId = `ORDER_${Date.now()}_${auth.uid}_${Math.random().toString(36).slice(2, 8)}`;
    
    // ✅ บันทึก transaction ลง database
    const tx = await prisma.transaction.create({
      data: {
        userId: auth.uid,
        type: "upgrade",
        amount: amount || 20,
        method: "binance",
        status: "PENDING",
        txHash: orderId,
        // qrcodeUrl ไม่ต้องบันทึก เพราะหน้า PaymentStatus จะสร้าง QR เอง
        packageType: packageType,
      },
    });
    
    // ✅ ส่ง orderId กลับไป (ไม่ต้องส่ง qrCodeContent)
    return NextResponse.json({ 
      success: true, 
      method, 
      intent: {
        orderId: orderId,
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