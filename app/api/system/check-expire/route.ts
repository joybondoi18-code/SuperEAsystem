import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const now = new Date();
  const expired = await prisma.user.findMany({ 
    where: { planExpiresAt: { lte: now }, isActive: true } 
  });
  
  for (const u of expired) {
    await prisma.user.update({ 
      where: { id: u.id }, 
      data: { 
        isActive: false,
        apiKey: null,      // ✅ เพิ่ม
      } 
    });
  }
  return NextResponse.json({ stopped: expired.length });
}