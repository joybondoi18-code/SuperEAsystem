"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link"; // ✅ เพิ่มสำหรับลิงก์ไปหน้าใหม่

type User = { 
  id: string; 
  email: string; 
  isActive: boolean; 
  planExpiresAt: string | null; 
  balance: number 
    mt5Login?: string | null;    // ✅ เพิ่ม
  apiKey?: string | null;       // ✅ เพิ่ม (เผื่อใช้)
};

type Withdraw = { 
  id: string; 
  userId: string; 
  user: { email: string };
  amount: number; 
  status: string; 
  createdAt: string;
  method: string;
  accountInfo: string | null;
};

export default function Admin() {
  const router = useRouter();
  const [isAuthChecked, setIsAuthChecked] = useState(false);
  
  const [users, setUsers] = useState<User[]>([]);
  const [withdraws, setWithdraws] = useState<Withdraw[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [bankUserId, setBankUserId] = useState("");
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [pendingCount, setPendingCount] = useState(0); // ✅ สำหรับนับรออนุมัติ

  // ✅ ตรวจสอบสิทธิ์ Admin
  useEffect(() => {
    async function checkAdmin() {
      try {
        const res = await fetch("/api/admin/users");
        if (res.status === 403) {
          router.push("/");
          return;
        }
        setIsAuthChecked(true);
      } catch (error) {
        router.push("/");
      }
    }
    checkAdmin();
  }, [router]);

  async function refresh() {
    if (!isAuthChecked) return;
    
    const u = await fetch("/api/admin/users").then(r => r.json());
    const w = await fetch("/api/admin/withdraws").then(r => r.json());
    const b = await fetch("/api/bots/status").then(r => r.json());
    
    // ✅ ดึงจำนวน pending transactions จากระบบใหม่
    const tx = await fetch("/api/admin/transactions").then(r => r.json());
    const pendingTransactions = Array.isArray(tx) 
      ? tx.filter((t: any) => t.status === "pending").length 
      : 0;
    
    setUsers(u.users || []);
    setWithdraws(w.withdraws || []);
    setIsRunning(b.isRunning || false);
    setPendingCount(pendingTransactions);
  }

  useEffect(() => { 
    if (isAuthChecked) {
      refresh();
      const interval = setInterval(refresh, 30000);
      return () => clearInterval(interval);
    }
  }, [isAuthChecked]);

  if (!isAuthChecked) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-xl font-semibold mb-2">กำลังตรวจสอบสิทธิ์...</div>
          <div className="text-gray-500">กรุณารอสักครู่</div>
        </div>
      </div>
    );
  }

  const filteredWithdraws = withdraws.filter(w => {
    if (statusFilter === "all") return true;
    return w.status === statusFilter;
  });

  const handleApproveWithdraw = async (withdrawId: string, amount: number, userEmail: string) => {
  if (!confirm(`ยืนยันอนุมัติการถอน ${amount} USDT ให้ ${userEmail}?`)) return;
  
  setApprovingId(withdrawId);
  try {
    // ✅ ขั้นตอนที่ 1: อนุมัติ (APPROVED)
    const approveRes = await fetch("/api/withdraw/approve", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: withdrawId })
    });
    const approveData = await approveRes.json();
    
    if (!approveData.success) {
      alert("❌ อนุมัติไม่สำเร็จ: " + (approveData.message || ""));
      refresh();
      setApprovingId(null);
      return;
    }
    
    // ✅ ถ้าอนุมัติสำเร็จ ให้ถามว่าโอนเงินให้ user แล้วหรือยัง
    const paymentRef = prompt(
      "✅ อนุมัติสำเร็จ!\n\n" +
      "กรุณาโอนเงินให้ผู้ใช้\n" +
      "แล้วใส่เลขที่อ้างอิงการโอน (Reference Number)\n\n" +
      "ถ้ายังไม่ได้โอน ให้กด Cancel"
    );
    
    if (paymentRef) {
      // ✅ ขั้นตอนที่ 2: ยืนยันการจ่ายเงิน (PAID)
      const payRes = await fetch("/api/withdraw/pay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: withdrawId, paymentRef })
      });
      const payData = await payRes.json();
      
      if (payData.success) {
        alert(`✅ จ่ายเงินสำเร็จ!\nเลขที่อ้างอิง: ${paymentRef}\nยอดเงิน ${amount} USDT จะถูกหักจากผู้ใช้เรียบร้อย`);
      } else {
        alert(`⚠️ อนุมัติสำเร็จ แต่บันทึกการจ่ายไม่สำเร็จ: ${payData.message}\nกรุณาจ่ายเงินด้วยตนเองแล้วกดปุ่ม "ยืนยันการโอน" ที่หน้าแยก`);
      }
    } else {
      alert("✅ อนุมัติสำเร็จ (ยังไม่ได้บันทึกการจ่ายเงิน)");
    }
    
    refresh();
  } catch (error) {
    alert("เกิดข้อผิดพลาดในการเชื่อมต่อ");
  } finally {
    setApprovingId(null);
  }
};  

  const handleApproveBank = async () => {
    if (!bankUserId.trim()) return alert("กรุณากรอก User ID");
    if (!confirm(`ยืนยันการต่ออายุให้ user: ${bankUserId}?`)) return;
    
    const res = await fetch("/api/payment/confirm-bank", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: bankUserId })
    });
    const data = await res.json();
    alert(data.success ? "ต่ออายุเรียบร้อย" : "เกิดข้อผิดพลาด: " + JSON.stringify(data));
    setBankUserId("");
    refresh();
  };

  const handleToggleBot = async () => {
    if (!confirm(`ยืนยันที่จะ ${isRunning ? "ปิด" : "เปิด"} บอททั้งหมด?`)) return;
    await fetch("/api/bots/toggle", { method: "POST" });
    refresh();
  };

  return (
    <div className="grid gap-6 p-4">
      {/* ✅ Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-600">ผู้ใช้ทั้งหมด</h3>
          <p className="text-2xl font-bold">{users.length} คน</p>
        </div>
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-600">รอถอนเงิน</h3>
          <p className="text-2xl font-bold text-orange-500">
            {withdraws.filter(w => w.status === "PENDING").length} รายการ
          </p>
        </div>
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-600">รอชำระเงิน</h3>
          <Link href="/admin/transactions">
            <p className="text-2xl font-bold text-blue-500 cursor-pointer hover:underline">
              {pendingCount} รายการ
            </p>
          </Link>
        </div>
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-600">สถานะบอท</h3>
          <div className="flex items-center gap-2">
            <span className={`w-3 h-3 rounded-full ${isRunning ? 'bg-green-500' : 'bg-red-500'}`}></span>
            <span className="font-medium">{isRunning ? "กำลังทำงาน" : "หยุดทำงาน"}</span>
          </div>
        </div>
      </div>

      {/* ✅ Bot Control */}
      <div className="card">
        <h2 className="text-xl font-semibold mb-4">ควบคุมบอททั้งหมด</h2>
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <span>สถานะ:</span>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${isRunning ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
              {isRunning ? "RUNNING" : "STOPPED"}
            </span>
          </div>
          <button 
            className={`px-4 py-2 rounded font-medium ${isRunning ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'} text-white`}
            onClick={handleToggleBot}
          >
            {isRunning ? "ปิดบอททั้งหมด" : "เปิดบอททั้งหมด"}
          </button>
          <button 
            className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded font-medium"
            onClick={refresh}
          >
            รีเฟรชข้อมูล
          </button>
        </div>
      </div>

      {/* ✅ Bank Payment Approval */}
      <div className="card">
        <h2 className="text-xl font-semibold mb-4">ยืนยันการโอนธนาคาร (ต่ออายุ)</h2>
        <div className="flex flex-col sm:flex-row gap-3">
          <input 
            className="flex-1 px-3 py-2 border rounded"
            placeholder="กรอก userId ที่โอนเงินแล้ว"
            value={bankUserId}
            onChange={(e) => setBankUserId(e.target.value)}
          />
          <button 
            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded font-medium whitespace-nowrap"
            onClick={handleApproveBank}
            disabled={!bankUserId.trim()}
          >
            อนุมัติการต่ออายุ
          </button>
        </div>
      </div>

      {/* ✅ Binance Payment - ลิงก์ไประบบใหม่ */}
      <div className="card">
        <h2 className="text-xl font-semibold mb-4">ยืนยันการชำระเงินผ่าน Binance</h2>
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
          <p className="text-gray-600">จัดการการชำระเงินผ่าน Binance Pay และอัปเกรดสมาชิก</p>
          <Link href="/admin/transactions">
            <button className="px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded font-medium">
              ไปที่หน้า Manage Payments →
            </button>
          </Link>
        </div>
      </div>

      {/* ✅ Users Table */}
      <div className="card">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">ผู้ใช้ทั้งหมด ({users.length})</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-50">
                <th className="p-3 text-left border-b">Email</th>
                <th className="p-3 text-left border-b">สถานะ</th>
                <th className="p-3 text-left border-b">วันหมดอายุ</th>
                <th className="p-3 text-left border-b">ยอดคงเหลือ</th>
                <th className="p-3 text-left border-b">MT5 Login</th>  {/* ✅ เพิ่ม */}
                <th className="p-3 text-left border-b">จัดการ</th>       {/* ✅ เพิ่ม */}
              </tr>
            </thead>
            <tbody>
  {users.map(u => (
    <tr key={u.id} className="hover:bg-gray-50">
      <td className="p-3 border-b">{u.email}</td>
      <td className="p-3 border-b">
        <span className={`px-2 py-1 rounded text-xs ${u.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
          {u.isActive ? "Active" : "Inactive"}
        </span>
      </td>
      <td className="p-3 border-b">
        {u.planExpiresAt ? new Date(u.planExpiresAt).toLocaleDateString('th-TH') : "-"}
      </td>
      <td className="p-3 border-b font-medium">${u.balance.toFixed(2)}</td>
      <td className="p-3 border-b text-sm">
        {(u as any).mt5Login || <span className="text-gray-400">ยังไม่เชื่อมต่อ</span>}
      </td>
      <td className="p-3 border-b">
        {(u as any).mt5Login && (
          <button
            onClick={async () => {
              if (!confirm(`⚠️ ยืนยันลบการเชื่อมต่อ EA ของ ${u.email}?\n\nเมื่อลบแล้ว API Key จะใช้ไม่ได้ทันที และ ${u.email} ต้องเชื่อมต่อ EA ใหม่`)) {
                return;
              }
              
              try {
                const res = await fetch("/api/admin/disconnect", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ email: u.email }),
                });
                
                const data = await res.json();
                
                if (data.success) {
                  alert(`✅ ลบการเชื่อมต่อ EA ของ ${u.email} สำเร็จ`);
                  refresh();
                } else {
                  alert(`❌ ลบไม่สำเร็จ: ${data.error || "Unknown error"}`);
                }
              } catch (error) {
                alert("❌ ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้");
              }
            }}
            className="px-3 py-1 bg-red-500 hover:bg-red-600 text-white rounded text-sm font-medium"
           >
                🔄 ลบการเชื่อมต่อ EA
              </button>
            )}
          </td>
        </tr>
      ))}
    </tbody>
  </table>
</div>
</div>

      {/* ✅ Withdraw Requests */}
      <div className="card">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-3">
          <h2 className="text-xl font-semibold">คำขอถอนเงิน ({filteredWithdraws.length})</h2>
          <div className="flex gap-3">
            <select 
              className="px-3 py-2 border rounded"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">ทั้งหมด</option>
              <option value="PENDING">รออนุมัติ</option>
              <option value="APPROVED">อนุมัติแล้ว</option>
              <option value="PAID">จ่ายแล้ว</option>
            </select>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-50">
                <th className="p-3 text-left border-b">ผู้ใช้</th>
                <th className="p-3 text-left border-b">จำนวน</th>
                <th className="p-3 text-left border-b">ช่องทาง</th>
                 <th className="p-3 text-left border-b">Wallet Address</th>
                <th className="p-3 text-left border-b">สถานะ</th>
                <th className="p-3 text-left border-b">วันที่ขอ</th>
                <th className="p-3 text-left border-b">จัดการ</th>
              </tr>
            </thead>
            <tbody>
  {filteredWithdraws.map(w => {
    // พยายาม parse accountInfo ถ้าเป็น JSON
    let address = "";
    let network = "";
    let accountName = "";
    
    try {
      const parsed = JSON.parse(w.accountInfo || "{}");
      if (parsed.address) address = parsed.address;
      if (parsed.network) network = parsed.network;
      if (parsed.name) accountName = parsed.name;
    } catch {
      // ถ้า parse ไม่ได้ ให้ใช้ accountInfo เฉยๆ
      address = w.accountInfo || "";
    }
    
    return (
      <tr key={w.id} className="hover:bg-gray-50">
        <td className="p-3 border-b">
          <div>
            <div className="font-medium">{w.user?.email || "ไม่ทราบอีเมล"}</div>
            <div className="text-xs text-gray-500">{w.userId}</div>
          </div>
        </td>
        
        <td className="p-3 border-b font-bold">{w.amount.toFixed(2)} USDT</td>
        
        <td className="p-3 border-b">
          <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
            {w.method || "binance"}
          </span>
        </td>
        
        {/* ✅ คอลัมน์ Wallet Address */}
        <td className="p-3 border-b">
          {address ? (
            <div className="space-y-1">
              <div className="text-sm font-mono break-all max-w-[250px]">
                {address}
              </div>
              {network && (
                <div className="text-xs">
                  <span className="px-1.5 py-0.5 bg-gray-100 rounded text-gray-700">
                    🌐 {network}
                  </span>
                </div>
              )}
              {accountName && (
                <div className="text-xs text-gray-500">
                  👤 {accountName}
                </div>
              )}
              <button
                onClick={() => {
                  navigator.clipboard.writeText(address);
                  alert("📋 คัดลอก Wallet Address แล้ว");
                }}
                className="text-xs text-blue-500 hover:underline"
              >
                📋 คัดลอก
              </button>
            </div>
          ) : (
            <span className="text-gray-400 text-sm">ไม่มีข้อมูล</span>
          )}
        </td>
        
        <td className="p-3 border-b">
          <span className={`px-2 py-1 rounded text-xs ${
            w.status === 'APPROVED' ? 'bg-green-100 text-green-800' :
            w.status === 'PAID' ? 'bg-blue-100 text-blue-800' :
            w.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
            'bg-red-100 text-red-800'
          }`}>
            {w.status === 'PAID' ? 'จ่ายแล้ว' :
            w.status === 'APPROVED' ? 'อนุมัติแล้ว (รอโอน)' : 
            w.status === 'PENDING' ? 'รออนุมัติ' : 
            'ล้มเหลว'}
          </span>
        </td>
        
        <td className="p-3 border-b text-sm">
          {new Date(w.createdAt).toLocaleDateString('th-TH')}
        </td>
        
        <td className="p-3 border-b">
          {w.status === "PENDING" ? (
            <button 
              className="px-3 py-1 bg-green-500 hover:bg-green-600 text-white rounded text-sm font-medium disabled:opacity-50"
              onClick={() => handleApproveWithdraw(w.id, w.amount, w.user?.email || w.userId)}
              disabled={approvingId === w.id}
            >
              {approvingId === w.id ? "กำลังอนุมัติ..." : "อนุมัติ"}
            </button>
          ) : (
            <span className="text-gray-400 text-sm">ดำเนินการแล้ว</span>
          )}
        </td>
      </tr>
    );
  })}
  {filteredWithdraws.length === 0 && (
    <tr>
      <td colSpan={7} className="p-6 text-center text-gray-500">
        ไม่พบคำขอถอนเงิน
      </td>
    </tr>
  )}
</tbody>            
          
          </table>
        </div>
      </div>
    </div>
  );
}