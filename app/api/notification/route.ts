import { NextRequest, NextResponse } from 'next/server'

// เก็บ notification ล่าสุด (memory)
let latestNotification: { type: string; message: string; timestamp: number } | null = null

// POST: admin ส่ง PRE หรือ ENTRY
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { type, message } = body

    if (!type || !message) {
      return NextResponse.json(
        { error: 'ต้องระบุ type และ message' },
        { status: 400 }
      )
    }

    if (type !== 'pre' && type !== 'entry') {
      return NextResponse.json(
        { error: 'type ต้องเป็น pre หรือ entry เท่านั้น' },
        { status: 400 }
      )
    }

    // เก็บไว้ใน memory
    latestNotification = {
      type,
      message,
      timestamp: Date.now()
    }

    console.log(`📡 ${type === 'pre' ? '⚠️ PRE SIGNAL' : '📢 ENTRY SIGNAL'}: ${message}`)

    // ========== ✅ เพิ่ม Web Push แจ้งเตือนมือถือ ==========
    const title = type === 'pre' ? '⚠️ PRE SIGNAL' : '📢 ENTRY SIGNAL'
    const pushPayload = {
      title,
      body: message,
      url: '/dashboard'
    }

    // เรียก Web Push API (แบบ internal fetch)
    const protocol = process.env.NODE_ENV === 'development' ? 'http' : 'https'
    const host = process.env.NEXT_PUBLIC_APP_URL || `${protocol}://localhost:3000`
    
    fetch(`${host}/api/push`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(pushPayload)
    }).catch(err => console.error('Web Push error:', err))
    // =================================================

    return NextResponse.json({ 
      success: true, 
      signal: latestNotification 
    })
  } catch (error) {
    console.error(error)
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดใน server' },
      { status: 500 }
    )
  }
}

// GET: ดึง notification ล่าสุด
export async function GET() {
  return NextResponse.json({ latestSignal: latestNotification })
}