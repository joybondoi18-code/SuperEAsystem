import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getAuth } from "@/lib/auth";
import { withdrawToUser } from "@/lib/binance/withdraw";

// ✅ GET: ดูรายการถอนเงิน (เดิม)
export async function GET() {
  const auth = await getAuth();
  if (!auth || auth.role !== "ADMIN") {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  
  const withdraws = await prisma.transaction.findMany({ 
    where: { type: "withdraw" }, 
    orderBy: { createdAt: "desc" } 
  });
  
  return NextResponse.json({ withdraws });
}

// ✅ POST: อนุมัติการถอนเงิน (เพิ่มใหม่)
export async function POST(req: Request) {
  const auth = await getAuth();
  if (!auth || auth.role !== "ADMIN") {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  try {
    const { withdrawId } = await req.json();
    
    if (!withdrawId) {
      return NextResponse.json({ error: "withdrawId required" }, { status: 400 });
    }

    // ดึงข้อมูลการถอน
    const withdraw = await prisma.transaction.findUnique({
      where: { id: withdrawId, type: "withdraw" }
    });

    if (!withdraw) {
      return NextResponse.json({ error: "Withdraw not found" }, { status: 404 });
    }

    if (withdraw.status !== "pending") {
      return NextResponse.json({ error: "Withdraw already processed" }, { status: 400 });
    }

    // 💸 ถอนเงิน (Mock หรือ Real)
    const result = await withdrawToUser(
      withdraw.accountInfo || withdraw.paymentRef || withdraw.userId,
      withdraw.amount
    );

    if (result.success) {
      // อัปเดตสถานะเป็น approved
      await prisma.transaction.update({
        where: { id: withdrawId },
        data: {
          status: "approved",
          paymentRef: result.txId,
          approvedAt: new Date(),
          adminId: auth.uid,
        }
      });

      // หักเงินจาก balance ของ user
      await prisma.user.update({
        where: { id: withdraw.userId },
        data: { balance: { decrement: withdraw.amount } }
      });

      return NextResponse.json({ 
        success: true, 
        message: result.message || "Withdraw approved successfully",
        txId: result.txId 
      });
    } else {
      return NextResponse.json({ 
        success: false, 
        error: result.message || "Withdraw failed" 
      }, { status: 500 });
    }

  } catch (error: any) {
    console.error("Withdraw approval error:", error);
    return NextResponse.json({ 
      error: error.message || "Internal server error" 
    }, { status: 500 });
  }
}