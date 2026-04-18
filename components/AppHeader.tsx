"use client";
import { useState, useEffect } from "react";

export default function AppHeader() {
  const [appName, setAppName] = useState("⚡ เทรดบอท");

  useEffect(() => {
    setAppName("⚡ TradeBot");
  }, []);

  return <div className="text-lg font-bold">{appName}</div>;
}