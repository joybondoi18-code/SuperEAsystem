// app/crypto/metadata.js
// ไฟล์นี้ไม่มี "use client" => เป็น Server Component
export async function generateMetadata() {
  return {
    title: "Crypto Divergence Bot",
    description: "ระบบบอทเทรดอัตโนมัติ - วิเคราะห์ Divergence + EMA ด้วย AI",
  };
}