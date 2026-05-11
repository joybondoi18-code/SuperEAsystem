"use client";
import { useEffect, useState } from "react";
import { botsData } from "@/lib/botsData";
import { useRouter } from "next/navigation";

// ========== 📍 Component SignalToast (แจ้งเตือนตรงกลางด้านบน) ==========
function SignalToast({ notification, onClose, soundEnabled }: { notification: any; onClose: () => void; soundEnabled: boolean }) {
  useEffect(() => {
    if (soundEnabled) {
      try {
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
        const oscillator = audioContext.createOscillator()
        const gainNode = audioContext.createGain()
        
        oscillator.connect(gainNode)
        gainNode.connect(audioContext.destination)
        
        oscillator.frequency.value = 880
        gainNode.gain.value = 0.3
        
        oscillator.start()
        gainNode.gain.exponentialRampToValueAtTime(0.00001, audioContext.currentTime + 2.0)
        oscillator.stop(audioContext.currentTime + 2.0)
        
        if (audioContext.state === 'suspended') {
          audioContext.resume()
        }
      } catch (err) {
        console.log("Web Audio ไม่ทำงาน:", err)
      }
    }
    
    const timer = setTimeout(onClose, 20000)
    return () => clearTimeout(timer)
  }, [onClose, soundEnabled])

  const bgColor = notification?.type === 'pre' ? 'bg-yellow-500' : 'bg-blue-600'
  const icon = notification?.type === 'pre' ? '⚠️' : '📢'

  return (
    <div className={`fixed top-4 left-1/2 transform -translate-x-1/2 z-50 ${bgColor} text-white p-4 rounded-lg shadow-lg max-w-sm animate-in`}>
      <div className="flex justify-between items-start gap-4">
        <div className="flex items-center gap-2">
          <span className="text-xl">{icon}</span>
          <p className="text-sm font-medium">{notification?.message}</p>
        </div>
        <button onClick={onClose} className="hover:text-gray-200 text-lg leading-none">✕</button>
      </div>
    </div>
  )
}
// ========== จบ Component SignalToast ==========

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
  const [soundEnabled, setSoundEnabled] = useState(false);

  // ========== 📍 State สำหรับระบบแจ้งเตือน ==========
  const [latestNotification, setLatestNotification] = useState<any>(null)
  const [showToast, setShowToast] = useState(false)
  const [currentToast, setCurrentToast] = useState<any>(null)
  // ========== จบ State ==========

  // ========== 📍 State สำหรับ Web Push ==========
  const [subscriptionReady, setSubscriptionReady] = useState(false);
  const [subscriptionLoading, setSubscriptionLoading] = useState(false);
  // ========== จบ State Web Push ==========
  const [orderHistory, setOrderHistory] = useState([]);

  const refresh = () => { fetch("/api/users/me").then(async r => setMe((await r.json()).user)); };
  useEffect(() => { refresh(); }, []);

  useEffect(() => {
  fetch("/api/order-history?limit=5")
    .then(res => res.json())
    .then(data => setOrderHistory(data.history || []))
    .catch(err => console.error("Failed to load order history", err));
}, []);

  // ========== 📍 Polling Notification (ทุก 3 วิ) ==========
  useEffect(() => {
    let lastTimestamp = 0
    const fetchNotification = async () => {
      try {
        const res = await fetch('/api/notification')
        const data = await res.json()
        if (data.latestSignal) {
          const newTimestamp = data.latestSignal.timestamp
          if (newTimestamp !== lastTimestamp) {
            lastTimestamp = newTimestamp
            setLatestNotification(data.latestSignal)
            setCurrentToast(data.latestSignal)
            setShowToast(true)
          }
        }
      } catch (error) {
        console.error('Fetch notification error:', error)
      }
    }
    fetchNotification()
    const interval = setInterval(fetchNotification, 3000)
    return () => clearInterval(interval)
  }, [])
  // ========== จบ Polling Notification ==========

  // ========== 📍 ตรวจสอบว่า Browser รองรับ Web Push หรือไม่ ==========
  useEffect(() => {
    if ('Notification' in window && 'serviceWorker' in navigator) {
      setSubscriptionReady(true);
    }
  }, []);
  // ========== จบตรวจสอบ Web Push ==========

  // ========== 📍 ฟังก์ชันขออนุญาต Web Push ==========
  const subscribeToPush = async () => {
    if (!subscriptionReady) {
      alert('Browser ของคุณไม่รองรับการแจ้งเตือน');
      return;
    }

    setSubscriptionLoading(true);
    try {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        alert('กรุณาอนุญาตการแจ้งเตือน');
        return;
      }

      const registration = await navigator.serviceWorker.register('/sw.js');
      const res = await fetch('/api/push');      
      const { publicKey } = await res.json();
      
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: publicKey
      });
      
      await fetch('/api/push', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(subscription),
    });
      alert('✅ เปิดการแจ้งเตือนสำเร็จ!');
      localStorage.setItem('pushSubscribed', 'true');
    } catch (error) {
      console.error('Subscription error:', error);
      alert('❌ ไม่สามารถเปิดการแจ้งเตือนได้');
    } finally {
      setSubscriptionLoading(false);
    }
  };
  // ========== จบฟังก์ชัน Web Push ==========

  // ⭐ ส่วนนี้ทำงานต่อตามปกติ
  if (!me) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">กำลังเตรียมแดชบอร์ด...</p>
        </div>
      </div>
    );
  }

  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const referralLink = `${origin}/auth?ref=${me.referralCode || ""}`;

  return (
    <div className="grid md:grid-cols-2 gap-2">
      {/* Toast แจ้งเตือน */}
      {showToast && currentToast && (
        <SignalToast notification={currentToast} onClose={() => setShowToast(false)} soundEnabled={soundEnabled} />
      )}

      {/* -------- บอทเทรดทั้งหมด (ย้ายปุ่มเปิดเสียงมาไว้ในนี้) -------- */}
      <div className="card md:col-span-2 mt-0">
        {/* ✅ ปุ่มเปิดเสียง อยู่ด้านขวาสุดในกรอบสีดำ */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">🤖 บอทเทรดทั้งหมดของระบบ</h2>
          
          {!soundEnabled ? (
            <button
              onClick={() => {
                setSoundEnabled(true)
                try {
                  const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
                  const oscillator = audioContext.createOscillator()
                  const gainNode = audioContext.createGain()
                  oscillator.connect(gainNode)
                  gainNode.connect(audioContext.destination)
                  oscillator.frequency.value = 880
                  gainNode.gain.value = 0.3
                  oscillator.start()
                  gainNode.gain.exponentialRampToValueAtTime(0.00001, audioContext.currentTime + 2.0)
                  oscillator.stop(audioContext.currentTime + 2.0)
                  if (audioContext.state === 'suspended') {
                    audioContext.resume()
                  }
                } catch (err) {
                  console.log("เสียงไม่ทำงาน:", err)
                }
              }}
              className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition"
            >
              🔇 เปิดเสียงแจ้งเตือน
            </button>
          ) : (
            <div className="bg-green-800 text-green-200 px-4 py-2 rounded-lg text-sm font-medium">
              🔔 เปิดเสียงแล้ว
            </div>
          )}
        </div>

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

      {/* -------- 📜 ประวัติสัญญาณล่าสุด -------- */}
<div className="card md:col-span-2 mt-0">
  <h2 className="text-xl font-semibold mb-3">📜 ประวัติสัญญาณล่าสุด</h2>
  <div className="overflow-x-auto">
    <table className="w-full text-sm">
      <thead className="text-gray-400 border-b border-gray-700">
        <tr>
          <th className="text-left py-2">สินค้า</th>
          <th className="text-left py-2">สถานะ</th>
          <th className="text-left py-2">SL</th>
          <th className="text-left py-2">TP</th>
          <th className="text-left py-2">วันที่</th>
        </tr>
      </thead>
      <tbody>
        {orderHistory.map(item => (
          <tr key={item.id} className="border-b border-gray-800">
            <td className="py-2">{item.symbol}</td>
            <td className={`py-2 ${item.side === 'BUY' ? 'text-green-400' : 'text-red-400'}`}>
              {item.side}
            </td>
            <td className="py-2">{item.sl ? parseFloat(item.sl).toFixed(2) : '-'}</td>
            <td className="py-2">{item.tp ? parseFloat(item.tp).toFixed(2) : '-'}</td>
            <td className="py-2 text-gray-400">
              {new Date(item.createdAt).toLocaleString()}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
    {orderHistory.length === 0 && (
      <p className="text-gray-400 text-sm py-4 text-center">ยังไม่มีประวัติสัญญาณ</p>
    )}
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
          <button className="btn" onClick={() => router.push('/payment/select')}>
            💎 อัปเกรดสมาชิก
          </button>
        </div>

        {/* ✅ ส่วนเชื่อมต่อ Web Push (มาแทน Telegram) */}
        <div className="mt-6 pt-4 border-t border-gray-700">
          <h3 className="text-md font-semibold mb-2">🔔 การแจ้งเตือนบนมือถือ</h3>
          <p className="text-xs text-gray-400 mb-3">
            รับการแจ้งเตือนเมื่อมีสัญญาณ แม้ปิดเบราว์เซอร์
          </p>
          <button
            onClick={subscribeToPush}
            disabled={subscriptionLoading}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm w-full"
          >
            {subscriptionLoading ? 'กำลังตั้งค่า...' : '🔔 เปิดการแจ้งเตือน'}
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
      <div className="card md:col-span-2 mt-0">
        <h2 className="text-xl font-semibold mb-3">ระบบแนะนำเพื่อน</h2>
        <p className="text-sm text-slate-300 mb-4">
          แชร์ลิงก์ของคุณให้เพื่อนสมัคร: เมื่อเพื่อนอัปเกรดสำเร็จ
          คุณจะได้รับโบนัส <b>$10</b> 
        </p>

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