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
  console.log("Stopped for", expired.length, "users");
  process.exit(0);
})();