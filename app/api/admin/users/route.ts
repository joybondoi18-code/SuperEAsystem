import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getAuth } from "@/lib/auth";

export async function GET() {
  const auth = await getAuth();
  if (!auth || auth.role !== "ADMIN") return NextResponse.json({ error: "forbidden" }, { status: 403 });
  const users = await prisma.user.findMany({ orderBy: { createdAt: "desc" } });
  return NextResponse.json({ users });
}
