// lib/binance/withdraw.ts
const IS_MOCK = process.env.USE_REAL_BINANCE_API !== 'true';

export async function withdrawToUser(
  address: string,
  amount: number,
  asset: string = "USDT"
): Promise<{ success: boolean; txId?: string; message?: string }> {
  
  // ✅ Mock Mode (ตอนนี้ยังไม่มี VPS)
  if (IS_MOCK) {
    console.log(`[MOCK] Withdraw ${amount} ${asset} to ${address}`);
    
    // สุ่ม delay เหมือนกำลังทำงาน
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return {
      success: true,
      txId: `MOCK_TX_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      message: "⚠️ Mock mode: ไม่ได้โอนเงินจริง (จะทำงานจริงเมื่อมี VPS และตั้งค่า USE_REAL_BINANCE_API=true)",
    };
  }
  
  // ✅ Real Mode (ตอนมี VPS แล้ว)
  try {
    const apiKey = process.env.BINANCE_WITHDRAW_API_KEY;
    const secretKey = process.env.BINANCE_WITHDRAW_SECRET;
    
    if (!apiKey || !secretKey) {
      throw new Error("Binance Withdraw API keys not configured");
    }
    
    // TODO: เรียก Binance API จริง
    // const result = await binanceClient.withdraw(asset, address, amount);
    
    // ชั่วคราวยังไม่ทำของจริง
    return {
      success: false,
      message: "Real withdraw not implemented yet. Please configure Binance API.",
    };
    
  } catch (error: any) {
    console.error("Withdraw error:", error);
    return {
      success: false,
      message: error.message || "Withdraw failed",
    };
  }
}