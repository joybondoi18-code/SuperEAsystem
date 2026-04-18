export function assertBotKey(headers: Headers) {
  const provided = headers.get("x-bot-key") || headers.get("X-Bot-Key");
  const expected = process.env.BOT_API_KEY;
  if (!expected || provided !== expected) return false;
  return true;
}
