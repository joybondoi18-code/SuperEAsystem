import { NextResponse } from "next/server";
import { getAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const auth = await getAuth();
    if (!auth) {
      return NextResponse.json({ error: "not auth" }, { status: 401 });
    }
    
    const admin = await prisma.user.findUnique({ 
      where: { id: auth.uid },
      select: { role: true }
    });
    
    if (!admin || admin.role !== "ADMIN") {
      return NextResponse.json({ error: "unauthorized" }, { status: 403 });
    }

    const transactions = await prisma.transaction.findMany({
      where: {
        type: "upgrade",
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 100,
    });

    // ✅ ส่ง array เสมอ
    return NextResponse.json(transactions);
    
  } catch (error) {
    console.error("Admin transactions error:", error);
    return NextResponse.json([]); // ส่ง array ว่างถ้า error
  }
} 