import { prisma } from '../../../../lib/prisma';

export async function POST(req) {
  try {
    const { email } = await req.json();
    
    if (!email) {
      return Response.json({ valid: false }, { status: 400 });
    }
    
    // ตรวจสอบอีเมลใน Database ของ Crypto Bot
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, isActive: true }
    });
    
    // อีเมลถูกต้องถ้ามีในระบบและยัง active
    const valid = user && user.isActive === true;
    
    return Response.json({ valid });
    
  } catch (error) {
    console.error('Verify email error:', error);
    return Response.json({ valid: false }, { status: 500 });
  }
}