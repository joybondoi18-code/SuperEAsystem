// src/app/openmt5/page.tsx
"use client";

import { useState } from "react";

export default function OpenMt5Page() {
  const [form, setForm] = useState({
    account: "",
    password: "",
    server: "",
    broker: "",
  });
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{ ok: boolean; msg: string; raw?: any } | null>(
    null
  );

  const change = (k: string, v: string) =>
    setForm((p) => ({
      ...p,
      [k]: v,
    }));

  const validate = () => {
    if (!form.account.trim()) return "กรุณากรอกเลขบัญชี MT5";
    if (!form.password.trim()) return "กรุณากรอกรหัสผ่านเทรด";
    if (!form.server.trim()) return "กรุณากรอกชื่อเซิร์ฟเวอร์ MT5";
    if (!form.broker.trim()) return "กรุณาเลือกโบรกเกอร์";
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus(null);

    const err = validate();
    if (err) {
      setStatus({ ok: false, msg: err });
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/bridge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          // ส่งทั้ง account และ broker แบบเดิม
          // broker เดี๋ยว API ไปแปลงเป็นตัวเล็กให้อีกชั้น
        }),
      });
      const data = await res.json();

      if (res.ok) {
        if (typeof window !== "undefined") {
          const old = JSON.parse(localStorage.getItem("forex-form") || "{}");
          localStorage.setItem(
            "forex-form",
            JSON.stringify({
              ...old,
              account: form.account,
              login: form.account,
              server: form.server,
              broker: form.broker,
              connected: true,
            })
          );
        }
        setStatus({
          ok: true,
          msg: data.message ?? "ส่งข้อมูลไปยัง Bridge แล้ว ✅",
          raw: data,
        });
      } else {
        setStatus({
          ok: false,
          msg: data.message ?? "เชื่อมไม่สำเร็จ ❌",
          raw: data,
        });
        console.warn("bridge error:", data);
      }
    } catch (err: any) {
      setStatus({
        ok: false,
        msg: err?.message ?? "เชื่อมต่อ API ไม่ได้",
      });
    } finally {
      setLoading(false);
      setForm((p) => ({ ...p, password: "" }));
    }
  };

  return (
    <div className="flex items-center justify-center">
      <div className="w-full max-w-2xl">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-50">เชื่อมต่อบัญชี MT5</h2>
          <p className="text-gray-200/70 text-sm mt-1">
            กรอกครั้งเดียว ระบบจำไว้ให้
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6 md:p-7">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* account */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                เลขบัญชี MT5 (account) <span className="text-red-500">*</span>
              </label>
              <input
                value={form.account}
                onChange={(e) => change("account", e.target.value)}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                placeholder="เช่น 110788632"
              />
            </div>

            {/* password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                รหัสผ่านเทรด (Trader password){" "}
                <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                value={form.password}
                onChange={(e) => change("password", e.target.value)}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                placeholder="รหัสผ่านที่ใช้เทรดได้"
              />
            </div>

            {/* server */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                เซิร์ฟเวอร์ MT5 (server) <span className="text-red-500">*</span>
              </label>
              <input
                value={form.server}
                onChange={(e) => change("server", e.target.value)}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                placeholder="เช่น Exness-MT5Real7"
              />
            </div>

            {/* broker */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                โบรกเกอร์ (broker) <span className="text-red-500">*</span>
              </label>
              <select
                value={form.broker}
                onChange={(e) => change("broker", e.target.value)}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400"
              >
                <option value="">-- เลือกโบรกเกอร์ --</option>
                <option value="Exness">Exness</option>
                <option value="ICMarkets">ICMarkets</option>
                <option value="XM">XM</option>
                <option value="FBS">FBS</option>
                <option value="Other">อื่นๆ</option>
              </select>
            </div>

            <div className="pt-4">
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2.5 rounded-lg transition disabled:opacity-60"
              >
                {loading ? "กำลังส่งไปยัง Bridge..." : "เชื่อมต่อบอท"}
              </button>
            </div>
          </form>

          {status && (
            <div
              className={`mt-5 rounded-lg px-4 py-3 text-sm ${
                status.ok
                  ? "bg-green-50 text-green-700"
                  : "bg-red-50 text-red-700"
              }`}
            >
              {status.msg}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
