import { create } from "zustand";
import { persist } from "zustand/middleware";

export const useBotStore = create(
  persist(
    (set) => ({
      // ========== ของเดิม ==========
      exchange: "binance",
      apiKey: "",
      secretKey: "",
      symbol: "BTCUSDT",
      timeframe: "15m",
      connected: false,
      message: "",

    // ========== เพิ่มใหม่ (STATUS) ==========
      systemStatus: '🔴 รอการเชื่อมต่อ',   // ← เปลี่ยนจาก 🟢 เป็น 🔴
      wsConnected: false,
      lastSignal: null,
      signalHistory: [],

      // ========== Actions ==========
      setConnectionData: (data) => set((state) => ({ ...state, ...data })),

      // ========== Actions ใหม่ ==========
      setSystemStatus: (status) => set({ systemStatus: status }),
      setWsConnected: (status) => set({ wsConnected: status }),

      // ✅ ฟังก์ชันตั้งค่า lastSignal + เก็บ history
      setLastSignal: (signal) => set((state) => {
        const newHistory = [signal, ...state.signalHistory].slice(0, 10);
        return {
          lastSignal: signal,
          signalHistory: newHistory
        };
      }),

      // ✅ เพิ่มฟังก์ชันนี้ (สำหรับ Step 1)
      addSignalToHistory: (signal) => set((state) => {
        const newHistory = [signal, ...state.signalHistory].slice(0, 50);
        return { signalHistory: newHistory };
      }),
    }),
    {
      name: "crypto-bot-storage",
    }
  )
);