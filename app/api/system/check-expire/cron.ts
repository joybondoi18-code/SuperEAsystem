import { prisma } from "@/lib/prisma";

(async () => {
  const now = new Date();
  const expired = await prisma.user.findMany({ 
    where: { planExpiresAt: { lte: now }, isActive: true } 
  });
  
  for (const u of expired) {
    await prisma.user.update({ 
      where: { id: u.id }, 
      data: { 
        isActive: false,
        apiKey: null,      // ✅ เพิ่ม
      } 
    });
  }
  console.log(`✅ ปิด ${expired.length} บัญชีที่หมดอายุ`);
  process.exit(0);
})();