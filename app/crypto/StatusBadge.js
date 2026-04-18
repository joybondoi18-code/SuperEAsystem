"use client";
import { useBotStore } from "./store";

export default function StatusBadge() {
  const { systemStatus, wsConnected, lastSignal } = useBotStore();

  return (
    <div className="flex items-center gap-2 bg-gray-800 px-3 py-1.5 rounded-full">
      {/* จุดสถานะ */}
      <div className={`w-2 h-2 rounded-full ${
        wsConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'
      }`} />
      
      {/* ข้อความสถานะ */}
      <span className="text-xs text-gray-300">{systemStatus}</span>
      
      {/* ถ้ามีสัญญาณล่าสุด ให้แสดงต่อ */}
      {lastSignal && (
        <>
          <span className="w-px h-4 bg-gray-600" />
          <span className={`text-xs font-medium ${
            lastSignal.action === 'BUY' ? 'text-green-400' : 'text-red-400'
          }`}>
            {lastSignal.action === 'BUY' ? '🟢 BUY' : '🔴 SELL'} @{lastSignal.price}
          </span>
          <span className="text-xs text-gray-500">{lastSignal.time}</span>
        </>
      )}
    </div>
  );
}