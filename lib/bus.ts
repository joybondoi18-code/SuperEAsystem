import Redis from "ioredis";
const url = process.env.REDIS_URL || "redis://localhost:6379";
let pubInstance: any = null;
export function pub() { if (!pubInstance) pubInstance = new Redis(url); return pubInstance; }
export const CHANNEL_CONTROL = "tradebot:control";
export async function broadcastControl(message: any) {
  const payload = JSON.stringify(message);
  await pub().publish(CHANNEL_CONTROL, payload);
}
