// app/api/cron/check-payments/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyUSDTTransfer } from "@/lib/tron/check-payment";

const MY_USDT_ADDRESS = "TKGucdubahmptjs4BeeAyWjFzxShVGSAq4";
const DAYS = 30;

export async function GET(req: Request) {
  // Debug log
  console.log("CRON_SECRET:", process.env.CRON_SECRET);
  console.log("Auth header:", req.headers.get("authorization"));
  
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  
  try {
    const pendingTxs = await prisma.transaction.findMany({
      where: {
        status: "pending",
        method: "binance",
      },
    });
    
    console.log(`🔍 Checking ${pendingTxs.length} pending transactions...`);
    
    const results = [];
    
    for (const tx of pendingTxs) {
      const verification = await verifyUSDTTransfer(
        MY_USDT_ADDRESS,
        tx.txHash,
        tx.amount,
        30
      );
      
      if (verification.success) {
        console.log(`✅ Payment verified for order: ${tx.txHash}, txId: ${verification.txId}`);
        
        await prisma.transaction.update({
          where: { id: tx.id },
          data: {
            status: "approved",
            txHashReal: verification.txId,
          },
        });
        
        const user = await prisma.user.findUnique({
          where: { id: tx.userId },
        });
        
        if (user) {
          const currentExpiry = user.planExpiresAt ? new Date(user.planExpiresAt) : new Date();
          const newExpiry = new Date(Math.max(currentExpiry.getTime(), Date.now()) + DAYS * 24 * 60 * 60 * 1000);
          
          await prisma.user.update({
            where: { id: tx.userId },
            data: {
              planExpiresAt: newExpiry,
              isActive: true,
              packageType: tx.packageType,
            },
          });
          
          console.log(`✅ User ${user.email} upgraded until ${newExpiry.toISOString()}`);
        }
        
        results.push({ orderId: tx.txHash, status: "approved" });
      }
    }
    
    return NextResponse.json({
      success: true,
      checked: pendingTxs.length,
      approved: results.length,
      results,
    });
    
  } catch (error) {
    console.error("❌ Cron check error:", error);
    return NextResponse.json({ error: "internal server error" }, { status: 500 });
  }
}