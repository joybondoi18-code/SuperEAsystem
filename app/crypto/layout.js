"use client";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import "./globals.css";
import SidebarForm from "./SidebarForm";
import StatusBadge from "./StatusBadge";
import { useBotStore } from "./store";

export default function CryptoLayout({ children }) {
  const [isClient, setIsClient] = useState(false);
  const { signalHistory, symbol, timeframe } = useBotStore();
  const wsRef = useRef(null);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // WebSocket logic (โค้ดเดิม)
  useEffect(() => {
    if (!symbol || !timeframe) return;

    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    console.log(`🟢 เปิด WebSocket (Layout) สำหรับ ${symbol} ${timeframe}`);
    const ws = new WebSocket(
      `wss://stream.binance.com:9443/ws/${symbol.toLowerCase()}@kline_${timeframe}`
    );
    wsRef.current = ws;

    ws.onopen = () => {
      console.log("🟢 Connected (Layout)");
      useBotStore.setState({ 
        wsConnected: true,
        systemStatus: '🟢 ทำงานปกติ'
      });
    };

    ws.onclose = () => {
      console.log("🔴 Disconnected (Layout)");
      useBotStore.setState({ 
        wsConnected: false,
        systemStatus: '🔴 ไม่ทำงาน'
      });
    };

    ws.onerror = (e) => {
      console.warn("⚠️ WebSocket error (Layout)");
      useBotStore.setState({ 
        systemStatus: '🔴 เชื่อมต่อล้มเหลว'
      });
    };

    ws.onmessage = (event) => {
      console.log("📩 ได้รับข้อมูลจาก WebSocket (Layout)");
    };

    return () => {
      ws.close();
      wsRef.current = null;
    };
  }, [symbol, timeframe]);

  return (
    <div className="bg-gray-950 text-gray-100 font-sans min-h-screen flex">
      <div className="w-full flex flex-col md:flex-row">
        <aside className="w-full md:w-80 bg-gray-900 border-b md:border-b-0 md:border-r border-gray-800 flex flex-col">
          <div className="p-4 border-b border-gray-800">
            <h1 className="text-lg font-bold text-yellow-400">🤖 Divergence Bot</h1>
          </div>

          <nav className="overflow-x-auto md:overflow-x-visible">
            <ul className="flex md:flex-row lg:flex-col space-x-2 md:space-x-0 lg:space-y-1 px-4 py-2 md:py-0">
              <li className="flex-shrink-0">
                <StatusBadge />
              </li>
              <li className="flex-shrink-0">
                <Link href="/crypto/signal" className="block px-4 py-2 hover:bg-gray-800 transition rounded whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    <span>📜</span>
                    <span>ประวัติ</span>
                    {signalHistory?.length > 0 && (
                      <div className="flex items-center gap-1 ml-1">
                        <span className="bg-green-600 text-white text-xs px-1.5 py-0.5 rounded">
                          BUY {signalHistory.filter(s => s?.action === 'BUY').length}
                        </span>
                        <span className="bg-red-600 text-white text-xs px-1.5 py-0.5 rounded">
                          SELL {signalHistory.filter(s => s?.action === 'SELL').length}
                        </span>
                      </div>
                    )}
                  </div>
                </Link>
              </li>
              <li className="flex-shrink-0"><Link href="/" className="block px-4 py-2 hover:bg-gray-800 transition rounded whitespace-nowrap"></Link></li>
              <li className="flex-shrink-0"><Link href="/logs" className="block px-4 py-2 hover:bg-gray-800 transition rounded whitespace-nowrap"></Link></li>
              <li className="flex-shrink-0"><Link href="/settings" className="block px-4 py-2 hover:bg-gray-800 transition rounded whitespace-nowrap"></Link></li>
            </ul>
          </nav>

          {/* ✅ แก้ไข: เปลี่ยนจาก hidden lg:block เป็น block เพื่อให้แสดงบนมือถือ */}
          <div className="block mt-auto">
            <div className="border-t border-gray-800 my-3" />
            <SidebarForm />
          </div>

          <footer className="hidden lg:block p-3 text-center text-xs text-gray-500 border-t border-gray-800">
            © {new Date().getFullYear()} <br /> Crypto Divergence Bot
          </footer>
        </aside>

        <main className="flex-1 flex flex-col min-h-screen">
          {/* ✅ แสดงเฉพาะฝั่ง Client เพื่อป้องกัน Hydration Error */}
          {isClient && (
            <div className="bg-gray-800/80 border-b border-gray-700 px-4 py-2">
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="text-yellow-400">📌 ตั้งค่า API Key:</span>
                <span className="text-gray-300">1. ใส่ IP:</span>
                <code className="bg-black px-2 py-0.5 rounded text-yellow-400 font-mono">154.222.4.131</code>
                <span className="text-gray-300">2. เปิดสิทธิ์:</span>
                <code className="bg-black px-2 py-0.5 rounded text-green-400">Enable Reading</code>
                <span className="text-gray-300">+</span>
                <code className="bg-black px-2 py-0.5 rounded text-green-400">Enable Spot & Margin Trading</code>
              </div>
            </div>
          )}

          <header className="flex items-center justify-between bg-gray-900 border-b border-gray-800 px-4 md:px-6 py-3">
            <h2 className="text-base md:text-lg font-semibold text-yellow-400">Dashboard</h2>
            <div className="flex items-center gap-2 md:gap-4 text-xs md:text-sm text-gray-400">
              <button className="hover:text-yellow-400 px-2 py-1">🔄 รีเฟรช</button>
              <button className="hover:text-yellow-400 px-2 py-1">🧠 AI</button>
            </div>
          </header>

          <div className="flex-1 p-3 md:p-6 overflow-y-auto">{children}</div>
        </main>
      </div>
    </div>
  );
}