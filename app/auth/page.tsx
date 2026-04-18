"use client";
import { useEffect, useState } from "react";

export default function AuthPage() {
  const [tab, setTab] = useState<"login"|"register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [referral, setReferral] = useState("");

  useEffect(()=>{
    const url = new URL(window.location.href);
    const ref = url.searchParams.get("ref");
    if (ref) { setReferral(ref); setTab("register"); }
  }, []);

  return (
    <div className="max-w-lg mx-auto">
      <div className="card">
        <div className="flex gap-2 mb-6">
          <button className={"badge " + (tab==="login" ? "bg-indigo-600" : "")} onClick={()=>setTab("login")}>เข้าสู่ระบบ</button>
          <button className={"badge " + (tab==="register" ? "bg-indigo-600" : "")} onClick={()=>setTab("register")}>สมัครสมาชิก</button>
        </div>

    {tab === "login" && (
    <div className="space-y-3">
    <div><label>อีเมล</label><input value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com" /></div>
    <div><label>รหัสผ่าน</label><input type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="********" /></div>
    <button className="btn" onClick={async ()=>{
      const r = await fetch("/api/auth/login", { 
        method:"POST", 
        body: JSON.stringify({ email, password }) 
      });
      const d = await r.json();
      
      if (!d.success) { 
        alert(d.message || "เข้าสู่ระบบไม่สำเร็จ"); 
        return; 
      }
      
     

      // ✅ เพิ่ม logging เพื่อ debug
      console.log("🔍 Login API Response:", d);
      console.log("👤 User role:", d.role);
      
      // ✅ ตรวจสอบ role ให้แน่ใจ
      const userRole = d.role ? d.role.trim().toUpperCase() : "USER";
      console.log("🎯 Final role decision:", userRole);
      
      if (userRole === "ADMIN") {
        console.log("➡️ Redirecting to /admin");
        location.href = "/admin";
      } else {
        console.log("➡️ Redirecting to /dashboard");
        window.location.href = "/dashboard";
      }
    }}>เข้าสู่ระบบ</button>
  </div>
)}

        {tab === "register" && (
          <div className="space-y-3">
            {referral && <div className="alert">สมัครด้วยโค้ดแนะนำ: <b>{referral}</b></div>}
            <div><label>อีเมล</label><input value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com" /></div>
            <div><label>รหัสผ่าน</label><input type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="อย่างน้อย 8 ตัวอักษร" /></div>
            <div><label>โค้ดแนะนำเพื่อน (ถ้ามี)</label><input value={referral} onChange={e=>setReferral(e.target.value)} placeholder="เช่น REFABCD1" /></div>
            <button className="btn" onClick={async ()=>{
              const r = await fetch("/api/auth/register", { method:"POST", body: JSON.stringify({ email, password, referralCode: referral }) });
              const d = await r.json();
              alert(d.message || "สมัครสำเร็จ");
              window.location.href = "/dashboard";
            }}>สมัครสมาชิก (ทดลองใช้ฟรี 30 วัน)</button>
          </div>
        )}
      </div>
      <div className="text-center mt-3"><a className="text-sky-400 underline" href="/">กลับหน้าแรก</a></div>
    </div>
  );
}
