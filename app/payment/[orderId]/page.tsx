"use client";
import Image from "next/image";
import { useEffect, useState, use } from "react";

export default function PaymentStatus({ params }: { params: Promise<{ orderId: string }> }) {
  const { orderId } = use(params);
  const [status, setStatus] = useState<string>("pending");
  const [message, setMessage] = useState<string>("ระบบได้รับคำสั่งแล้ว กรุณาชำระเงิน");
  const [amount, setAmount] = useState<number>(0);

  // ✅ Wallet Address ของคุณ (จาก Binance Funding Wallet)
  const MY_USDT_ADDRESS = "TKGucdubahmptjs4BeeAyWjFzxShVGSAq4";
  const NETWORK = "TRC20";

  useEffect(() => {
    const t = setInterval(async () => {
      const r = await fetch(`/api/payment/order-status?orderId=${orderId}`);
      if (r.ok) {
        const d = await r.json();
        setStatus(d.status);
        setAmount(d.amount || 0);
        if (d.status === "approved") {
          setMessage("ชำระเงินสำเร็จ! ระบบได้ต่ออายุบอทของคุณแล้ว");
          clearInterval(t);
        } else if (d.status === "pending") {
          setMessage("ยังรอการชำระเงิน...");
        } else {
          setMessage("สถานะ: " + d.status);
        }
      }
    }, 2000);
    return () => clearInterval(t);
  }, [orderId]);

  // ✅ สร้าง QR Code จาก Wallet Address จริง
  const qrData = `${MY_USDT_ADDRESS}?amount=${amount}&memo=${orderId}`;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=260x260&data=${encodeURIComponent(qrData)}`;

  return (
    <div className="max-w-lg mx-auto card">
      <h2 className="text-xl font-semibold mb-2">สถานะคำสั่งจ่าย</h2>
      <div className="text-sm text-slate-300">Order ID: <b>{orderId}</b></div>
      <div className="mt-4">
        <div className="badge">สถานะ: {status}</div>
      </div>
      <p className="mt-4">{message}</p>

      {/* ✅ แสดง QR Code สำหรับโอนเงิน (ใช้ Wallet จริง) */}
      {status !== "approved" && (
        <div className="mt-8 space-y-3">
          <div className="flex justify-center mb-2">
            <Image
              src="https://upload.wikimedia.org/wikipedia/commons/1/12/Binance_logo.svg"
              alt="Binance Logo"
              width={140}
              height={40}
              priority={true}
              className="flex justify-center mb-2"
            />
          </div>

          <h3 className="text-lg font-semibold">สแกน QR เพื่อโอนเงิน USDT</h3>
          
          <div className="flex justify-center bg-white p-4 rounded-xl">
            <Image
              src={qrCodeUrl}
              alt="Payment QR Code"
              width={260}
              height={260}
              priority={true}
              className="rounded-lg"
            />
          </div>

          {/* คำแนะนำการโอนเงิน */}
          <div className="bg-gray-800 p-4 rounded-lg text-left text-sm space-y-2">
            <p className="font-semibold text-yellow-400">⚠️ วิธีโอนเงิน:</p>
            <p>1. เปิดแอป Binance → Wallet → Funding</p>
            <p>2. กด Send → สแกน QR ด้านบน</p>
            <p>3. ตรวจสอบ Address: <br/><code className="text-xs break-all">{MY_USDT_ADDRESS}</code></p>
            <p>4. เครือข่าย: <b className="text-green-400">{NETWORK}</b></p>
            <p>5. จำนวน: <b className="text-yellow-400">{amount} USDT</b></p>
            <p className="text-red-400 font-bold">⚠️ สำคัญ: ใส่รหัส <b>{orderId}</b> ในช่อง Memo/หมายเหตุ</p>
            <p className="text-green-400">✅ โอนสำเร็จ ระบบอัปเกรดสิทธิ์อัตโนมัติภายใน 1-2 นาที</p>
          </div>
        </div>
      )}

      <div className="mt-8">
        <a
          className="btn bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2 rounded-xl"
          href="/dashboard"
        >
          กลับสู่ Dashboard
        </a>
      </div>
    </div>
  );
}