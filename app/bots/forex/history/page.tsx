'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface Order {
  id: number;
  symbol: string;
  side: string;
  sl: string;
  tp: string;
  createdAt: string;
}

export default function HistoryPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await fetch('/api/order-history');
        const data = await res.json();
        setOrders(data.history || []);
      } catch (error) {
        console.error('โหลดประวัติผิดพลาด:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, []);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('th-TH');
  };

  return (
    <div className="min-h-screen bg-gray-900 p-6">
      <div className="max-w-4xl mx-auto">
        {/* ปุ่มกลับ */}
        <button
          onClick={() => router.back()}
          className="text-blue-400 hover:text-blue-300 mb-4 flex items-center gap-1"
        >
          ← กลับ
        </button>

        <div className="bg-gray-800 rounded-lg p-6">
          <h1 className="text-2xl font-bold text-white mb-4">📜 ประวัติสัญญาณ</h1>
            <p className="text-gray-400 text-sm mb-4">
            แสดงออเดอร์ที่ส่งไปแล้ว (ออเดอร์จะแสดงหลังจากส่งไปแล้ว)
            </p>

          {loading ? (
            <div className="text-center py-8 text-gray-400">กำลังโหลด...</div>
          ) : orders.length === 0 ? (
            <div className="text-center py-8 text-gray-400">ยังไม่มีประวัติ</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left text-gray-300">
                <thead className="text-xs uppercase bg-gray-700 text-gray-200">
                  <tr>
                    <th className="px-4 py-2">เวลา</th>
                    <th className="px-4 py-2">สินค้า</th>
                    <th className="px-4 py-2">ทิศทาง</th>
                    <th className="px-4 py-2">SL</th>
                    <th className="px-4 py-2">TP</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => (
                    <tr key={order.id} className="border-b border-gray-700 hover:bg-gray-700">
                      <td className="px-4 py-2">{formatDate(order.createdAt)}</td>
                      <td className="px-4 py-2 font-medium">{order.symbol}</td>
                      <td className={`px-4 py-2 ${order.side === 'BUY' ? 'text-green-400' : 'text-red-400'}`}>
                        {order.side === 'BUY' ? '🔼 BUY' : '🔽 SELL'}
                      </td>
                      <td className="px-4 py-2">{order.sl}</td>
                      <td className="px-4 py-2">{order.tp}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}