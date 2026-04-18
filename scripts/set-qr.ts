import { prisma } from "@/lib/prisma";

async function main() {
  const orderId = process.argv[2];
  const qr = process.argv[3];

  if (!orderId || !qr) {
    console.error("❌ โปรดใช้รูปแบบ: npm run set:qr <ORDER_ID> <QR_URL>");
    process.exit(1);
  }

  const updated = await prisma.transaction.updateMany({
    where: { txHash: orderId },
    data: { qrcodeUrl: qr },
  });

  if (updated.count === 0) {
    console.log(`⚠️ ไม่พบคำสั่งซื้อที่มี orderId = ${orderId}`);
  } else {
    console.log(`✅ อัปเดต QR สำหรับ orderId = ${orderId} เรียบร้อยแล้ว`);
  }

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
