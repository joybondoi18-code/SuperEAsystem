import { NextResponse } from "next/server";
import { verifyBinanceWebhookSignature } from "@/lib/payment/binance";

export async function POST(req: Request) {
  const bodyText = await req.text();
  const ok = await verifyBinanceWebhookSignature(req.headers, bodyText);
  if (!ok) return NextResponse.json({ error: "invalid signature" }, { status: 400 });
  // TODO: parse event, map to user/order, mark transaction approved
  return NextResponse.json({ received: true });
}
