import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

// POST: บันทึกออเดอร์ (Admin เรียกตอนส่งสำเร็จ) — ไม่แก้
export async function POST(request: NextRequest) {
  try {
    const { symbol, side, sl, tp } = await request.json();

    if (!symbol || !side || !sl || !tp) {
      return NextResponse.json(
        { error: 'กรุณากรอกข้อมูลให้ครบ' },
        { status: 400 }
      );
    }

    const result = await query(
      `INSERT INTO "OrderHistory" (symbol, side, sl, tp, "createdAt", "showAt")
       VALUES ($1, $2, $3, $4, 
         (NOW() AT TIME ZONE 'Asia/Bangkok'), 
         (NOW() AT TIME ZONE 'Asia/Bangkok') + INTERVAL '10 minute')
       RETURNING *`,
      [symbol, side, sl, tp]
    );

    return NextResponse.json({ success: true, order: result.rows[0] });
  } catch (error: any) {
    console.error('บันทึกประวัติผิดพลาด:', error);
    return NextResponse.json(
      { error: error.message || 'เกิดข้อผิดพลาดในการบันทึก' },
      { status: 500 }
    );
  }
}

// ✅ GET: รองรับ limit parameter (Dashboard ใช้ ?limit=5)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = searchParams.get('limit');

    let sql = `SELECT id, symbol, side, sl, tp, "createdAt", "showAt"
               FROM "OrderHistory"
               WHERE "showAt" <= (NOW() AT TIME ZONE 'Asia/Bangkok')
               ORDER BY "createdAt" DESC`;

    if (limit && !isNaN(Number(limit))) {
      sql += ` LIMIT ${Number(limit)}`;
    }

    const result = await query(sql);
    return NextResponse.json({ history: result.rows });
  } catch (error: any) {
    console.error('ดึงประวัติผิดพลาด:', error);
    return NextResponse.json(
      { error: error.message || 'เกิดข้อผิดพลาดในการดึงข้อมูล' },
      { status: 500 }
    );
  }
}