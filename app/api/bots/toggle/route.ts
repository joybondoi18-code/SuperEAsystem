import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { broadcastControl } from "@/lib/bus";

export async function POST() {
  let settings = await prisma.botSetting.findFirst();
  if (!settings) settings = await prisma.botSetting.create({ data: {} });
  const upd = await prisma.botSetting.update({ where: { id: settings.id }, data: { isRunning: !settings.isRunning, lastToggle: new Date() } });
  await broadcastControl({ type: "TOGGLE_ALL", isRunning: upd.isRunning, at: Date.now() });
  return NextResponse.json({ isRunning: upd.isRunning });
}
