import { getAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const auth = await getAuth(); 
    if (!auth) return NextResponse.json({ user: null });
    
    const user = await prisma.user.findUnique({
      where: { id: auth.uid },
      select: {
        email: true,
        isActive: true,
        planExpiresAt: true,
        balance: true,
        referralCode: true,
        mt5Login: true,
        apiKey: true,
        eaConnectedAt: true,
      }
    });
    

    if (!user) return NextResponse.json({ user: null });

    // ✅ แก้ไข: ตรวจสอบจาก isActive และวันหมดอายุ
    const hasPaid = user.isActive === true && 
                    user.planExpiresAt !== null && 
                    user.planExpiresAt > new Date();
    
    let daysLeft = null;
    let showAlert = false;
    
    // แสดงแจ้งเตือนเฉพาะผู้ที่ยังไม่ได้จ่ายเงิน (hasPaid = false)
    if (!hasPaid && user.planExpiresAt) {
      const diff = user.planExpiresAt.getTime() - Date.now();
      daysLeft = Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
      showAlert = daysLeft <= 3;
    }

    // ✅ คำนวณสถิติการแนะนำ
    // 1. นับจำนวนคนที่สมัครผ่านลิงก์เรา
    const referredUsers = await prisma.user.findMany({
      where: { referredBy: user.referralCode },
      select: { id: true }
    });
    const totalReferred = referredUsers.length;

    // 2. คำนวณยอดโบนัสที่ได้รับจริงแล้ว (จาก Transaction type="bonus")
    // ✅ แก้ไข: เปลี่ยน "approved" เป็น "APPROVED" (ตัวพิมพ์ใหญ่)
    const bonusTransactions = await prisma.transaction.findMany({
      where: { 
        userId: auth.uid,
        type: "bonus",
        status: "APPROVED"   // ← แก้ตรงนี้
      }
    });
    const earnedBonus = bonusTransactions.reduce((sum, t) => sum + t.amount, 0);
    
    // 3. คำนวณยอดที่คาดว่าจะได้รับ (โบนัส $5 ต่อคน)
    const BONUS_PER_PERSON = 5;
    const expectedBonus = totalReferred * BONUS_PER_PERSON;

    return NextResponse.json({ 
      user: {
        email: user.email,
        isActive: user.isActive,
        planExpiresAt: user.planExpiresAt,
        balance: user.balance,
        daysLeft,
        referralCode: user.referralCode,
        hasPaid,
        showAlert,
        mt5Login: user.mt5Login,
        apiKey: user.apiKey,
        eaConnectedAt: user.eaConnectedAt,
        referralStats: {
          totalReferred,
          expectedBonus,
          earnedBonus,
        }
      }
    });

  } catch (error) {
    console.error('API Error in /api/users/me:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      user: null 
    }, { status: 500 });
  }
}