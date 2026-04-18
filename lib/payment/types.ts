// lib/payment/types.ts
export type CreateIntentInput = { 
  amount: number; 
  currency: string; 
  note?: string;
  packageType?: 'STANDARD' | 'PREMIUM';  // ✅ เพิ่ม optional
};

export type CreateIntentResult = { 
  orderId: string; 
  payUrl?: string; 
  qrCodeContent?: string; 
};