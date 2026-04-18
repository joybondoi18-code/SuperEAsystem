// สร้างไฟล์ scripts/update-user-role.ts
import { prisma } from "@/lib/prisma";

async function main() {
  const user = await prisma.user.update({
    where: { 
      email: "joyffffgt33@gmail.com" // หรือใช้ id: "cmgi5x23u0000bf2z8hbz7qhd"
    },
    data: {
      role: "ADMIN"
    }
  });
  
  console.log("✅ User role updated to ADMIN:", user.email);
  process.exit(0);
}

main().catch(e => {
  console.error("❌ Error:", e);
  process.exit(1);
});