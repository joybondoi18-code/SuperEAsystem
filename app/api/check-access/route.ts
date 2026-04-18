import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';  // <- ปรับ path ตามไฟล์ db ของคุณ

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const login = searchParams.get('login');

    if (!login) {
      return NextResponse.json(
        { allowed: false, error: 'Missing login' },
        { status: 400 }
      );
    }

    const result = await query(
      'SELECT * FROM users WHERE mt5_login = $1 AND status = $2',
      [login, 'active']
    );

    const hasAccess = result.rows.length > 0;

    if (hasAccess) {
      const user = result.rows[0];
      return NextResponse.json({
        allowed: true,
        login: login,
        ib_id: user.ib_id,
        message: 'Access granted'
      });
    } else {
      return NextResponse.json({
        allowed: false,
        login: login,
        message: 'Access denied - Login not found or inactive'
      });
    }

  } catch (error) {
    console.error('Check access error:', error);
    return NextResponse.json(
      { allowed: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}