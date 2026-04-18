"use client";
import { useEffect, useState } from "react";

interface Transaction {
  id: string;
  userId: string;
  amount: number;
  packageType: string;
  status: string;
  qrcodeUrl?: string;
  createdAt: string;
}

export default function AdminTransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/transactions");
      
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      
      const data = await res.json();
      
      // ✅ ป้องกันกรณี data ไม่ใช่ array
      if (Array.isArray(data)) {
        setTransactions(data);
      } else {
        console.error("API ไม่ได้ส่ง array:", data);
        setTransactions([]);
      }
    } catch (error) {
      console.error("Fetch error:", error);
      setError("ไม่สามารถโหลดข้อมูลได้");
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  };

  const approveTransaction = async (id: string) => {
    try {
      const res = await fetch("/api/payment/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transactionId: id }),
      });
      
      if (res.ok) {
        alert("อนุมัติสำเร็จ");
        fetchTransactions();
      } else {
        const data = await res.json();
        alert(data.error || "เกิดข้อผิดพลาด");
      }
    } catch (error) {
      alert("เกิดข้อผิดพลาดในการอนุมัติ");
    }
  };

  // ✅ ป้องกัน transactions เป็น undefined หรือไม่ใช่ array
  const pendingTransactions = Array.isArray(transactions) 
    ? transactions.filter(t => t.status === "pending")
    : [];

  if (loading) {
    return (
      <div className="p-6 text-center">
        <p>กำลังโหลด...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-center text-red-500">
        <p>❌ {error}</p>
        <button onClick={fetchTransactions} className="btn mt-4">
          ลองอีกครั้ง
        </button>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">📋 รอการอนุมัติ</h1>
      
      {pendingTransactions.length === 0 ? (
        <p className="text-gray-500">ไม่มีรายการรออนุมัติ</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-800">
                <th className="p-3 border text-left">ID</th>
                <th className="p-3 border text-left">User ID</th>
                <th className="p-3 border text-left">จำนวน</th>
                <th className="p-3 border text-left">แพ็กเกจ</th>
                <th className="p-3 border text-left">วันที่</th>
                <th className="p-3 border text-left">จัดการ</th>
              </tr>
            </thead>
            <tbody>
              {pendingTransactions.map(tx => (
                <tr key={tx.id} className="hover:bg-gray-800/50">
                  <td className="p-3 border">{tx.id.slice(0, 8)}...</td>
                  <td className="p-3 border">{tx.userId?.slice(0, 8)}...</td>
                  <td className="p-3 border">${tx.amount}</td>
                  <td className="p-3 border">
                    <span className={`px-2 py-1 rounded text-xs ${
                      tx.packageType === "PREMIUM" 
                        ? "bg-purple-500/20 text-purple-400" 
                        : "bg-blue-500/20 text-blue-400"
                    }`}>
                      {tx.packageType || "STANDARD"}
                    </span>
                  </td>
                  <td className="p-3 border">{new Date(tx.createdAt).toLocaleString()}</td>
                  <td className="p-3 border">
                    <button
                      onClick={() => approveTransaction(tx.id)}
                      className="bg-green-600 hover:bg-green-700 text-white px-4 py-1 rounded text-sm"
                    >
                      อนุมัติ
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}