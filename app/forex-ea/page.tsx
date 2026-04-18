// app/forex-ea/page.tsx
'use client';

import { useState } from 'react';

export default function ForexEAPage() {
  const [login, setLogin] = useState('');
  const [isVerified, setIsVerified] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleVerify = async () => {
    setLoading(true);
    setMessage('');

    try {
      const res = await fetch('/api/check-ib', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ login, broker: 'xm' })
      });

      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);

      const data = await res.json();

      if (data.valid) {
        setIsVerified(true);
        setMessage('✅ ตรวจสอบสำเร็จ! ดาวน์โหลด EA ได้เลย');
      } else {
        setIsVerified(false);
        setMessage('❌ Login นี้ไม่ได้สมัครผ่านลิงค์เรา กรุณาเปิดบัญชีใหม่');
      }
    } catch (error) {
      console.error('Fetch error:', error);
      setMessage('❌ เกิดข้อผิดพลาดในการเชื่อมต่อ กรุณาลองใหม่');
      setIsVerified(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black py-12 px-4">
      <div className="max-w-lg mx-auto">
        
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-block p-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl mb-4">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">เชื่อมต่อ Forex EA</h1>
          <p className="text-gray-400">กรอก MT4/MT5 Login ID เพื่อเริ่มใช้งาน</p>
        </div>

        {/* Card */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl p-8 border border-white/20">
          
          {/* Input */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              MT4/MT5 Login ID
            </label>
            <input
              type="text"
              placeholder="เช่น 12345678"
              value={login}
              onChange={(e) => setLogin(e.target.value)}
              className="w-full px-4 py-3 bg-gray-900/50 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
            />
          </div>

          {/* Button */}
          <button
            onClick={handleVerify}
            disabled={!login || loading}
            className="w-full py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-gray-600 disabled:to-gray-700 text-white font-medium rounded-xl transition-all duration-200 transform hover:scale-[1.02] disabled:hover:scale-100"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                กำลังตรวจสอบ...
              </span>
            ) : (
              'ตรวจสอบและเชื่อมต่อ'
            )}
          </button>

          {/* Message */}
          {message && (
            <div className={`mt-4 p-3 rounded-xl text-center ${
              isVerified 
                ? 'bg-green-500/20 border border-green-500/50 text-green-400' 
                : 'bg-red-500/20 border border-red-500/50 text-red-400'
            }`}>
              {message}
            </div>
          )}

          {/* Register Link */}
          <div className="mt-6 p-4 bg-gray-900/50 rounded-xl text-center border border-gray-800">
            <p className="text-sm text-gray-400 mb-2">คลิกลื้งเปิดบัญชี xm แล้ว login เพื่อใช้งาน?</p>
            <a
              href="https://clicks.pipaffiliates.com/xxxxx"
              target="_blank"
              className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300 transition"
            >
              🔗 คลิกเปิดบัญชีที่นี่ (ฟรี)
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          </div>

    {/* Download Section - แสดงเฉพาะเมื่อตรวจสอบผ่าน */}
    {isVerified && (
    <div className="mt-6 p-5 bg-gradient-to-r from-green-900/40 to-emerald-900/40 rounded-xl border border-green-500/30 text-center">
    <div className="inline-flex items-center justify-center w-12 h-12 bg-green-500/20 rounded-full mb-3">
      <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
      </svg>
    </div>
    <h3 className="text-xl font-bold text-green-400 mb-2">🎉 พร้อมใช้งาน!</h3>
    
    <a
      href="/downloads/SuperEA_IB_Verification_v1.0.mq5"
      download
      className="inline-flex items-center gap-2 mt-2 px-6 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-xl transition"
    >
      📥 ดาวน์โหลด EA (Source Code .mq5)
    </a>
    
    <p className="text-xs text-gray-500 mt-3">
      วิธีติดตั้ง: 
      1. ดาวน์โหลดไฟล์ .mq5<br/>
      2. เปิด MT5 → File → Open Data Folder → MQL5 → Experts<br/>
      3. วางไฟล์ .mq5 ลงในโฟลเดอร์ Experts<br/>
      4. รีสตาร์ท MT5 → คลิกขวาที่ Navigator → Compile
    </p>
  </div>
)}
          
        </div>
      </div>
    </div>
  );
}