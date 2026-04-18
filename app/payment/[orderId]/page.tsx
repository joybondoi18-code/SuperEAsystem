"use client";
import Image from "next/image";
import { useEffect, useState, use } from "react"; // ← เพิ่ม use

export default function PaymentStatus({ params }: { params: Promise<{ orderId: string }> }) { // ← เปลี่ยน type เป็น Promise
  const { orderId } = use(params); // ← ใช้ use(params) แทน params โดยตรง
  const [status, setStatus] = useState<string>("pending");
  const [message, setMessage] = useState<string>("ระบบได้รับคำสั่งแล้ว กรุณาชำระเงินผ่าน Binance");
  const [qrcodeUrl, setQrcodeUrl] = useState<string | null>(null);
  const qrToShow = qrcodeUrl || process.env.NEXT_PUBLIC_DEFAULT_QR;

  useEffect(() => {
    const t = setInterval(async () => {
      const r = await fetch(`/api/payment/order-status?orderId=${orderId}`);
      if (r.ok) {
        const d = await r.json();
        setStatus(d.status);
        if (d.status === "approved") {
          setMessage("ชำระเงินสำเร็จ! ระบบได้ต่ออายุบัตชีของคุณแล้ว");
          clearInterval(t);
        } else if (d.status === "pending") {
          setMessage("ยังรอการยืนยันจาก Binance...");
        } else {
          setMessage("สถานะ: " + d.status);
        }
         if (d.qrcodeUrl) {
    setQrcodeUrl(d.qrcodeUrl);
      }
    }
    }, 2000);
    return () => clearInterval(t);
  }, [orderId]);

  return (
    <div className="max-w-lg mx-auto card">
      <h2 className="text-xl font-semibold mb-2">สถานะคำสั่งจ่าย</h2>
      <div className="text-sm text-slate-300">Order ID: <b>{orderId}</b></div>
      <div className="mt-4">
        <div className="badge">สถานะ: {status}</div>
      </div>
      <p className="mt-4">{message}</p>

       {/* ✅ แสดง QR Code Binance Pay */}
      {qrcodeUrl && (
        <div className="mt-8 space-y-3">
          {/* โลโก้ Binance */}
          <div className="flex justify-center mb-2">
          <Image
          src="https://upload.wikimedia.org/wikipedia/commons/1/12/Binance_logo.svg"
          alt="Binance Logo"
          width={140}
          height={40}
          sizes="(max-width: 768px) 100vw, 140px"
          style={{ 
          width: '100%',
          height: 'auto',
        }}
          priority={true} // สำหรับรูปที่สำคัญและโหลดช้า
          className="flex justify-center mb-2"
          />
          </div>

          <h3 className="text-lg font-semibold">สแกน QR เพื่อชำระเงินผ่าน Binance Pay</h3>
          <div className="flex justify-center">
            <Image
              src={`https://api.qrserver.com/v1/create-qr-code/?size=260x260&data=${encodeURIComponent(qrcodeUrl)}`}
              alt="Binance Pay QR"
              width={260}
              height={260}
              priority={true}
              className="rounded-lg border border-gray-700 shadow-lg"
            />
          </div>
          <p className="text-sm text-gray-400">
            โปรดใช้แอป Binance สแกน QR นี้เพื่อทำรายการชำระเงิน
          </p>
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