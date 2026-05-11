// lib/payment/binance.ts
import crypto from 'crypto';

export type CreateIntentInput = { 
  amount: number; 
  currency: string; 
  note?: string;
  packageType?: 'STANDARD' | 'PREMIUM';
};

export type CreateIntentResult = { 
  orderId: string; 
  payUrl?: string; 
  qrCodeContent?: string; 
};

// ❌ ปิดการทำงานของ Binance Pay (ใช้ Wallet Address แทน)
export async function createBinancePayIntent(input: CreateIntentInput): Promise<CreateIntentResult> {
  throw new Error("Binance Pay is disabled. Please use wallet address payment.");
}

// ✅ เก็บฟังก์ชัน verify webhook ไว้ (เผื่อใช้ทีหลัง)
export async function verifyBinanceWebhookSignature(
  headers: Headers,
  bodyText: string
): Promise<boolean> {
  const merchantSecret = process.env.BINANCE_PAY_MERCHANT_SECRET;
  
  if (!merchantSecret) {
    console.warn("BINANCE_PAY_MERCHANT_SECRET not set");
    return false;
  }

  const signature = headers.get("BinancePay-Signature");
  const timestamp = headers.get("BinancePay-Timestamp");
  const nonce = headers.get("BinancePay-Nonce");
  
  if (!signature || !timestamp || !nonce) {
    console.warn("Missing required headers");
    return false;
  }

  const signaturePayload = `${timestamp}\n${nonce}\n${bodyText}\n`;
  
  const expectedSignature = crypto
    .createHmac('sha512', merchantSecret)
    .update(signaturePayload)
    .digest('hex')
    .toUpperCase();

  return signature === expectedSignature;
}