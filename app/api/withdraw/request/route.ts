import { getAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const auth = await getAuth();
  if (!auth)
    return NextResponse.json({ success: false, message: "not auth" }, { status: 401 });

  if (auth.role !== "ADMIN") {
    console.log(`❌ USER ${auth.email} tried to access withdraw/request`);
    return NextResponse.json(
      { success: false, message: "forbidden: admin only" },
      { status: 403 }
    );
  }

  const { amount, method, accountInfo, userId } = await req.json();
  
  if (!userId) {
    return NextResponse.json(
      { success: false, message: "ต้องระบุ userId" },
      { status: 400 }
    );
  }

  const targetUser = await prisma.user.findUnique({ 
    where: { id: userId } 
  });
  
  if (!targetUser) {
    return NextResponse.json(
      { success: false, message: "ไม่พบ user" },
      { status: 404 }
    );
  }

  // ✅ แก้ไข: balance คือยอดโบนัสทั้งหมด (ไม่มีเงินฝาก)
  if (amount <= 0 || amount > targetUser.balance) {
    return NextResponse.json(
      { success: false, message: "จำนวนไม่ถูกต้องหรือยอดโบนัสไม่พอ" },
      { status: 400 }
    );
  }

  // ✅ เพิ่ม: ตรวจสอบ limit การถอนต่อวัน
  const todayWithdrawals = await prisma.transaction.aggregate({
    where: {
      userId: targetUser.id,
      type: "withdraw",
      status: { in: ["PENDING", "APPROVED", "PAID"] },
      createdAt: { gte: new Date(new Date().setHours(0, 0, 0)) }
    },
    _sum: { amount: true }
  });

  const DAILY_WITHDRAW_LIMIT = 5000; // ปรับตามที่ต้องการ
  const currentWithdrawn = todayWithdrawals._sum.amount || 0;
  
  if (currentWithdrawn + amount > DAILY_WITHDRAW_LIMIT) {
    return NextResponse.json({
      success: false,
      message: `วันนี้ถอนไปแล้ว ${currentWithdrawn} บาท, ถอนได้อีกไม่เกิน ${DAILY_WITHDRAW_LIMIT - currentWithdrawn} บาท`
    }, { status: 400 });
  }

  // ✅ สร้างคำขอถอน (ยังไม่หัก balance)
  await prisma.transaction.create({
    data: {
      userId: targetUser.id,
      adminId: auth.uid,
      type: "withdraw",
      amount,
      method: method || "bank",
      accountInfo: accountInfo || "",
      status: "PENDING",  // ใช้ enum PENDING
    },
  });

  return NextResponse.json({ 
    success: true, 
    message: "สร้างคำขอถอนแล้ว รอแอดมินอนุมัติ",
    data: {
      forUser: targetUser.email,
      amount,
      requestedBy: auth.email
    }
  });
}