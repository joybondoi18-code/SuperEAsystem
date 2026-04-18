import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
export async function GET() {
  let settings = await prisma.botSetting.findFirst();
  if (!settings) settings = await prisma.botSetting.create({ data: {} });
  return NextResponse.json({ isRunning: settings.isRunning });
}
