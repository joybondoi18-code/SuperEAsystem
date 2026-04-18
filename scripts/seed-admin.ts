import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

async function main() {
  const email = process.env.ADMIN_EMAIL || "admin@local";
  const password = process.env.ADMIN_PASSWORD || "Admin#12345";

  const exists = await prisma.user.findUnique({ where: { email } });
  if (exists) {
    if (exists.role !== "ADMIN") await prisma.user.update({ where: { id: exists.id }, data: { role: "ADMIN" } });
    console.log("Admin exists:", email); process.exit(0);
  }
  const hashed = await bcrypt.hash(password, 10);
  const code = "ADMIN" + Math.random().toString(36).substring(2,8).toUpperCase();
  await prisma.user.create({ data: { email, password: hashed, role: "ADMIN", referralCode: code, isActive: true } });
  console.log("Admin created:", email); process.exit(0);
}
main().catch(e=>{ console.error(e); process.exit(1); });
