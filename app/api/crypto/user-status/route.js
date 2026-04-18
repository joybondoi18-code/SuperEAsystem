import { prisma } from '../../../../lib/prisma';

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const email = searchParams.get('email');
    
    if (!email) {
      return Response.json({ error: 'Missing email' }, { status: 400 });
    }
    
    const user = await prisma.user.findUnique({
      where: { email },
      select: { planExpiresAt: true, isActive: true }
    });
    
    const expired = user && user.planExpiresAt 
      ? new Date(user.planExpiresAt) < new Date() 
      : false;
    
    return Response.json({ 
      expired,
      isActive: user?.isActive,
      planExpiresAt: user?.planExpiresAt
    });
    
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}