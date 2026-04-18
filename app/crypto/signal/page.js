"use client";
import { useState, useEffect } from "react";
import Link from "next/link";

export default function SignalsPage() {
  const [signalHistory, setSignalHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSignals = async () => {
      try {
        const res = await fetch('/api/signals/add');
        const data = await res.json();
        setSignalHistory(data.signals || []);
      } catch (err) {
        console.error('Error fetching signals:', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchSignals();
    
    // รีเฟรชทุก 10 วินาที
    const interval = setInterval(fetchSignals, 10000);
    return () => clearInterval(interval);
  }, []);

  const buyCount = signalHistory.filter(s => s.action === 'BUY').length;
  const sellCount = signalHistory.filter(s => s.action === 'SELL').length;
  const total = signalHistory.length;

  if (loading) {
    return (
      <div className="p-6 text-center text-gray-400">
        กำลังโหลดประวัติสัญญาณ...
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* หัวข้อ */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-yellow-400">📜 ประวัติสัญญาณ</h1>
        <Link href="/crypto">
          <button className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg text-sm">
            ← กลับไปกราฟ
          </button>
        </Link>
      </div>

      {/* สรุปย่อ */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-gray-800 p-4 rounded-lg text-center">
          <div className="text-3xl font-bold text-gray-300">{total}</div>
          <div className="text-sm text-gray-400">สัญญาณทั้งหมด</div>
        </div>
        <div className="bg-gray-800 p-4 rounded-lg text-center">
          <div className="text-3xl font-bold text-green-400">{buyCount}</div>
          <div className="text-sm text-gray-400">BUY</div>
        </div>
        <div className="bg-gray-800 p-4 rounded-lg text-center">
          <div className="text-3xl font-bold text-red-400">{sellCount}</div>
          <div className="text-sm text-gray-400">SELL</div>
        </div>
      </div>

      {/* ตารางประวัติ */}
      <div className="bg-gray-900 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-800">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">เวลา</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">สัญญาณ</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">คู่เหรียญ</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">TF</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">ราคา</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">เหตุผล</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">สถานะ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {signalHistory.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-4 py-8 text-center text-gray-500">
                    ยังไม่มีประวัติสัญญาณ
                  </td>
                </tr>
              ) : (
                signalHistory.map((signal, index) => (
                  <tr key={index} className="hover:bg-gray-800/50">
                    <td className="px-4 py-3 text-sm text-gray-400">{signal.time}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                        signal.action === 'BUY' 
                          ? 'bg-green-900/50 text-green-400' 
                          : 'bg-red-900/50 text-red-400'
                      }`}>
                        {signal.action === 'BUY' ? '🟢 BUY' : '🔴 SELL'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-300">{signal.symbol}</td>
                    <td className="px-4 py-3 text-sm text-gray-400">{signal.timeframe || '15m'}</td>
                    <td className="px-4 py-3 text-sm text-gray-300">${signal.price?.toFixed(2)}</td>
                    <td className="px-4 py-3 text-sm text-gray-400">{signal.reason}</td>
                    <td className="px-4 py-3 text-sm">
                      <span className="text-yellow-400">⚡ {signal.status || 'SIGNAL_DETECTED'}</span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* หมายเหตุ */}
      <div className="mt-4 text-xs text-gray-500 text-center">
        * แสดงเฉพาะสัญญาณล่าสุด 50 รายการ
      </div>
    </div>
  );
}