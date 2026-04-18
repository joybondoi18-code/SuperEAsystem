import { NextResponse } from 'next/server';
import { query } from '@/lib/db';  // <- ปรับ path ตามไฟล์ db ของคุณ

export async function GET() {
  try {
    const result = await query(
      'SELECT * FROM users ORDER BY created_at DESC LIMIT 50'
    );

    return NextResponse.json({
      success: true,
      data: result.rows
    });

  } catch (error) {
    console.error('Get logins error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch' },
      { status: 500 }
    );
  }
}