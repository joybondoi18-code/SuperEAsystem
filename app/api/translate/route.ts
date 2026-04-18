import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const response = await fetch(
      "https://translate-pa.googleapis.com/v1/translateHtml",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.GOOGLE_API_KEY}`, // ใช้ key ของคุณ
        },
        body: JSON.stringify(body),
      }
    );

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Translate API error:", error);
    return NextResponse.json({ error: "Translation failed" }, { status: 500 });
  }
}
