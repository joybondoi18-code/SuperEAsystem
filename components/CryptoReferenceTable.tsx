// components/CryptoReferenceTable.tsx
"use client";
import { useState, useEffect } from "react";

const SYMBOLS = ["BTCUSDT", "ETHUSDT", "SOLUSDT", "XRPUSDT", "DOGEUSDT", "ADAUSDT"];

export default function CryptoReferenceTable() {
  const [prices, setPrices] = useState<Record<string, number>>({});

  useEffect(() => {
    const fetchPrices = async () => {
      const results = await Promise.all(
        SYMBOLS.map(async (symbol) => {
          const res = await fetch(`https://api.binance.com/api/v3/ticker/price?symbol=${symbol}`);
          const data = await res.json();
          return { symbol, price: parseFloat(data.price) };
        })
      );
      const priceMap: Record<string, number> = {};
      results.forEach(({ symbol, price }) => { priceMap[symbol] = price; });
      setPrices(priceMap);
    };
    fetchPrices();
    const interval = setInterval(fetchPrices, 15000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
  const fetchPrices = async () => {
    // ดึงราคาจาก Binance API
  };
  fetchPrices();
  const interval = setInterval(fetchPrices, 15000); // ทุก 15 วินาที
  return () => clearInterval(interval);
}, []);

  return (
    <div className="mt-6 p-4 bg-gray-800 rounded-lg">
      <h3 className="text-sm font-semibold text-yellow-400 mb-2">
        📊 ตารางอ้างอิง Lot (Binance Spot)
      </h3>
      <p className="text-xs text-gray-400 mb-3">
        💡 1 Lot = 1 เหรียญ (เช่น SOL 1 Lot = 1 SOL)
      </p>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead className="text-gray-400 border-b border-gray-700">
            <tr>
              <th className="text-left py-2">เหรียญ</th>
              <th className="text-left py-2">ราคา (USDT)</th>
              <th className="text-left py-2">1 Lot = </th>
              <th className="text-left py-2">💰 ต้องใช้เงิน (USDT)</th>
              <th className="text-left py-2">✅ แนะนำ Lot (เริ่มต้น)</th>
            </tr>
          </thead>
          <tbody>
            {SYMBOLS.map((symbol) => {
              const price = prices[symbol] || 0;
              const valuePerLot = price; // 1 Lot = 1 เหรียญ
              const suggestedLot = valuePerLot > 0 ? (10 / valuePerLot) : 0;
              const displayLot = suggestedLot < 0.01 ? suggestedLot.toFixed(6) : suggestedLot.toFixed(2);

              return (
                <tr key={symbol} className="border-b border-gray-800">
                  <td className="py-2 font-mono">{symbol}</td>
                  <td className="py-2">${price.toFixed(4)}</td>
                  <td className="py-2">1 เหรียญ</td>
                  <td className="py-2 text-yellow-300">${valuePerLot.toFixed(4)}</td>
                  <td className="py-2 text-green-400">{displayLot}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="mt-3 p-2 bg-blue-900/30 rounded text-xs">
        <p className="text-blue-300">📌 วิธีอ่าน:</p>
        <ul className="list-disc list-inside text-gray-300 mt-1">
          <li><strong>✨ แนะนำ Lot (เริ่มต้น)</strong> = จำนวนเหรียญที่ซื้อได้ด้วยเงิน <strong>10 USDT</strong></li>
          <li>🔹 <strong>SOLUSDT</strong> ราคา $88 → Lot 0.11 = ต้องใช้เงิน ~$9.68</li>
          <li>🔹 <strong>XRPUSDT</strong> ราคา $1.41 → Lot 7.09 = ต้องใช้เงิน ~$10</li>
          <li>🔹 <strong>BTCUSDT</strong> ราคา $80,000 → Lot 0.00012 = ต้องใช้เงิน ~$9.60</li>
        </ul>
      </div>
    </div>
  );
}