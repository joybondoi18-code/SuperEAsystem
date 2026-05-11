"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

type PackageType = "STANDARD" | "PREMIUM";

export default function SelectPackagePage() {
  const router = useRouter();
  const [selectedPackage, setSelectedPackage] = useState<PackageType>("STANDARD");
  const [loading, setLoading] = useState(false);

  const prices = {
    STANDARD: 20,
    PREMIUM: 59,
  };

  const handleContinue = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/payment/create-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          method: "binance",
          amount: prices[selectedPackage],
          packageType: selectedPackage,
        }),
      });

      const data = await res.json();
      if (res.ok && data.intent?.orderId) {
        // ✅ แก้ตรงนี้: จาก /payment/... เป็น /payment-status/...
        router.push(`/payment/${data.intent.orderId}`); // ✅
      } else {
        alert("เกิดข้อผิดพลาด กรุณาลองใหม่");
      }
    } catch (error) {
      console.error("Create order error:", error);
      alert("เกิดข้อผิดพลาด กรุณาลองใหม่");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">เลือกแพ็กเกจ</h1>

      <div className="space-y-4 mb-8">
        {/* Standard Package */}
        <label
          className={`block p-4 border rounded-xl cursor-pointer transition ${
            selectedPackage === "STANDARD"
              ? "border-emerald-500 bg-emerald-500/10"
              : "border-gray-700 hover:border-gray-500"
          }`}
        >
          <input
            type="radio"
            name="package"
            value="STANDARD"
            checked={selectedPackage === "STANDARD"}
            onChange={() => setSelectedPackage("STANDARD")}
            className="mr-3"
          />
          <div className="inline-block">
            <div className="font-semibold text-lg">
              Standard · ${prices.STANDARD}/เดือน
            </div>
            <div className="text-sm text-gray-400">
              เช่า VPS เอง · ติดตั้ง EA เอง · รับสัญญาณเทรด
            </div>
          </div>
        </label>

        {/* Premium Package - ช้อนไว้ให้กลับมาใช้ทีหลัง */}
        {/* 
        <label
          className={`block p-4 border rounded-xl cursor-pointer transition ${
            selectedPackage === "PREMIUM"
              ? "border-emerald-500 bg-emerald-500/10"
              : "border-gray-700 hover:border-gray-500"
          }`}
        >
          <input
            type="radio"
            name="package"
            value="PREMIUM"
            checked={selectedPackage === "PREMIUM"}
            onChange={() => setSelectedPackage("PREMIUM")}
            className="mr-3"
          />
          <div className="inline-block">
            <div className="font-semibold text-lg">
              Premium · ${prices.PREMIUM}/เดือน
            </div>
            <div className="text-sm text-gray-400">
              รวมค่า VPS · พร้อมใช้งานทันที · Support จัดการให้
            </div>
          </div>
        </label>
        */}
      </div>

      <button
        onClick={handleContinue}
        disabled={loading}
        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-xl font-semibold transition disabled:opacity-50"
      >
        {loading ? "กำลังดำเนินการ..." : "ดำเนินการชำระเงิน"}
      </button>
    </div>
  );
}