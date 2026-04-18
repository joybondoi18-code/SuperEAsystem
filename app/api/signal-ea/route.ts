// app/api/signal-ea/route.ts
import { NextResponse } from 'next/server';
import { Pool } from 'pg';

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

export async function POST(request: Request) {
    try {
        const { login, broker, action, symbol, volume } = await request.json();

        // 1. ตรวจสอบว่า login อยู่ในฐานข้อมูลไหม (ผ่าน IB หรือยัง)
        const result = await pool.query(
            'SELECT * FROM ib_clients_new WHERE login = $1 AND broker = $2',
            [login, broker || 'xm']
        );

        const isVerified = result.rows.length > 0;

        // 2. ถ้าไม่ผ่านการตรวจสอบ → ปฏิเสธคำสั่งทั้งหมด
        if (!isVerified) {
            return NextResponse.json({
                success: false,
                error: '❌ Login นี้ไม่ได้สมัครผ่านลิงค์เรา ไม่สามารถใช้ EA ได้',
                code: 'UNAUTHORIZED'
            });
        }

        // 3. ถ้าผ่านการตรวจสอบ → อนุญาตให้เปิดออเดอร์
        // (EA จะเป็นคนจัดการเปิดออเดอร์จริงๆ)
        return NextResponse.json({
            success: true,
            message: '✅ ตรวจสอบผ่าน สามารถเปิดออเดอร์ได้',
            verified: true,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('Signal EA error:', error);
        return NextResponse.json({
            success: false,
            error: 'เกิดข้อผิดพลาดในระบบ',
            code: 'SERVER_ERROR'
        });
    }
}