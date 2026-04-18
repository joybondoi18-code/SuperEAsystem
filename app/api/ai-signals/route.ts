import { NextResponse } from "next/server";

let lastSignals: { data: any; timestamp: number }[] = [];

export async function POST(req: Request) {
  try {
    const rawText = await req.text();
    console.log("📥 Raw JSON from EA:", rawText);

    let data;
    try {
      data = JSON.parse(rawText);
    } catch (parseErr) {
      console.error("❌ Invalid JSON:", rawText);
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const now = Date.now();
    const TEN_MINUTES = 10 * 60 * 1000;

    // เก็บข้อมูล
    lastSignals = lastSignals.filter(s => now - s.timestamp < TEN_MINUTES);
    lastSignals.unshift({ data, timestamp: now });
    lastSignals = lastSignals.slice(0, 100);

    return NextResponse.json({ status: "ok" });
  } catch (err) {
    console.error("❌ POST Error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function GET() {
  const now = Date.now();
  const TEN_MINUTES = 10 * 60 * 1000;
  const recent = lastSignals.filter(s => now - s.timestamp < TEN_MINUTES);
  return NextResponse.json({ signals: recent.map(s => s.data) });
}