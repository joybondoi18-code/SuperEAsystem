// lib/tron/check-payment.ts

const TRONGRID_API = "https://api.trongrid.io";
const USDT_CONTRACT = "TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t"; // USDT (TRC20) contract

export interface TransferEvent {
  txId: string;
  from: string;
  to: string;
  amount: number;
  memo: string;
  timestamp: number;
}

/**
 * ตรวจสอบ USDT transfer ที่เกิดขึ้นล่าสุด (ย้อนหลัง maxMinutes)
 */
export async function getRecentUSDTTransfers(
  address: string,
  maxMinutes: number = 10
): Promise<TransferEvent[]> {
  const sinceTimestamp = Date.now() - maxMinutes * 60 * 1000;
  const sinceBlock = await getBlockNumberByTimestamp(sinceTimestamp);
  
  const url = `${TRONGRID_API}/v1/contracts/${USDT_CONTRACT}/events?` + 
    `event_name=Transfer&` +
    `to=${address}&` +
    `only_confirmed=true&` +
    `min_block_timestamp=${sinceTimestamp}`;
  
  const response = await fetch(url);
  const data = await response.json();
  
  if (!data.data) return [];
  
  return data.data
    .map((event: any) => ({
      txId: event.transaction_id,
      from: event.result.from,
      to: event.result.to,
      amount: Number(event.result.value) / 1_000_000, // USDT มี 6 decimal places
      memo: event.result.memo ? hexToString(event.result.memo) : "",
      timestamp: event.block_timestamp,
    }))
    .filter((t: TransferEvent) => t.to.toLowerCase() === address.toLowerCase());
}

/**
 * แปลง hex string เป็น text
 */
function hexToString(hex: string): string {
  if (!hex) return "";
  try {
    return Buffer.from(hex.replace(/^0x/, ""), "hex").toString("utf8");
  } catch {
    return "";
  }
}

/**
 * ดึง block number จาก timestamp
 */
async function getBlockNumberByTimestamp(timestamp: number): Promise<number> {
  const response = await fetch(`${TRONGRID_API}/wallet/getblockbylatestnum`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ num: 1 }),
  });
  const data = await response.json();
  return data.block_header?.raw_data?.number || 0;
}

/**
 * ตรวจสอบว่ามีการโอน USDT มาที่ address พร้อม memo ตรงกันหรือไม่
 */
export async function verifyUSDTTransfer(
  address: string,
  expectedMemo: string,
  expectedAmount?: number,
  maxMinutes: number = 10
): Promise<{ success: boolean; txId?: string; amount?: number }> {
  const transfers = await getRecentUSDTTransfers(address, maxMinutes);
  
  const matched = transfers.find(t => 
    t.memo === expectedMemo && 
    (expectedAmount ? Math.abs(t.amount - expectedAmount) < 0.01 : true)
  );
  
  if (matched) {
    return {
      success: true,
      txId: matched.txId,
      amount: matched.amount,
    };
  }
  
  return { success: false };
}