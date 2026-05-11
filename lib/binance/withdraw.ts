import ccxt from "ccxt";

const IS_MOCK = process.env.USE_REAL_BINANCE_API !== 'true';

export async function withdrawToUser(
  address: string,
  amount: number,
  asset: string = "USDT"
): Promise<{ success: boolean; txId?: string; message?: string }> {
  
  // Mock Mode
  if (IS_MOCK) {
    console.log(`[MOCK] Withdraw ${amount} ${asset} to ${address}`);
    await new Promise(resolve => setTimeout(resolve, 1000));
    return {
      success: true,
      txId: `MOCK_TX_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      message: "⚠️ Mock mode: ไม่ได้โอนเงินจริง",
    };
  }
  
  // ✅ Real Mode ใช้ Binance API จริง
  try {
    const apiKey = process.env.BINANCE_WITHDRAW_API_KEY;
    const secretKey = process.env.BINANCE_WITHDRAW_SECRET;
    
    if (!apiKey || !secretKey) {
      throw new Error("Binance Withdraw API keys not configured");
    }
    
    // ✅ ใช้ ccxt สร้าง Binance client
    const exchange = new ccxt.binance({
      apiKey: apiKey,
      secret: secretKey,
      enableRateLimit: true,
    });
    
    // ✅ ถอนเงินไปยัง address
    const result = await exchange.withdraw(asset, amount, address);
    
    console.log(`✅ Withdraw success: ${amount} ${asset} to ${address}`, result);
    
    return {
      success: true,
      txId: result.id,
      message: "ถอนเงินสำเร็จ",
    };
    
  } catch (error: any) {
    console.error("Withdraw error:", error);
    return {
      success: false,
      message: error.message || "Withdraw failed",
    };
  }
}