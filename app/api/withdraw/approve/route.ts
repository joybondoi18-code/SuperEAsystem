import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getAuth } from "@/lib/auth";

export async function POST(req: Request) {
  const auth = await getAuth();
  if (!auth || auth.role !== "ADMIN") {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const { id } = await req.json();
  
  // ✅ ตรวจสอบคำขอถอน
  const t = await prisma.transaction.findUnique({ where: { id } });
  
  if (!t || t.type !== "withdraw" || t.status !== "PENDING") {
    return NextResponse.json(
      { success: false, message: "ไม่พบคำขอถอนที่รออนุมัติ" }, 
      { status: 404 }
    );
  }
  
  // ✅ ตรวจสอบยอดโบนัสอีกครั้ง (เผื่อ admin อนุมัติช้า)
  const u = await prisma.user.findUnique({ where: { id: t.userId } });
  if (!u || u.balance < t.amount) {
    return NextResponse.json(
      { success: false, message: "ยอดโบนัสไม่พอสำหรับการถอนนี้" },
      { status: 400 }
    );
  }

  // ✅ อนุมัติ: เปลี่ยน status เป็น APPROVED เท่านั้น (ยังไม่หัก balance)
  await prisma.transaction.update({
    where: { id: t.id },
    data: { 
      status: "APPROVED",
      approvedAt: new Date(),
      adminId: auth.uid  // บันทึกว่า admin คนไหนอนุมัติ
    }
  });

  return NextResponse.json({ 
    success: true, 
    message: "อนุมัติถอนแล้ว รอการโอนเงินจริง" 
  });
}