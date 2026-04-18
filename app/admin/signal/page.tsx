"use client";
import { useState, useEffect } from "react";

type AISignal = {
  symbol: string;
  time: string;
  trend: {
    h1_slope_up: boolean;
    h1_close_above_ema: boolean;
    h1_ema50: number;
  };
  m5_entry: {
    signal: string;
    price: number;
    ema50: number;
    distance_points: number;
    confirmed_close: boolean;
  };
  price_action: {
    body: number;
    wick_up: number;
    wick_down: number;
  };
  market: {
    spread: number;
  };
};

export default function SignalPage() {
  const [formData, setFormData] = useState({
    symbol: "",
    side: "BUY",
    sl: "",
    tp: ""
  });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [aiSignals, setAiSignals] = useState<AISignal[]>([]);
  const [autoRefresh, setAutoRefresh] = useState(true);

  // โหลด JSON จาก logs (mock หรือ API)
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      fetch("/api/ai-signals")
        .then(res => res.json())
        .then(data => setAiSignals(data.signals || []))
        .catch(console.error);
    }, 10000);
    return () => clearInterval(interval);
  }, [autoRefresh]);

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
      const response = await fetch('/api/admin-signal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adminApiKey: "b853cc30-b031-4be8-b66c-b72ed5af5118",
          symbol: formData.symbol.toUpperCase(),
          side: formData.side,
          sl: parseFloat(formData.sl),
          tp: parseFloat(formData.tp)
        })
      });
      const data = await response.json();
      if (response.ok && data.status === "ok") {
        setResult({ success: true, message: `✅ ส่งสัญญาณสำเร็จ! ${formData.symbol} ${formData.side} SL=${formData.sl} TP=${formData.tp}` });
        setFormData({ symbol: "", side: "BUY", sl: "", tp: "" });
        setTimeout(() => setResult(null), 3000);
      } else {
        setResult({ success: false, message: `❌ ส่งไม่สำเร็จ: ${data.error || data.message || "Unknown error"}` });
      }
    } catch (error: any) {
      setResult({ success: false, message: `❌ Connection error: ${error.message}` });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 p-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ฟอร์มส่งสัญญาณ */}
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

          {result && (
            <div className={`mt-4 p-3 rounded whitespace-pre-wrap ${result.success ? 'bg-green-900 text-green-300' : 'bg-red-900 text-red-300'}`}>
              {result.message}
            </div>
          )}
        </div>

        {/* AI Dashboard */}
        <div className="bg-gray-800 rounded-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-white">🤖 AI Signal Dashboard</h2>
            <button
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={`text-sm px-3 py-1 rounded ${autoRefresh ? 'bg-green-600' : 'bg-gray-600'}`}
            >
              {autoRefresh ? "🟢 Auto Refresh ON" : "🔴 Auto Refresh OFF"}
            </button>
          </div>
          <div className="space-y-4 max-h-[600px] overflow-y-auto">
            {aiSignals.length === 0 && (
              <div className="text-gray-400 text-center py-10">⏳ รอสัญญาณจาก EA...</div>
            )}
            {aiSignals.map((sig, idx) => (
              <div key={idx} className="bg-gray-700 rounded-lg p-4 border-l-4 border-yellow-500">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <span className="text-lg font-bold text-white">{sig.symbol}</span>
                    <span className={`ml-2 text-sm ${sig.m5_entry.signal === "BUY" ? "text-green-400" : "text-red-400"}`}>
                      {sig.m5_entry.signal}
                    </span>
                  </div>
                  <span className="text-xs text-gray-400">{sig.time}</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <div className="text-gray-400">H1 Trend</div>
                    <div className={sig.trend.h1_slope_up ? "text-green-400" : "text-red-400"}>
                      {sig.trend.h1_slope_up ? "🔼 ขึ้น" : "🔽 ลง"}
                      {sig.trend.h1_close_above_ema ? " (เหนือ EMA50)" : " (ใต้ EMA50)"}
                    </div>
                    <div className="text-xs text-gray-400">EMA50: {sig.trend.h1_ema50.toFixed(5)}</div>
                  </div>
                  <div>
                    <div className="text-gray-400">M5 Entry</div>
                    <div>ราคา: {sig.m5_entry.price.toFixed(5)}</div>
                    <div>EMA50: {sig.m5_entry.ema50.toFixed(5)}</div>
                    <div>ห่าง: {sig.m5_entry.distance_points} จุด</div>
                  </div>
                  <div>
                    <div className="text-gray-400">Price Action</div>
                    <div>ตัว: {sig.price_action.body.toFixed(1)}</div>
                    <div>ไส้บน: {sig.price_action.wick_up.toFixed(1)}</div>
                    <div>ไส้ล่าง: {sig.price_action.wick_down.toFixed(1)}</div>
                  </div>
                  <div>
                    <div className="text-gray-400">Market</div>
                    <div>Spread: {sig.market.spread.toFixed(1)}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}