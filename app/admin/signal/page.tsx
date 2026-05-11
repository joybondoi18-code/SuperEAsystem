"use client";
import { useState, useEffect } from "react";

export default function SignalPage() {
  const [formData, setFormData] = useState({
    symbol: "",
    side: "BUY",
    sl: "",
    tp: ""
  });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [pushEnabled, setPushEnabled] = useState(false);

  
  const [pendingForm, setPendingForm] = useState({
  symbol: "",
  side: "BUY",
  price: "",
  sl: "",
  tp: "",
  lot: ""      // ✅ เพิ่มบรรทัดนี้
});
const [pendingLoading, setPendingLoading] = useState(false);
  

  // เปลี่ยน useEffect โหลด
  useEffect(() => {
  const saved = localStorage.getItem('pushEnabled');
  if (saved === 'true') setPushEnabled(true);
  }, []);

  // ========== ฟังก์ชันส่งสัญญาณปกติ (แบบฟอร์ม) ==========
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    
    setLoading(true);
    setResult(null);
    
    try {
      if (!formData.symbol || !formData.side || !formData.sl || !formData.tp) {
        setResult({ success: false, message: `❌ กรุณากรอกข้อมูลให้ครบทุกช่อง` });
        setLoading(false);
        return;
      }

      const payload = {
        symbol: formData.symbol.toUpperCase(),
        side: formData.side,
        sl: parseFloat(formData.sl),
        tp: parseFloat(formData.tp)
      };

      // 🔹 เรียก API ทั้งสองระบบพร้อมกัน (ระบบเก่า + ระบบใหม่)
      const [resOld, resNew] = await Promise.all([
        fetch('/api/admin-signal', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            adminApiKey: "b853cc30-b031-4be8-b66c-b72ed5af5118",
            ...payload
          })
        }),
        fetch('/api/signal-ib', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        })
      ]);
      
      const dataOld = await resOld.json();
      const dataNew = await resNew.json();

      const oldOk = ["ok", "duplicate"].includes(dataOld?.status);
      const newOk = ["ok", "duplicate"].includes(dataNew?.status) || (dataNew?.symbol && dataNew?.side);
      
      if (oldOk && newOk) {
        // ✅ เพิ่มโค้ดใหม่ตรงนี้ (บนสุด)
  try {
    await fetch('/api/order-history', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        symbol: payload.symbol,
        side: payload.side,
        sl: payload.sl,
        tp: payload.tp,
      }),
    });
    console.log('✅ บันทึกประวัติสำเร็จ');
  } catch (err) {
    console.error('❌ บันทึกประวัติผิดพลาด:', err);
  }
        setResult({ success: true, message: `✅ ส่งสัญญาณสำเร็จทั้งสองระบบ! ${payload.symbol} ${payload.side} SL=${formData.sl} TP=${formData.tp}` });
        setFormData({ symbol: "", side: "BUY", sl: "", tp: "" });
        setTimeout(() => setResult(null), 3000);
      } else {
        setResult({ 
          success: false, 
          message: `⚠️ ส่งไม่สมบูรณ์: ระบบจ่ายเงิน=${oldOk ? 'OK' : 'FAIL'} / ระบบ IB Link=${newOk ? 'OK' : 'FAIL'}` 
        });
      }
    } catch (error: any) {
      setResult({ success: false, message: `❌ Connection error: ${error.message}` });
    } finally {
      setLoading(false);
    }
  };

  // ========== ฟังก์ชันส่ง PRE SIGNAL (แจ้งเตือนล่วงหน้า) ==========
const sendPreSignal = async () => {
  if (loading) return;
  setLoading(true);
  setResult(null);

  try {
    const [toastRes, pushRes] = await Promise.all([
      fetch('/api/notification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'pre',
          message: '⚠️ ระบบตรวจพบโอกาสสัญญาณ โปรดเตรียมตัว'
        })
      }),
      pushEnabled ? fetch('/api/push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: '⚠️ PRE SIGNAL',
          body: '⚠️ ระบบตรวจพบโอกาสสัญญาณ โปรดเตรียมตัว',
          url: '/dashboard',
        }),
      }) : Promise.resolve({ ok: true, json: async () => ({ success: true }) })
    ]);

    const toastData = await toastRes.json();
    const pushData = pushRes ? await pushRes.json() : { success: true };

    if (toastData.success) {
      const pushMsg = pushData?.success ? ' + Push' : ' (Push ไม่ได้เปิด)';
      setResult({ success: true, message: `🔔 ส่ง PRE SIGNAL สำเร็จ!${pushMsg}` });
      setTimeout(() => setResult(null), 2000);
    } else {
      setResult({ success: false, message: `❌ ส่ง PRE SIGNAL ไม่สำเร็จ: ${toastData.error}` });
    }
  } catch (error: any) {
    setResult({ success: false, message: `❌ Connection error: ${error.message}` });
  } finally {
    setLoading(false);
  }
};

