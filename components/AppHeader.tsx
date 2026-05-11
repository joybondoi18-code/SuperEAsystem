"use client";
import { useState, useEffect } from "react";

export default function AppHeader() {
  const [appName, setAppName] = useState("SuperTrade");

  useEffect(() => {
    setAppName("SuperTrade");
  }, []);

  return (
    <div className="flex items-center gap-1.5">
      {/* โลโก้: กราฟ + แท่งเทียน 3 แท่งเล็ก (ขนาดเล็กลง) */}
      <div className="relative w-8 h-8 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center shadow-md">
        
        {/* วงแหวน */}
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 32 32" fill="none">
          <circle cx="16" cy="16" r="13" stroke="rgba(255,255,255,0.3)" strokeWidth="1" strokeDasharray="3 2" fill="none" />
          <circle cx="16" cy="16" r="9" stroke="rgba(255,255,255,0.2)" strokeWidth="0.8" strokeDasharray="2 2" fill="none" />
        </svg>

        {/* เส้นกราฟแนวโน้ม */}
        <svg className="absolute inset-0 w-full h-full opacity-50" viewBox="0 0 32 32" fill="none">
          <path d="M5 24 L10 18 L16 20 L22 14 L27 10" stroke="#ffffff" strokeWidth="1.2" fill="none" />
        </svg>

        {/* แท่งเทียน 3 แท่งเล็ก */}
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 32 32" fill="none">
          <rect x="7" y="16" width="1.5" height="3" fill="#10b981" />
          <rect x="6.5" y="19" width="3" height="1.5" fill="#10b981" />
          
          <rect x="12" y="19" width="1.5" height="3" fill="#ef4444" />
          <rect x="11.5" y="22" width="3" height="1.5" fill="#ef4444" />
          
          <rect x="20" y="12" width="1.5" height="3" fill="#10b981" />
          <rect x="19.5" y="15" width="3" height="1.5" fill="#10b981" />
        </svg>
      </div>

      {/* ข้อความ */}
      <div className="flex items-baseline">
        <span className="text-base font-extrabold text-red-500">Super</span>
        <span className="text-base font-extrabold text-green-500">Trade</span>
        <span className="text-base font-extrabold text-white">EA</span>
      </div>
    </div>
  );
}