import { prisma } from "@/lib/prisma";
import { getAuth } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const auth = await getAuth();
    if (!auth || auth.role !== "ADMIN") {
      return NextResponse.json({ success: false, message: "forbidden" }, { status: 403 });
    }

    const { id, paymentRef } = await req.json();
    
    if (!paymentRef) {
      return NextResponse.json({ 
        success: false, message: "กรุณาระบุเลขที่อ้างอิงการโอน" 
      }, { status: 400 });
    }

    const t = await prisma.transaction.findUnique({ where: { id } });

    if (!t || t.type !== "withdraw") {
      return NextResponse.json({ 
        success: false, message: "ไม่พบรายการถอน" 
      }, { status: 404 });
    }

    // ✅ ป้องกันการจ่ายซ้ำ
    if (t.status === "PAID") {
      return NextResponse.json({ 
        success: false, message: "รายการนี้จ่ายเงินไปแล้ว" 
      }, { status: 400 });
    }

    if (t.status !== "APPROVED") {
      return NextResponse.json({ 
        success: false, message: "รายการนี้ยังไม่อนุมัติ" 
      }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { id: t.userId } });
    if (!user) {
      return NextResponse.json({ 
        success: false, message: "ไม่พบบัญชีผู้ใช้" 
      }, { status: 404 });
    }

    // ✅ ตรวจสอบยอดอีกครั้ง
    if (user.balance < t.amount) {
      return NextResponse.json({ 
        success: false, message: "ยอดโบนัสไม่พอสำหรับการจ่ายเงินนี้" 
      }, { status: 400 });
    }

    // ✅ ใช้ transaction เพื่อความปลอดภัย: หัก balance + อัปเดตสถานะ
    await prisma.$transaction([
      prisma.user.update({
        where: { id: user.id },
        data: { balance: { decrement: t.amount } }
      }),
      prisma.transaction.update({
        where: { id: t.id },
        data: { 
          status: "PAID",
          paidAt: new Date(),
          paymentRef: paymentRef,
          adminId: auth.uid
        }
      })
    ]);

    console.log(`✅ Admin ${auth.email} จ่ายเงิน ${t.amount} ให้ user ${user.email} แล้ว`);

    return NextResponse.json({ 
      success: true, 
      message: "ยืนยันการจ่ายเงินสำเร็จ",
      data: {
        user: user.email,
        amount: t.amount,
        paymentRef: paymentRef
      }
    });

  } catch (error) {
    console.error("Withdraw payment error:", error);
    return NextResponse.json({ 
      success: false, message: "เกิดข้อผิดพลาดในระบบ" 
    }, { status: 500 });
  }
}