// ========== ฟังก์ชันส่ง ENTRY SIGNAL (สัญญาณเข้าorder) ==========
const sendEntrySignal = async () => {
  if (loading) return;
  setLoading(true);
  setResult(null);

  try {
    const [toastRes, pushRes] = await Promise.all([
      // 1. ส่ง Toast ไปหน้า Dashboard
      fetch('/api/notification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'entry',
          message: '📢 ระบบได้เข้าออเดอร์แล้ว โปรดตรวจสอบ'
        })
      }),
      
      // 2. ส่ง Web Push (ถ้าเปิดไว้)
      pushEnabled ? fetch('/api/push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: '📢 ENTRY SIGNAL',
          body: '📢 ระบบได้เข้าออเดอร์แล้ว โปรดตรวจสอบ',
          url: '/dashboard',
        }),
      }) : Promise.resolve({ ok: true, json: async () => ({ success: true }) })
    ]);

    const toastData = await toastRes.json();
    const pushData = pushRes ? await pushRes.json() : { success: true };

    if (toastData.success) {
      const pushMsg = pushData?.success ? ' + Push' : ' (Push ไม่ได้เปิด)';
      setResult({ success: true, message: `🔵 ส่ง ENTRY SIGNAL สำเร็จ!${pushMsg}` });
      setTimeout(() => setResult(null), 2000);
    } else {
      setResult({ success: false, message: `❌ ส่ง ENTRY SIGNAL ไม่สำเร็จ: ${toastData.error}` });
    }
  } catch (error: any) {
    setResult({ success: false, message: `❌ Connection error: ${error.message}` });
  } finally {
    setLoading(false);
  }
};

const handlePendingSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  if (pendingLoading) return;
  
  setPendingLoading(true);
  setResult(null);
  
  try {
    if (!pendingForm.symbol || !pendingForm.side || !pendingForm.price) {
   setResult({ success: false, message: `❌ กรุณากรอกคู่เงิน ทิศทาง และราคาให้ครบ` });
   setPendingLoading(false);
   return;
}

// ✅ ถ้าไม่มี sl,tp → ใช้ Auto Mode (EA คำนวณเอง)
const payload: any = {
   symbol: pendingForm.symbol.toUpperCase(),
   side: pendingForm.side,
   price: parseFloat(pendingForm.price)
};

if (pendingForm.sl && pendingForm.sl !== "") {
   payload.sl = parseFloat(pendingForm.sl);
}
if (pendingForm.tp && pendingForm.tp !== "") {
   payload.tp = parseFloat(pendingForm.tp);
}
if (pendingForm.lot && pendingForm.lot !== "") {
   payload.lot = parseFloat(pendingForm.lot);
}

    const res = await fetch('/api/signal-ib', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    
    const data = await res.json();
    if (data.status === "ok") {
      setResult({ success: true, message: `✅ Pending Signal ส่งสำเร็จ! ${payload.symbol} ${payload.side} @${payload.price}` });
      setPendingForm({ symbol: "", side: "BUY", price: "", sl: "", tp: "", lot: "" });
      setTimeout(() => setResult(null), 3000);
    } else {
      setResult({ success: false, message: `❌ Pending Signal ส่งไม่สำเร็จ` });
    }
  } catch (error: any) {
    setResult({ success: false, message: `❌ Connection error: ${error.message}` });
  } finally {
    setPendingLoading(false);
  }
};

  return (
    <div className="min-h-screen bg-gray-900 p-6">
      <div className="max-w-2xl mx-auto">
        {/* 🔥 ปุ่มด่วน PRE SIGNAL และ ENTRY SIGNAL */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <button
            onClick={sendPreSignal}
            disabled={loading}
            className="py-4 rounded-lg font-bold text-lg transition-all bg-yellow-500 hover:bg-yellow-600 text-black disabled:opacity-50"
          >
            ⚠️ PRE SIGNAL
            <span className="block text-xs opacity-80">แจ้งเตือนล่วงหน้า</span>
          </button>
          <button
            onClick={sendEntrySignal}
            disabled={loading}
            className="py-4 rounded-lg font-bold text-lg transition-all bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50"
          >
            📢 ENTRY SIGNAL
            <span className="block text-xs opacity-80">สัญญาณเข้าออเดอร์</span>
          </button>
        </div>

        {/* ฟอร์มส่งสัญญาณแบบละเอียด (ระบบเดิม) */}
        <div className="bg-gray-800 rounded-lg p-6">
          <h1 className="text-2xl font-bold mb-6 text-center text-white">📡 ส่งสัญญาณเทรด (Admin)</h1>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">สินค้า</label>
              <input
                type="text"
                value={formData.symbol}
                onChange={(e) => setFormData({...formData, symbol: e.target.value})}
                className="w-full p-2 rounded bg-gray-700 text-white"
                placeholder="XAUUSD, EURUSD"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">ทิศทาง</label>
              <select
                value={formData.side}
                onChange={(e) => setFormData({...formData, side: e.target.value})}
                className="w-full p-2 rounded bg-gray-700 text-white"
              >
                <option value="BUY">BUY 🔼</option>
                <option value="SELL">SELL 🔽</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Stop Loss (SL)</label>
              <input
                type="number"
                step="0.01"
                value={formData.sl}
                onChange={(e) => setFormData({...formData, sl: e.target.value})}
                className="w-full p-2 rounded bg-gray-700 text-white"
                placeholder="เช่น 4695.71"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Take Profit (TP)</label>
              <input
                type="number"
                step="0.01"
                value={formData.tp}
                onChange={(e) => setFormData({...formData, tp: e.target.value})}
                className="w-full p-2 rounded bg-gray-700 text-white"
                placeholder="เช่น 4605.31"
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-md font-medium bg-green-600 hover:bg-green-700 text-white disabled:opacity-50"
            >
              {loading ? "⏳ กำลังส่ง..." : "📤 ส่งสัญญาณ (Admin)"}
            </button>
          </form>

         {/* -------- PENDING ORDER (XM) -------- */}
<div className="bg-gray-800 rounded-lg p-6 mt-6">
  <h2 className="text-xl font-bold mb-4 text-center text-purple-400">⏳ Pending Order (XM)</h2>
  <form onSubmit={handlePendingSubmit} className="space-y-4">
    <div>
      <label className="block text-sm font-medium text-gray-300 mb-1">คู่เงิน</label>
      <input
        type="text"
        value={pendingForm.symbol}
        onChange={(e) => setPendingForm({...pendingForm, symbol: e.target.value})}
        className="w-full p-2 rounded bg-gray-700 text-white"
        placeholder="XAUUSD, EURUSD"
        required
      />
    </div>
    <div>
      <label className="block text-sm font-medium text-gray-300 mb-1">ทิศทาง</label>
      <select
        value={pendingForm.side}
        onChange={(e) => setPendingForm({...pendingForm, side: e.target.value})}
        className="w-full p-2 rounded bg-gray-700 text-white"
      >
        <option value="BUY">BUY 🔼</option>
        <option value="SELL">SELL 🔽</option>
      </select>
    </div>
    <div>
      <label className="block text-sm font-medium text-gray-300 mb-1">ราคาที่ตั้ง (Pending)</label>
      <input
        type="number"
        step="0.00001"
        value={pendingForm.price}
        onChange={(e) => setPendingForm({...pendingForm, price: e.target.value})}
        className="w-full p-2 rounded bg-gray-700 text-white"
        placeholder="1.17500"
        required
      />
    </div>
    <div>
      <label className="block text-sm font-medium text-gray-300 mb-1">Stop Loss (SL)</label>
      <input
        type="number"
        step="0.00001"
        value={pendingForm.sl}
        onChange={(e) => setPendingForm({...pendingForm, sl: e.target.value})}
        className="w-full p-2 rounded bg-gray-700 text-white"
        placeholder="1.17200"
        required
      />
    </div>
    <div>
      <label className="block text-sm font-medium text-gray-300 mb-1">Take Profit (TP)</label>
      <input
        type="number"
        step="0.00001"
        value={pendingForm.tp}
        onChange={(e) => setPendingForm({...pendingForm, tp: e.target.value})}
        className="w-full p-2 rounded bg-gray-700 text-white"
        placeholder="1.18100"
        required
      />
    </div>

    {/* ✅ เพิ่มช่อง Lot (ไม่ต้อง required) */}
    <div>
      <label className="block text-sm font-medium text-gray-300 mb-1">Lot (ไม่ใส่ = Auto)</label>
      <input
        type="number"
        step="0.01"
        value={pendingForm.lot}
        onChange={(e) => setPendingForm({...pendingForm, lot: e.target.value})}
        className="w-full p-2 rounded bg-gray-700 text-white"
        placeholder="ปล่อยว่าง = คำนวณอัตโนมัติ"
      />
    </div>

    <button
      type="submit"
      disabled={pendingLoading}
      className="w-full py-3 rounded-md font-medium bg-purple-600 hover:bg-purple-700 text-white disabled:opacity-50"
    >
      {pendingLoading ? "⏳ กำลังส่ง..." : "📤 ส่ง Pending Signal"}
    </button>
  </form>
  <p className="text-xs text-gray-400 mt-3 text-center">
    EA จะวาง pending order (Lot = Auto หรือตามที่กรอก)
  </p>
</div>

          {result && (
            <div className={`mt-4 p-3 rounded whitespace-pre-wrap ${result.success ? 'bg-green-900 text-green-300' : 'bg-red-900 text-red-300'}`}>
              {result.message}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}