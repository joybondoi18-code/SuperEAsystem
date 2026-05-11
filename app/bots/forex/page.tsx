"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type User = {
  email: string;
  mt5Login: string | null;
  apiKey: string | null;
  eaConnectedAt: string | null;
  isActive: boolean;
  planExpiresAt: string | null;
};

export default function ForexPage() {
  const router = useRouter();
  const [me, setMe] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const [isDuplicate, setIsDuplicate] = useState(false);
  const [checking, setChecking] = useState(false);
  const [mt5LoginValue, setMt5LoginValue] = useState("");

  // ✅ ฟังก์ชันตรวจสอบ (ต้องอยู่ตรงนี้ ก่อน useEffect และ ก่อน return)
  const checkMt5Login = async (value: string) => {
    setMt5LoginValue(value);
    if (!value || value.length < 3) {
      setIsDuplicate(false);
      return;
    }
    
    setChecking(true);
    try {
      const res = await fetch(`/api/check-mt5-login?mt5Login=${value}`);
      const data = await res.json();
      setIsDuplicate(data.exists);
    } catch (error) {
      setIsDuplicate(false);
    } finally {
      setChecking(false);
    }
  };


  useEffect(() => {
    fetch("/api/users/me")
      .then((res) => res.json())
      .then((data) => {
        setMe(data.user);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">กำลังโหลด...</div>
      </div>
    );
  }

  if (!me) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">กรุณา Login ก่อน</div>
      </div>
    );
  }

  // ✅ ตรวจสอบสถานะหมดอายุ
  const isExpired = !me.isActive || (me.planExpiresAt && new Date(me.planExpiresAt) < new Date());

  return (
  <div className="max-w-2xl mx-auto p-6">
    {/* Header พร้อมปุ่มประวัติ */}
    <div className="flex justify-between items-center mb-6">
      <h1 className="text-2xl font-bold">🤖 Forex Bot</h1>
      <button
        onClick={() => router.push('/bots/forex/history')}
        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition"
      >
        📜 ประวัติการส่งสัญญาณ
      </button>
    </div>

      {/* ✅ กรณีหมดอายุ */}
      {isExpired ? (
        <div className="card text-center">
          <div className="bg-red-900/50 p-4 rounded-lg mb-4">
            <p className="text-red-400">❌ สมาชิกของคุณหมดอายุแล้ว</p>
            <p className="text-gray-400 mt-2">กรุณาต่ออายุสมาชิกเพื่อใช้งาน EA</p>
          </div>
          <button
            onClick={() => window.location.href = "/payment/select"}
            className="btn bg-green-600 w-full"
          >
            ⚠️ สิทธิ์หมดอายุแล้ว กรุณาอัปเกรดสมาชิก
          </button>
        </div>
      ) : me.mt5Login ? (
        // ✅ กรณีเชื่อมต่อ EA แล้ว (มี mt5Login และยังไม่หมดอายุ)
        <div className="card space-y-4">
          <div className="bg-green-900/30 p-3 rounded-lg">
            <p className="text-green-400">✅ เชื่อมต่อ EA แล้ว</p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">MT5 Login ที่ลงทะเบียน</label>
            <input readOnly value={me.mt5Login} className="w-full bg-gray-700 p-2 rounded" />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">API Key (ใส่ใน EA)</label>
            <div className="flex gap-2">
              <input readOnly value={me.apiKey || "-"} className="flex-1 bg-gray-700 p-2 rounded" />
              {me.apiKey && (
                <button
                  onClick={() => navigator.clipboard.writeText(me.apiKey!)}
                  className="btn"
                >
                  📋 คัดลอก
                </button>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">API URL (ตั้งค่า WebRequest)ไปที่เครื่องมือ-ไปที่ตัวเลือก-นำ"https://ไปใส่</label>
            <input
              readOnly
              value="https://supertrade-ea.com/api/ea/signal"
              className="w-full bg-gray-700 p-2 rounded"
            />
          </div>

  <div className="border-t border-gray-700 pt-4">
  <h3 className="font-semibold mb-2">📥 ดาวน์โหลด EA</h3>
  
  {/* ✅ EA ตัวใหม่ (Pending Order) */}
  <a href="/downloads/SuperEA_Pending_v1.1.mq5" download className="btn bg-purple-600 hover:bg-purple-700 w-full text-center block">
    📥 ดาวน์โหลด EA (Pending -ตั้งราคารอ )
  </a>
   <p className="text-xs text-gray-500 mt-1">
    • เหมาะกับทุกโบรก,แค่เปิดคอมรับอ๋อเดอร์แล้วปิดคอมได้ ไม่ต้องเปิดคอมทิ้งทั้งวัน ระบบจะเปิดออเดอร์ให้เอง 
  </p>
  
  <p className="text-xs text-gray-400 mt-2">
    💡 วิธีติดตั้ง: ดาวน์โหลด → เปิด MT5 กด F4 → File → Open → เลือกไฟล์ .mq5 → กด Compile (F7) → ลาก EA ลงกราฟ
  </p>
</div>

  <div className="border-t border-gray-700 pt-4">
  <h3 className="font-semibold mb-2">📖 คู่มือการติดตั้ง</h3>
  <ol className="list-decimal list-inside space-y-1 text-sm text-gray-300">
    <li>ดาวน์โหลด EA จากลิงก์ด้านบน</li>
    <li>เปิด MT5 → กด F4→ File → Open → เลือกไฟล์ .mq5 → กด Compile (F7) </li>
    <li>กลับมาที่MT5 → Navigator ข้างๆ →  ลาก EA ลงกราฟ </li>
    <li>ลาก EA ลงบนกราฟ → ใส่ API Key ที่คัดลอกไว้ → แล้วกำนดค่าlot/กำนดRisk→ OK</li>
    <li>แล้วไปที่เครื่องมือ  → ตัวเลือกแล้วใส่ URL: https://supertrade-ea.com/api/ea/signal</li>
  </ol>
</div>

{/* ✅ ส่วนแจ้งเตือน - วางตรงนี้ ก่อนปิด card */}
<div className="border-t border-gray-700 pt-4 mt-2">
  <div className="bg-yellow-900/30 border border-yellow-700 rounded-lg p-3">
    <div className="text-yellow-400 text-sm font-medium mb-2">⚠️ ข้อควรรู้ก่อนใช้งาน</div>
    <ul className="text-gray-300 text-xs space-y-1.5">
      <li>• 🔘 ต้องเปิด <span className="text-green-400 font-medium">Auto Trading</span> (ปุ่มสีเขียว) บน MT5 ก่อนใช้งาน</li>
      <li>• 📊 <span className="text-yellow-400">Lot</span> ต้องไม่ต่ำกว่า Min Lot ของ Broker</li>
      <li className="ml-4 text-gray-400">- Forex / XAUUSD → Min Lot = 0.01</li>
      <li className="ml-4 text-gray-400">- หุ้น (AMD, AAPL, TSLA) → Min Lot = 1.0</li>
      <li>• 💰 ตรวจสอบ <span className="text-yellow-400">Free Margin</span> ใน MT5 ให้เพียงพอก่อนส่งสัญญาณ</li>
      <li>• 🔍 เวลามี Signal แล้วไม่เปิดออเดอร์ ให้ดูที่ <span className="text-blue-400">Experts log</span> ใน MT5</li>
    </ul>
  </div>
</div>

</div>  
) : (


        // ✅ กรณียังไม่ได้เชื่อมต่อ EA (และยังไม่หมดอายุ)
<div className="card space-y-4">
  <p className="text-gray-400">
    กรอกข้อมูลเพื่อเชื่อมต่อ EA Forex (ทำครั้งเดียว)
  </p>

  <div>
    <label className="block text-sm font-medium mb-1">อีเมลของคุณ</label>
    <input
      type="email"
      id="connectEmail"
      defaultValue={me.email}
      className="w-full p-2 rounded bg-gray-700"
    />
  </div>

  <div>
    <label className="block text-sm font-medium mb-1">MT5 Account (login)</label>
    <input
      type="text"
      id="mt5Login"
      placeholder="กรอก MT5 Login (ตัวเลขเท่านั้น)"
      className={`w-full p-2 rounded bg-gray-700 ${
        isDuplicate ? "border-2 border-red-500" : ""
      }`}
      onChange={(e) => checkMt5Login(e.target.value)} 
    />
    {isDuplicate && (
      <p className="text-red-400 text-sm mt-1">
        ❌ MT5 Login นี้มีเจ้าของแล้ว
      </p>
    )}
    {checking && (
      <p className="text-gray-400 text-sm mt-1">กำลังตรวจสอบ...</p>
    )}
  </div>

  <button
    className={`btn w-full ${
      isDuplicate ? "bg-gray-500 cursor-not-allowed" : "bg-green-600"
    }`}
    disabled={isDuplicate}
    onClick={async () => {
      const email = (document.getElementById("connectEmail") as HTMLInputElement).value;
      const mt5Login = (document.getElementById("mt5Login") as HTMLInputElement).value;

      if (!email || !mt5Login) {
        alert("⚠️ กรุณากรอกข้อมูลให้ครบ");
        return;
      }

      try {
        const res = await fetch("/api/forex/connect", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, mt5Login }),
        });

        const data = await res.json();

        if (data.success) {
          alert(`✅ ${data.message}\n\nAPI Key: ${data.apiKey}\n\nกรุณาคัดลอก API Key ไว้ใส่ใน EA`);
          window.location.reload();
        } else {
          if (data.error === "EXPIRED") {
            alert(`❌ สมาชิกหมดอายุ\n\n${data.message}\n\nกรุณาต่ออายุสมาชิกที่หน้า Payment`);
          } else if (data.error === "DUPLICATE") {
            alert(`❌ MT5 Login ซ้ำ\n\n${data.message}\n\nถ้าเป็นบัญชีของคุณ กรุณาติดต่อ Admin`);
          } else if (data.error === "Email does not match your account") {
            alert(`❌ อีเมลไม่ถูกต้อง\n\n${data.error}`);
          } else {
            alert(`❌ เกิดข้อผิดพลาด: ${data.error || data.message}`);
          }
        }
      } catch (error) {
        alert("❌ ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้ กรุณาลองใหม่ภายหลัง");
      }
    }}
  >
    💾 บันทึกและเชื่อมต่อ EA
  </button>
        </div>
      )}
    </div>
  );
}