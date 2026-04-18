"use client";
import { useState, useEffect } from "react";
import { useBotStore } from "./store";

export default function SidebarForm() {
  const [exchange, setExchange] = useState("binance");
  const [apiKey, setApiKey] = useState("");
  const [secretKey, setSecretKey] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isExpired, setIsExpired] = useState(false);
  const [isEmailValid, setIsEmailValid] = useState(false);
  const [isCheckingEmail, setIsCheckingEmail] = useState(false);
  
  const userId = typeof window !== "undefined" ? localStorage.getItem("userId") || "test-user-1" : "test-user-1";

  // ✅ ตรวจสอบอีเมล (ถูกต้องหรือไม่)
  useEffect(() => {
    if (!email) {
      setIsEmailValid(false);
      return;
    }
    
    const checkEmail = async () => {
      setIsCheckingEmail(true);
      try {
        const res = await fetch("/api/crypto/verify-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email })
        });
        const data = await res.json();
        setIsEmailValid(data.valid);
      } catch (err) {
        setIsEmailValid(false);
      } finally {
        setIsCheckingEmail(false);
      }
    };
    
    const timer = setTimeout(checkEmail, 500);
    return () => clearTimeout(timer);
  }, [email]);

  // ✅ ตรวจสอบอีเมล (เฉพาะเมื่อมีการเปลี่ยนแปลง)
useEffect(() => {
  if (!email) {
    setIsExpired(false);
    return;
  }
  
  const checkStatus = async () => {
    try {
      const res = await fetch(`/api/crypto/user-status?email=${email}`);
      const data = await res.json();
      setIsExpired(data.expired);
    } catch (err) {
      console.error("Error checking status:", err);
    }
  };
  
  checkStatus();
  
}, [email]); // ทำงานเมื่อ email เปลี่ยน

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage("🔄 กำลังบันทึก API Key...");
    
    try {
      const res = await fetch("/api/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, email, apiKey, secretKey }),
      });
      
      const data = await res.json();
      
      if (res.ok) {
        setMessage(`✅ บันทึก API Key สำเร็จ`);
        useBotStore.setState({ connected: true, exchange, apiKey, secretKey });
        setApiKey("");
        setSecretKey("");
      } else if (res.status === 403) {
        setMessage(`⏰ ${data.error}`);
        setIsExpired(true);
      } else {
        setMessage(`❌ ${data.error}`);
      }
    } catch (err) {
      console.error("Error:", err);
      setMessage("⚠️ เกิดข้อผิดพลาด");
    } finally {
      setIsSubmitting(false);
    }
  };

  const { connected, apiKey: savedApiKey } = useBotStore();
  
  return (
    <div className="p-4">
      <h2 className="text-sm font-semibold text-yellow-400 mb-3">
        {connected ? "✅ เชื่อมต่อแล้ว" : "🔌 เชื่อมต่อ Binance"}
      </h2>

      {!connected ? (
        <form onSubmit={handleSubmit} className="space-y-3">
          {/* ✅ ช่องอีเมล */}
          <div>
            <label className="block text-xs mb-1">ใส่อีเมลให้ตรงอีเมลเข้าระบบ</label>
            <input 
              type="email" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-2 rounded bg-gray-800 border border-gray-700 text-sm" 
              required 
              disabled={isSubmitting}
              placeholder="ใส่อีเมลของคุณ"
            />
          </div>

          <div>
            <label className="block text-xs mb-1">Exchange</label>
            <select 
              value={exchange} 
              onChange={(e) => setExchange(e.target.value)}
              className="w-full p-2 rounded bg-gray-800 border border-gray-700 text-sm" 
              disabled={isSubmitting}
            >
              <option value="binance">Binance</option>
            </select>
          </div>

          <div>
            <label className="block text-xs mb-1">API Key</label>
            <input 
              type="text" 
              value={apiKey} 
              onChange={(e) => setApiKey(e.target.value)}
              className="w-full p-2 rounded bg-gray-800 border border-gray-700 text-sm" 
              required 
              disabled={isSubmitting}
              placeholder="ใส่ API Key ของคุณ"
            />
          </div>

          <div>
            <label className="block text-xs mb-1">Secret Key</label>
            <input 
              type="password" 
              value={secretKey} 
              onChange={(e) => setSecretKey(e.target.value)}
              className="w-full p-2 rounded bg-gray-800 border border-gray-700 text-sm" 
              required 
              disabled={isSubmitting}
              placeholder="ใส่ Secret Key ของคุณ"
            />
          </div>

          <button 
            type="submit" 
            disabled={isSubmitting || isExpired || !isEmailValid || isCheckingEmail || !email}
            className={`w-full py-2 rounded transition text-sm ${
              (!isEmailValid || isExpired || !email) 
                ? 'bg-gray-600 cursor-not-allowed' 
                : 'bg-yellow-500 hover:bg-yellow-400 text-black'
            } disabled:opacity-60`}
          >
            {!email ? '📧 กรุณากรอกอีเมล' : 
             isCheckingEmail ? '🔍 กำลังตรวจสอบ...' :
             !isEmailValid ? '❌ อีเมลไม่ถูกต้อง' :
             isExpired ? '⏰ สิทธิ์หมดอายุ กรุณาอัปเกรด' : 
             (isSubmitting ? "กำลังบันทึก..." : "เชื่อมต่อ Binance")}
          </button>
        </form>
      ) : (
        <div className="text-center text-sm text-green-400">
          ✅ เชื่อมต่อแล้ว
          <p className="text-xs text-gray-500 mt-2">
            อีเมล: {email}<br />
            API Key: {savedApiKey?.slice(0, 15)}...
          </p>
          <button
            onClick={async () => {
              setMessage("🔄 กำลังตัดการเชื่อมต่อ...");
              try {
                const res = await fetch("/api/customers/disconnect", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ userId })
                });
                const data = await res.json();
                if (res.ok) {
                  useBotStore.setState({ connected: false, apiKey: "", secretKey: "" });
                  setMessage("🔌 ตัดการเชื่อมต่อแล้ว");
                } else {
                  setMessage(`❌ ${data.error}`);
                }
              } catch (err) {
                console.error("Error disconnecting:", err);
                setMessage("⚠️ ตัดการเชื่อมต่อไม่สำเร็จ");
              }
            }}
            className="mt-3 text-xs text-red-400 hover:text-red-300"
          >
            ตัดการเชื่อมต่อ
          </button>
        </div>
      )}

      {message && <p className="mt-3 text-xs text-cyan-400">{message}</p>}
    </div>
  );
}