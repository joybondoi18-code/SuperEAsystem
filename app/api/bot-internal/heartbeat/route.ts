import { NextResponse } from "next/server";
import { assertBotKey } from "@/lib/botGuard";
export async function POST(req: Request) {
  if (!assertBotKey(req.headers)) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  return NextResponse.json({ ok: true, ts: Date.now() });
}
