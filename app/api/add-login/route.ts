import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';  // <- ปรับ path ตามไฟล์ db ของคุณ

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { login, ib_id } = body;

    if (!login || !ib_id) {
      return NextResponse.json(
        { success: false, error: 'Missing login or ib_id' },
        { status: 400 }
      );
    }

    const VALID_IB_ID = process.env.IB_ID || 'A1310540';
    if (ib_id !== VALID_IB_ID) {
      return NextResponse.json(
        { success: false, error: 'Invalid IB ID' },
        { status: 403 }
      );
    }

    const result = await query(
      `INSERT INTO users (mt5_login, ib_id, status, source, created_at)
       VALUES ($1, $2, 'active', 'email', NOW())
       ON CONFLICT (mt5_login) 
       DO UPDATE SET 
         ib_id = EXCLUDED.ib_id,
         status = 'active',
         updated_at = NOW()`,
      [login, ib_id]
    );

    return NextResponse.json({
      success: true,
      message: `Login ${login} added successfully`,
      login: login
    });

  } catch (error) {
    console.error('Add login error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}