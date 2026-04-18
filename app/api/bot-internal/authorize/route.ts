import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { assertBotKey } from "@/lib/botGuard";

export async function POST(req: Request) {
  if (!assertBotKey(req.headers)) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  const { userId } = await req.json();
  const settings = await prisma.botSetting.findFirst();
  if (!settings?.isRunning) return NextResponse.json({ allowed: false, reason: "system_stopped" });
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return NextResponse.json({ allowed: false, reason: "user_not_found" });
  if (!user.isActive) return NextResponse.json({ allowed: false, reason: "inactive" });
  if (user.planExpiresAt && user.planExpiresAt.getTime() < Date.now()) return NextResponse.json({ allowed: false, reason: "expired" });
  return NextResponse.json({ allowed: true });
}
