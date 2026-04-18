import { prisma } from "@/lib/prisma";
import { getAuth } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const auth = await getAuth();
    if (!auth || auth.role !== "ADMIN") {
      return NextResponse.json({ success: false, message: "forbidden" }, { status: 403 });
    }

    const { id } = await req.json();
    const t = await prisma.transaction.findUnique({ where: { id } });

    if (!t || t.status !== "approved") {
      return NextResponse.json({ success: false, message: "ไม่พบรายการถอนที่อนุมัติแล้ว" });
    }

    const user = await prisma.user.findUnique({ where: { id: t.userId } });
    if (!user) {
      return NextResponse.json({ success: false, message: "ไม่พบบัญชีผู้ใช้" }, { status: 404 });
    }

    // 💰 ตรวจช่องทางถอน
    let paymentResult = null;

    if (t.method === "binance") {
      // 🪙 ถอนผ่าน Binance (สมมติเรียก Binance API)
      // *** ตรงนี้ใส่โค้ด Binance จริงได้ภายหลัง ***
      console.log(`ส่งคำสั่งถอน USDT ไปยัง Binance ของ ${user.email}`);
      paymentResult = { success: true, ref: "BINANCE_TX_12345" };

    } else if (t.method === "bank") {
      // 🏦 ถอนผ่านบัญชีธนาคาร
      // *** ตรงนี้ใส่โค้ดเชื่อม API ธนาคารได้ภายหลัง ***
      console.log(`โอนเงิน ${t.amount} บาท เข้าบัญชีธนาคารของ ${user.email}`);
      paymentResult = { success: true, ref: "BANK_TX_67890" };

    } else {
      // ❌ ไม่มี method ที่ระบุไว้
      return NextResponse.json({ success: false, message: "ช่องทางการถอนเงินไม่ถูกต้อง" }, { status: 400 });
    }

    if (!paymentResult?.success) {
      return NextResponse.json({ success: false, message: "การจ่ายเงินจริงล้มเหลว" }, { status: 500 });
    }

    // ✅ อัปเดตสถานะการถอนเป็น paid
    await prisma.transaction.update({
      where: { id: t.id },
      data: {
        status: "paid",
        paidAt: new Date(),
        paymentRef: paymentResult.ref, // 🔹 เก็บรหัสอ้างอิงธุรกรรม
      },
    });

    return NextResponse.json({ success: true, message: "ทำเครื่องหมายว่าจ่ายเงินจริงแล้ว" });

  } catch (error) {
    console.error("Withdraw payment error:", error);
    return NextResponse.json({ success: false, message: "เกิดข้อผิดพลาดในระบบ" }, { status: 500 });
  }
}
