import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { assertBotKey } from "@/lib/botGuard";

export async function GET(req: Request) {
  if (!assertBotKey(req.headers)) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  const settings = await prisma.botSetting.findFirst();
  const users = await prisma.user.findMany({ select: { id: true, email: true, isActive: true, planExpiresAt: true } });
  return NextResponse.json({ isRunning: settings?.isRunning ?? false, users, ts: Date.now() });
}
