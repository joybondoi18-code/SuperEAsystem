// lib/payment/binance.ts
import crypto from 'crypto';

// ✅ ประกาศ type ข้างในไฟล์นี้เลย
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

const IS_MOCK = process.env.USE_REAL_BINANCE_API !== 'true';

export async function createBinancePayIntent(input: CreateIntentInput): Promise<CreateIntentResult> {
  
  // ✅ Mock Mode (ตอนนี้)
  if (IS_MOCK) {
    const orderId = `MOCK_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    return {
      orderId: orderId,
      qrCodeContent: `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=MOCK_PAYMENT_${orderId}`,
    };
  }
  
  // ✅ Real Mode (ตอนมี VPS แล้ว)
  const merchantKey = process.env.BINANCE_PAY_MERCHANT_KEY;
  const merchantSecret = process.env.BINANCE_PAY_MERCHANT_SECRET;
  
  if (!merchantKey || !merchantSecret) {
    throw new Error("Binance Pay API keys not configured");
  }

  const merchantTradeNo = `ORDER_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
  
  const payload = {
    env: { terminalType: "WEB" },
    merchantTradeNo: merchantTradeNo,
    orderAmount: input.amount,
    currency: input.currency,
    description: input.note || `Subscription - ${input.packageType || 'Standard'}`,
    webhookUrl: `${process.env.NEXT_PUBLIC_APP_URL}/api/payment/binance-webhook`,
  };

  const timestamp = Date.now();
  const nonce = crypto.randomBytes(32).toString('hex');
  const payloadString = JSON.stringify(payload);
  const signaturePayload = `${timestamp}\n${nonce}\n${payloadString}\n`;
  const signature = crypto
    .createHmac('sha512', merchantSecret)
    .update(signaturePayload)
    .digest('hex')
    .toUpperCase();

  const response = await fetch('https://bpay.binanceapi.com/binancepay/openapi/v2/order', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'BinancePay-Timestamp': timestamp.toString(),
      'BinancePay-Nonce': nonce,
      'BinancePay-Certificate-SN': merchantKey,
      'BinancePay-Signature': signature,
    },
    body: payloadString,
  });

  const result = await response.json();
  
  if (result.status === 'SUCCESS') {
    return {
      orderId: merchantTradeNo,
      qrCodeContent: result.data.qrContent,
    };
  } else {
    throw new Error(`Binance Pay error: ${result.errorMessage || JSON.stringify(result)}`);
  }
}

// ✅ ฟังก์ชัน verify webhook signature (เพิ่มใหม่)
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