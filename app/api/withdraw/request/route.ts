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

  if (amount <= 0 || amount > targetUser.balance) {
    return NextResponse.json(
      { success: false, message: "จำนวนไม่ถูกต้องหรือยอดไม่พอ" },
      { status: 400 }
    );
  }

  await prisma.transaction.create({
    data: {
      userId: targetUser.id,
      adminId: auth.uid,  // ✅ ใช้ได้ปกติแล้ว
      type: "withdraw",
      amount,
      method: method || "bank",
      accountInfo: accountInfo || "",
      status: "pending",
    },
  });

  return NextResponse.json({ 
    success: true, 
    message: "สร้างคำขอถอนแล้ว",
    data: {
      forUser: targetUser.email,
      amount,
      approvedBy: auth.email
    }
  });
}