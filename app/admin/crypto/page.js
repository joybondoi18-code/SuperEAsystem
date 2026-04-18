'use client';

import { useState } from 'react';

export default function AdminCryptoPage() {
  const [formData, setFormData] = useState({
    symbol: 'BTCUSDT',
    timeframe: '15m',
    action: 'buy',
    price: '',      // ✅ เปลี่ยนเป็น string ว่าง
    lot: '',        // ✅ เปลี่ยนเป็น string ว่าง
    sl: '',         // ✅ เปลี่ยนเป็น string ว่าง
    tp: ''          // ✅ เปลี่ยนเป็น string ว่าง
  });
  
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);
    
    try {
      // ✅ แปลงค่าก่อนส่ง
      const dataToSend = {
        ...formData,
        price: parseFloat(formData.price) || 0,
        lot: parseFloat(formData.lot) || 0,
        sl: formData.sl ? parseFloat(formData.sl) : null,
        tp: formData.tp ? parseFloat(formData.tp) : null
      };
      
      const res = await fetch('/api/admin/signal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dataToSend)
      });
      
      const data = await res.json();
      
      if (res.ok) {
        setResult(data);
      } else {
        setError(data.error || 'เกิดข้อผิดพลาด');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold text-yellow-400 mb-6">
          🎮 Admin Crypto - ส่งสัญญาณเทรด
        </h1>
        
        <form onSubmit={handleSubmit} className="bg-gray-800 rounded-lg p-6 space-y-4">
          <div>
            <label className="block text-sm text-gray-300 mb-1">คู่เหรียญ (Symbol)</label>
            <input
              type="text"
              value={formData.symbol}
              onChange={(e) => setFormData({...formData, symbol: e.target.value.toUpperCase()})}
              className="w-full p-2 bg-gray-700 rounded text-white"
              placeholder="BTCUSDT"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm text-gray-300 mb-1">Timeframe</label>
            <select
              value={formData.timeframe}
              onChange={(e) => setFormData({...formData, timeframe: e.target.value})}
              className="w-full p-2 bg-gray-700 rounded text-white"
            >
              <option value="1m">1m</option>
              <option value="5m">5m</option>
              <option value="15m">15m</option>
              <option value="1h">1h</option>
              <option value="4h">4h</option>
              <option value="1d">1d</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm text-gray-300 mb-1">Action</label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  value="buy"
                  checked={formData.action === 'buy'}
                  onChange={(e) => setFormData({...formData, action: e.target.value})}
                  className="w-4 h-4"
                />
                <span className="text-green-400">🟢 BUY</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  value="sell"
                  checked={formData.action === 'sell'}
                  onChange={(e) => setFormData({...formData, action: e.target.value})}
                  className="w-4 h-4"
                />
                <span className="text-red-400">🔴 SELL</span>
              </label>
            </div>
          </div>
          
          <div>
            <label className="block text-sm text-gray-300 mb-1">ราคา (Price)</label>
            <input
              type="number"
              step="any"
              value={formData.price}
              onChange={(e) => setFormData({...formData, price: e.target.value})}
              className="w-full p-2 bg-gray-700 rounded text-white"
              placeholder="69000"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm text-gray-300 mb-1">จำนวน (Lot)</label>
            <input
              type="number"
              step="any"
              value={formData.lot}
              onChange={(e) => setFormData({...formData, lot: e.target.value})}
              className="w-full p-2 bg-gray-700 rounded text-white"
              placeholder="0.001"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm text-gray-300 mb-1">Stop Loss (optional)</label>
            <input
              type="number"
              step="any"
              value={formData.sl}
              onChange={(e) => setFormData({...formData, sl: e.target.value})}
              className="w-full p-2 bg-gray-700 rounded text-white"
              placeholder="68000"
            />
          </div>
          
          <div>
            <label className="block text-sm text-gray-300 mb-1">Take Profit (optional)</label>
            <input
              type="number"
              step="any"
              value={formData.tp}
              onChange={(e) => setFormData({...formData, tp: e.target.value})}
              className="w-full p-2 bg-gray-700 rounded text-white"
              placeholder="70000"
            />
          </div>
          
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-yellow-500 hover:bg-yellow-400 text-black font-semibold py-2 rounded transition disabled:opacity-50"
          >
            {loading ? 'กำลังส่งสัญญาณ...' : '📡 ส่งสัญญาณเทรด'}
          </button>
        </form>
        
        {error && (
          <div className="mt-4 p-4 bg-red-900/50 border border-red-500 rounded text-red-400">
            ❌ {error}
          </div>
        )}
        
        {result && (
          <div className="mt-4 p-4 bg-green-900/50 border border-green-500 rounded">
            <h3 className="font-semibold text-green-400 mb-2">✅ ผลการส่งสัญญาณ</h3>
            <pre className="text-xs text-gray-300 overflow-auto max-h-96">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}