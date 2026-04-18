"use client";
import { useEffect, useState } from "react";
import { botsData } from "@/lib/botsData";
import { useRouter } from "next/navigation";

type User = {
  email: string;
  isActive: boolean;
  planExpiresAt: string | null;
  balance: number;
  daysLeft: number | null;
  referralCode: string;
  hasPaid?: boolean;
  showAlert?: boolean;
  referralStats?: {
    totalReferred: number;
    expectedBonus: number;
    earnedBonus: number;
  };
};
export default function Dashboard() {
  const [me, setMe] = useState<User | null>(null);
  const [withdrawAmount, setWithdrawAmount] = useState(0);
  const router = useRouter();
  const [binancePayId, setBinancePayId] = useState("");
  const [binanceName, setBinanceName] = useState("");

  const refresh = () => { fetch("/api/users/me").then(async r => setMe((await r.json()).user)); };
  useEffect(() => { refresh(); }, []);

  // ⭐ 1. แก้ไขส่วนนี้ - เปลี่ยนจาก if (me === undefined)
  if (!me) {
    // ระหว่างที่กำลังโหลด หรือ me เป็น null
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">กำลังเตรียมแดชบอร์ด...</p>
        </div>
      </div>
    );
  }

  // ⭐ 3. ส่วนนี้ทำงานต่อตามปกติ
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const referralLink = `${origin}/auth?ref=${me.referralCode || ""}`; // เปลี่ยนจาก me?.referralCode เป็น me.referralCode

  return (
    <div className="grid md:grid-cols-2 gap-6">

      {/* -------- บอทเทรดทั้งหมด -------- */}
  <div className="card md:col-span-2 mt-6">
  <h2 className="text-xl font-semibold mb-4">🤖 บอทเทรดทั้งหมดของระบบ</h2>

  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
    {botsData.map((bot) => (
      <div
        key={bot.id}
        className="bg-white rounded-xl shadow hover:shadow-lg transition overflow-hidden border"
      >
        <img
          src={bot.image}
          alt={bot.name}
          className="w-full h-40 object-cover"
        />
        <div className="p-4">
          <h3 className="text-lg font-semibold">{bot.name}</h3>
          <p className="text-gray-600 text-sm mb-3">{bot.description}</p>

        <button
  disabled={!bot.isAvailable}
  onClick={() => {
    if (!bot.isAvailable) {
      console.log("❌ Bot ไม่พร้อมใช้งาน:", bot.name);
      return;
    }

    console.log("✅ กำลังเปิด:", bot.name, "Slug:", bot.slug);

    if (bot.slug === "forex-bot") {
      console.log("📊 เปิด Forex Bot ในระบบ");
      router.push("/bots/forex");
    } else if (bot.slug === "crypto-bot") {
      console.log("📊 เปิด Crypto Bot ในระบบ");
      router.push("/crypto");

     // ✅ เพิ่มส่วนนี้เข้าไป (ใหม่)
    } else if (bot.slug === "register-account") {
      console.log("📊 เปิดหน้าเปิดบัญชี EA ฟรี");
      router.push("/forex-ea");

    } else {
      console.log("📁 เปิดบอทอื่น:", bot.slug);
      router.push(`/bots/${bot.slug}`);
    }
  }}
  className={`w-full py-2 rounded-lg font-medium transition ${
    bot.isAvailable
      ? "bg-blue-600 hover:bg-blue-700 text-white"
      : "bg-gray-300 text-gray-500 cursor-not-allowed"
  }`}
>
  {bot.isAvailable
  ? bot.slug === "crypto-bot"
    ? " เริ่มใช้งาน Crypto"
    : bot.slug === "register-account"
      ? " เปิดบัญชีใช้งาน EA ฟรี"
      : " เริ่มใช้งาน Forex"
  : "⏳ อยู่ระหว่างพัฒนา"}
</button>


        </div>
      </div>
    ))}
  </div>
</div>


      
      {/* -------- บัญชีของฉัน -------- */}
      <div className="card">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold mb-3">บัญชีของฉัน</h2>
          <button className="badge" onClick={async ()=>{ await fetch("/api/auth/logout", { method:"POST" }); location.href="/"; }}>ออกจากระบบ</button>
        </div>
        {!me?.hasPaid && me?.daysLeft !== null && me?.daysLeft <= 3 ? (
        <div className="alert">⏰ บัญชีของคุณจะหมดอายุในอีก <b>{me.daysLeft}</b> วัน</div>
        ) : null}
        <div className="space-y-2 text-sm">
          <div>อีเมล: <b>{me?.email}</b></div>
          <div>สถานะ: {me?.isActive ? <span className="badge">Active</span> : <span className="badge">Inactive</span>}</div>
          <div>หมดอายุ: <b>{me?.planExpiresAt ? new Date(me.planExpiresAt).toLocaleString() : "-"}</b></div>
          
        </div>
        <div className="mt-4 flex flex-wrap gap-3">
          <button 
            className="btn" 
            onClick={() => router.push('/payment/select')}
          >
            💎อัปเกรดสมาชิก
          </button>
          </div>
          </div>

             {/* -------- ถอนโบนัส (Binance เท่านั้น) -------- */}
      <div className="card">
        <h2 className="text-xl font-semibold mb-3">ถอนโบนัส (USDT)</h2>
        <div className="space-y-3">
          <div>
            <label>จำนวนเงิน (USDT)</label>
            <input
              type="number"
              min={1}
              value={withdrawAmount}
              onChange={(e) => setWithdrawAmount(parseFloat(e.target.value || "0"))}
            />
          </div>

          {/* ถอนผ่าน Binance อย่างเดียว */}
          <div className="mt-2 space-y-2">
            <label>🆔 Binance Pay ID / Email Binance</label>
            <input 
              type="text" 
              placeholder="กรอก Binance Pay ID หรืออีเมล Binance" 
              value={binancePayId}
              onChange={(e) => setBinancePayId(e.target.value)}
            />

            <label>👤 ชื่อบัญชี Binance (ชื่อ-นามสกุล)</label>
            <input 
              type="text" 
              placeholder="กรอกชื่อบัญชี Binance" 
              value={binanceName}
              onChange={(e) => setBinanceName(e.target.value)}
            />
          </div>

          <button
            className="btn mt-3 w-full"
            onClick={async () => {
              if (!withdrawAmount || withdrawAmount <= 0) {
                alert("⚠️ กรุณากรอกจำนวนเงินให้ถูกต้อง");
                return;
              }
              
              if (!binancePayId && !binanceName) {
                alert("⚠️ กรุณากรอกข้อมูล Binance Pay ID หรือชื่อบัญชี");
                return;
              }

              const accountInfo = `Binance Pay ID: ${binancePayId}, ชื่อบัญชี: ${binanceName}`;

              await fetch("/api/withdraw/request", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  amount: withdrawAmount,
                  method: "binance",
                  accountInfo,
                }),
              });

              alert("✅ ส่งคำขอถอนแล้ว (รอ admin อนุมัติ)");
              
              // reset form
              setWithdrawAmount(0);
              setBinancePayId("");
              setBinanceName("");
            }}
          >
            💸 ส่งคำขอถอน Binance
          </button>
        </div>
      </div>

            {/* -------- ระบบแนะนำเพื่อน -------- */}
      <div className="card md:col-span-2 mt-6">
        <h2 className="text-xl font-semibold mb-3">ระบบแนะนำเพื่อน</h2>
        <p className="text-sm text-slate-300 mb-4">
          แชร์ลิงก์ของคุณให้เพื่อนสมัคร: เมื่อเพื่อนอัปเกรดสำเร็จ
          คุณจะได้รับโบนัส <b>$10</b> 
        </p>

        {/* ✅ สถิติการแนะนำ (3 ช่อง) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-gray-800 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-blue-400">
              {me?.referralStats?.totalReferred || 0}
            </div>
            <div className="text-sm text-gray-400">👥 เพื่อนที่สมัครผ่านลิงก์</div>
          </div>
          
          <div className="bg-gray-800 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-yellow-400">
              ${me?.referralStats?.expectedBonus || 0}
            </div>
            <div className="text-sm text-gray-400">💰 คาดว่าจะได้รับ (ถ้าอัปเกรดหมด)</div>
            <div className="text-xs text-gray-500">$10/คน × {me?.referralStats?.totalReferred || 0} คน</div>
          </div>
          
          <div className="bg-gray-800 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-green-400">
              ${me?.referralStats?.earnedBonus || 0}
            </div>
            <div className="text-sm text-gray-400">✅ ได้รับจริงแล้ว</div>
          </div>
        </div>

        <div className="mt-3 grid md:grid-cols-[1fr_auto_auto] gap-3">
          <input readOnly value={referralLink} />

          {/* ✅ ปุ่มคัดลอก - ใช้ได้เฉพาะสมาชิกพรีเมียม */}
          <button
            className={`btn ${!me?.hasPaid ? 'opacity-50 cursor-not-allowed' : ''}`}
            disabled={!me?.hasPaid}
            title={!me?.hasPaid ? "อัปเกรดก่อนเพื่อใช้ฟีเจอร์นี้" : ""}
            onClick={async () => {
              if (!me?.hasPaid) return;
              await navigator.clipboard.writeText(referralLink);
              alert("คัดลอกลิงก์แล้ว");
            }}
          >
            คัดลอก
          </button>

          {/* ✅ ปุ่มแชร์ - ใช้ได้เฉพาะสมาชิกพรีเมียม */}
          <button
            className={`btn ${!me?.hasPaid ? 'opacity-50 cursor-not-allowed' : ''}`}
            disabled={!me?.hasPaid}
            title={!me?.hasPaid ? "อัปเกรดก่อนเพื่อใช้ฟีเจอร์นี้" : ""}
            onClick={() => {
              if (!me?.hasPaid) return;
              if (navigator.share) {
                navigator.share({
                  title: "สมัคร TradeBot",
                  text: "ลองใช้บอทเทรด ระบบฟรี 30 วัน",
                  url: referralLink,
                });
              } else {
                alert("อุปกรณ์นี้ไม่รองรับการแชร์อัตโนมัติ");
              }
            }}
          >
             แชร์
    </button>
  </div>
</div>
</div>
  );
}
      