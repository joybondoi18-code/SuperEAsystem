import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getAuth } from "@/lib/auth";

export async function GET() {
  const auth = await getAuth();
  if (!auth || auth.role !== "ADMIN") {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  
  try {
    const withdraws = await prisma.transaction.findMany({ 
      where: { type: "withdraw" },
      include: { 
        user: { 
          select: { 
            email: true,
            id: true
          } 
        } 
      },
      orderBy: { createdAt: "desc" } 
    });
    
    return NextResponse.json({ withdraws });
    
  } catch (error) {
    console.error("Error fetching withdraws:", error);
    return NextResponse.json({ 
      error: "Internal server error" 
    }, { status: 500 });
  }
}