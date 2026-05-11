import { NextRequest, NextResponse } from 'next/server';
import webpush from 'web-push';

// ===================== โค้ด Web Push API =====================

// 1. ตั้งค่า VAPID
const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const privateKey = process.env.VAPID_PRIVATE_KEY;
const subject = process.env.VAPID_SUBJECT;

if (!publicKey || !privateKey) {
  console.error('❌ VAPID keys are not defined in .env.local');
} else {
  webpush.setVapidDetails(subject!, publicKey, privateKey);
}

// เก็บ subscriptions ชั่วคราวใน memory (ถ้า production ควรใช้ Database)
let subscriptions: any[] = [];

// ===================== GET =====================
export async function GET() {
  return NextResponse.json({ publicKey: publicKey || '' });
}

// ===================== PUT (ลงทะเบียน) =====================
export async function PUT(request: NextRequest) {
  try {
    const subscription = await request.json();
    
    // ป้องกัน subscription ซ้ำ
    const exists = subscriptions.find(s => s.endpoint === subscription.endpoint);
    if (!exists) {
      subscriptions.push(subscription);
      console.log(`✅ subscribed: ${subscription.endpoint}, total = ${subscriptions.length}`);
    }
    
    return NextResponse.json({ success: true, total: subscriptions.length });
  } catch (error) {
    console.error('PUT error:', error);
    return NextResponse.json({ error: 'subscription failed' }, { status: 500 });
  }
}

// ===================== POST (ส่ง push) =====================
export async function POST(request: NextRequest) {
  try {
    const { title, body, url } = await request.json();

    if (!title || !body) {
      return NextResponse.json({ error: 'Missing title or body' }, { status: 400 });
    }

    if (!publicKey || !privateKey) {
      return NextResponse.json({ error: 'VAPID keys missing' }, { status: 500 });
    }

    const payload = JSON.stringify({ title, body, url: url || '/' });

    const results = await Promise.allSettled(
      subscriptions.map(sub =>
        webpush.sendNotification(sub, payload).catch(err => {
          console.error('send error:', err);
          return null;
        })
      )
    );

    const successCount = results.filter(r => r.status === 'fulfilled').length;
    console.log(`📢 Push sent: ${successCount}/${subscriptions.length}`);

    return NextResponse.json({ success: true, sent: successCount, total: subscriptions.length });
  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json({ error: 'Push failed' }, { status: 500 });
  }
}