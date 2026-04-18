"use client";
import { useState, useEffect, useRef } from "react";
import { useBotStore } from "./store";

export default function Page() {
  const { symbol, timeframe } = useBotStore();
  const [candles, setCandles] = useState([]);
  const [statusMessage, setStatusMessage] = useState("🧠 กำลังตรวจจับสัญญาณ...");
  const chartContainerRef = useRef(null);
  const chartRef = useRef(null);
  const candleSeriesRef = useRef(null);
  const wsRef = useRef(null);

  const [rsiData, setRsiData] = useState([]);
  const [divergenceData, setDivergenceData] = useState(null);
  const [displaySymbol, setDisplaySymbol] = useState(symbol);

  async function fetchCandles(symbol, timeframe) {
    try {
      const res = await fetch("/api/candles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ symbol, timeframe }),
      });

      if (!res.ok) return [];

      const data = await res.json();

      if (data.rsiValues) setRsiData(data.rsiValues);
      if (data.divergence) setDivergenceData(data.divergence);

      return data.candles || [];
    } catch (err) {
      console.error("❌ โหลดกราฟไม่สำเร็จ:", err);
      return [];
    }
  }

  // เรียก dataEngine ทุกครั้งที่มี candles ใหม่
  useEffect(() => {
    if (!symbol || !timeframe || candles.length === 0) return;

    const analyzeSignal = async () => {
      try {
        const res = await fetch("/api/connect", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ symbol, timeframe }),
        });
        const data = await res.json();
        if (data.signal) {
          console.log("📊 สัญญาณจาก dataEngine:", data.signal);
        }
      } catch (err) {
        console.error("❌ เรียก dataEngine ล้มเหลว:", err);
      }
    };
    
    analyzeSignal();
  }, [symbol, timeframe, candles]);

  // อัปเดต displaySymbol เมื่อพิมพ์เสร็จ (debounce)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (symbol && symbol.length >= 6 && symbol.includes('USDT')) {
        setDisplaySymbol(symbol);
      }
    }, 600);

    return () => clearTimeout(timer);
  }, [symbol]);

  // ใช้ displaySymbol ในการโหลดกราฟ
  useEffect(() => {
    if (!displaySymbol || !timeframe) return;

    fetchCandles(displaySymbol, timeframe).then((data) => {
      if (data.length > 0) setCandles(data);
    });
  }, [displaySymbol, timeframe]);

  // useEffect สำหรับสร้างกราฟและ WebSocket
  useEffect(() => {
    if (!(symbol && timeframe)) return; 

    let isMounted = true;

    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    if (chartContainerRef.current) {
      chartContainerRef.current.innerHTML = "";
    }
    chartRef.current = null;
    candleSeriesRef.current = null;

    console.log(`🔄 โหลดข้อมูล ${symbol} ${timeframe}...`);

    fetchCandles(symbol, timeframe).then((data) => {
      if (!isMounted || data.length === 0) return;

      setCandles(data);

      import("lightweight-charts").then((module) => {
        if (!chartContainerRef.current || !isMounted) return;

        const createChart = module.createChart || module.default.createChart;
        const chart = createChart(chartContainerRef.current, {
          width: chartContainerRef.current.clientWidth,
          height: 500,
          layout: {
            background: { color: "#0d1117" },
            textColor: "#d1d5db",
          },
          grid: {
            vertLines: { color: "#1f2937" },
            horzLines: { color: "#1f2937" },
          },
          timeScale: { borderColor: "#485c7b" },
        });

        const candleSeries = chart.addCandlestickSeries({
          upColor: "#26a69a",
          downColor: "#ef5350",
          borderUpColor: "#26a69a",
          borderDownColor: "#ef5350",
          wickUpColor: "#26a69a",
          wickDownColor: "#ef5350",
        });

        const sortedCandles = [...data]
          .sort((a, b) => new Date(a.time) - new Date(b.time))
          .filter((c, i, arr) => i === 0 || new Date(c.time) > new Date(arr[i - 1].time));

        const chartData = sortedCandles.map((c) => ({
          time: Math.floor(new Date(c.time).getTime() / 1000),
          open: c.open,
          high: c.high,
          low: c.low,
          close: c.close,
        }));

        candleSeries.setData(chartData);

        chartRef.current = chart;
        candleSeriesRef.current = candleSeries;
      });
    });

    return () => {
      isMounted = false;
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [symbol, timeframe]);

  // จัดการขนาดกราฟตอน resize
  useEffect(() => {
    const handleResize = () => {
      if (chartRef.current && chartContainerRef.current) {
        chartRef.current.applyOptions({
          width: chartContainerRef.current.clientWidth,
        });
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <div className="p-6 text-gray-300">
      <h1 className="text-2xl text-yellow-400 mb-4 font-bold">
        📊 กราฟแท่งเทียน {symbol} ({timeframe})
      </h1>

      {candles.length === 0 ? (
        <p className="text-gray-500 mt-10 text-center">⏳ กำลังโหลดข้อมูลกราฟ...</p>
      ) : (
        <>
          <div
            ref={chartContainerRef}
            className="mt-6 bg-gray-900 p-4 rounded-lg shadow-lg h-[500px]"
          />
          <p className="mt-3 text-sm text-cyan-400 text-center">{statusMessage}</p>
        </>
      )}
    </div>
  );
}