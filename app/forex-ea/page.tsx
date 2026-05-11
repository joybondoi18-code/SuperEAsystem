'use client';

import { useState, useEffect } from 'react';

export default function ForexEAPage() {
  const [login, setLogin] = useState('');
  const [isVerified, setIsVerified] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const baseUrl = typeof window !== "undefined" ? window.location.origin : "";

  // ✅ โหลดสถานะจาก localStorage ตอนเปิดหน้า
  useEffect(() => {
    const savedLogin = localStorage.getItem('forex_verified_login');
    const savedStatus = localStorage.getItem('forex_verified_status');
    if (savedLogin && savedStatus === 'true') {
      setLogin(savedLogin);
      setIsVerified(true);
      setMessage('✅ ตรวจสอบสำเร็จแล้ว (จำสถานะไว้)');
    }
  }, []);

  const handleVerify = async () => {
    if (!login.trim()) {
      setMessage('⚠️ กรุณากรอก MT5 Login ID');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const res = await fetch(`/api/check?mt5_login=${login.trim()}`);
      const data = await res.json();

      if (data.status === 'allow') {
        setIsVerified(true);
        setMessage('✅ ผ่านการตรวจสอบแล้ว');
        localStorage.setItem('forex_verified_login', login.trim());
        localStorage.setItem('forex_verified_status', 'true');
      } else {
        setIsVerified(false);
        setMessage('❌ ไม่มีสิทธิ์ใช้งาน EA');
        localStorage.removeItem('forex_verified_login');
        localStorage.removeItem('forex_verified_status');
      }
    } catch (error) {
      console.error(error);
      setMessage('❌ เกิดข้อผิดพลาดในการเชื่อมต่อ');
      setIsVerified(false);
    } finally {
      setLoading(false);
    }
  };

  // ✅ ปุ่มตัดการเชื่อมต่อ
  const handleLogout = () => {
    localStorage.removeItem('forex_verified_login');
    localStorage.removeItem('forex_verified_status');
    setLogin('');
    setIsVerified(false);
    setMessage('🔓 ล้างการเชื่อมต่อแล้ว');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black py-12 px-4">
      <div className="max-w-lg mx-auto">
        {/* ลิงก์เปิดบัญชี XM */}
        <div className="mb-6 text-center">
          <div className="bg-blue-500/10 border border-blue-500 rounded-xl p-4">
            <p className="text-blue-300 text-sm mb-2">
              🤝 ยังไม่มีบัญชี XM? สมัครตอนนี้ <span className="font-bold">รับสิทธิ์ใช้งาน EA ฟรี และ รับเงินโบนัส $30 ฟรี</span>
            </p>
            <a
              href="https://clicks.pipaffiliates.com/c?c=1206516&l=th&p=6"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block w-full py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition"
            >
              🔗 เปิดบัญชี XM (ซื้อขายจริง)
            </a>
          </div>
        </div>

        {/* ลิงก์แข่งขัน */}
<div className="mb-6 text-center">
  <div className="bg-purple-500/10 border border-purple-500 rounded-xl p-3">
    <p className="text-purple-300 text-xs mb-1">
      🏆 เข้าร่วมการแข่งขัน <span className="font-bold">ลุ้นรางวัลใหญ่ $100,000 ได้ทุกเดือน</span>
    </p>
    <a
      href="https://clicks.pipaffiliates.com/c?c=1206516&l=th&p=3521"
      target="_blank"
      rel="noopener noreferrer"
      className="inline-block w-full py-2 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition text-sm"
    >
      🔗 เปิดบัญชี XM (ลุ้นรางวัล)
    </a>
  </div>
</div>

        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">เชื่อมต่อ Forex EA</h1>
          <p className="text-gray-400">กรอก MT5 Login ID เพื่อเริ่มใช้งาน</p>
        </div>

        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20">
          {!isVerified ? (
            <>
              <input
                type="text"
                placeholder="เช่น 12345678"
                value={login}
                onChange={(e) => setLogin(e.target.value)}
                className="w-full px-4 py-3 bg-gray-900/50 border border-gray-700 rounded-xl text-white"
              />

              <button
                onClick={handleVerify}
                disabled={loading}
                className="w-full mt-4 py-3 bg-blue-600 text-white rounded-xl"
              >
                {loading ? "กำลังตรวจสอบ..." : "ตรวจสอบ"}
              </button>

              {message && <div className="mt-4 text-center text-white">{message}</div>}
            </>
          ) : (
            <div className="text-center">
              <p className="text-green-400 mb-4">✅ เชื่อมต่อแล้ว (Login: {login})</p>
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-red-600 text-white rounded-lg"
              >
                🔌 ตัดการเชื่อมต่อ
              </button>
            </div>
          )}

          {isVerified && (
            <div className="mt-6 p-5 bg-green-900/40 rounded-xl text-center">
              <h3 className="text-green-400 font-bold mb-3">🎉 พร้อมใช้งาน EA</h3>
              <a
                href="/downloads/SuperEA_IB_Verification_v1.0.mq5"
                className="block bg-green-600 text-white py-2 rounded-lg mb-2"
              >
                📥 ดาวน์โหลด EA
              </a>
              <a
                href="/downloads/SuperEA_Manual.pdf"
                className="block bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg mb-2"
              >
                📘 ดาวน์โหลดคู่มือการติดตั้งและการใช้งาน (PDF)
              </a>
              <div className="text-sm text-green-200 mt-3">
                <p>⚙️ เพิ่ม URL นี้ใน MT5 WebRequest:</p>
                <div className="bg-black p-2 mt-1 rounded font-mono text-xs break-all">
                  {baseUrl}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}