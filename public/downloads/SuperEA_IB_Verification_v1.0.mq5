//+------------------------------------------------------------------+
//|        XM EA - Pending Order (รับ price, sl, tp, lot จาก Admin) |
//|        Auto SL/TP เมื่อ Admin ไม่ส่ง sl,tp                       |
//+------------------------------------------------------------------+
#property strict
#property version "2.4"

#include <Trade/Trade.mqh>
CTrade trade;

input string LOGIN_API  = "https://supertrade-ea.com/api/check";
input string SIGNAL_API = "https://supertrade-ea.com/api/signal-ib";
input int      PollingInterval = 5;
input double   RiskPercent = 10.0;
input bool     UseFixedLot = false;
input double   FixedLot = 0.01;
input bool     Debug = true;

string g_login;
bool   g_verified = false;

int OnInit()
{
   g_login = IntegerToString(AccountInfoInteger(ACCOUNT_LOGIN));
   Print("🚀 XM PENDING EA STARTED | Login: ", g_login);
   if(UseFixedLot) Print("   Using Fixed Lot: ", FixedLot);
   else Print("   Using RiskPercent: ", RiskPercent, "%");
   if(CheckLogin()) { g_verified = true; Print("✅ Login verified"); }
   else Print("❌ Login not verified");
   EventSetTimer(PollingInterval);
   return INIT_SUCCEEDED;
}

void OnDeinit(int reason) { EventKillTimer(); }
void OnTimer()
{
   if(!g_verified) g_verified = CheckLogin();
   else FetchSignal();
}

bool CheckLogin()
{
   string url = LOGIN_API + "?mt5_login=" + g_login;
   char result[], postData[];
   string headers;
   ResetLastError();
   int res = WebRequest("GET", url, headers, 5000, postData, result, headers);
   if(res != 200) { if(Debug) Print("❌ Login HTTP: ", res); return false; }
   string response = CharArrayToString(result);
   if(Debug) Print("📨 Login: ", response);
   return StringFind(response, "\"status\":\"allow\"") >= 0;
}

void FetchSignal()
{
   char result[], postData[];
   string headers;
   ResetLastError();
   int res = WebRequest("GET", SIGNAL_API, headers, 5000, postData, result, headers);
   if(res != 200) { if(Debug) Print("❌ Signal HTTP: ", res); return; }
   string response = CharArrayToString(result);
   if(Debug) Print("📨 Signal: ", response);
   if(StringFind(response, "\"status\":\"ok\"") < 0) return;

   string type = GetJSONValue(response, "type");
   if(type != "pending") return;

   string symbol = GetJSONValue(response, "symbol");
   string side   = GetJSONValue(response, "side");
   string priceStr = GetJSONValue(response, "price");
   string slStr    = GetJSONValue(response, "sl");
   string tpStr    = GetJSONValue(response, "tp");
   string lotStr   = GetJSONValue(response, "lot");
   string time     = GetJSONValue(response, "time");

   // ✅ ต้องการ price เสมอ
   if(symbol == "" || side == "" || priceStr == "") return;
   static string lastTime = "";
   if(time == lastTime) return;
   lastTime = time;

   double price = StringToDouble(priceStr);
   double sl = 0, tp = 0;

   // ✅ ถ้ามี sl, tp → ใช้ค่า ถ้าไม่มี → คำนวณเอง
   if(slStr != "" && tpStr != "") {
      sl = StringToDouble(slStr);
      tp = StringToDouble(tpStr);
      if(Debug) Print("📌 Manual SL/TP: SL=", sl, " TP=", tp);
   } else {
      double point = SymbolInfoDouble(symbol, SYMBOL_POINT);
      if(side == "BUY") {
         sl = price - 1000 * point;
         tp = price + 2000 * point;
      } else {
         sl = price + 1000 * point;
         tp = price - 2000 * point;
      }
      if(Debug) Print("⚙️ Auto SL/TP: SL=", sl, " TP=", tp);
   }

   double lot;
   if(lotStr != "") {
      lot = StringToDouble(lotStr);
      if(lot < 0.01) lot = 0.01;
      if(Debug) Print("📌 Using lot from API: ", lot);
   }
   else if(UseFixedLot) {
      lot = FixedLot;
      if(Debug) Print("📌 Using FixedLot: ", lot);
   }
   else {
      lot = CalculateLot(symbol, price, sl);
      if(Debug) Print("📌 Calculated lot: ", lot);
   }

   Print("🚀 Pending Signal: ", symbol, " ", side, " @", price, " Lot=", lot, " SL=", sl, " TP=", tp);
   PlacePendingOrder(symbol, side, price, lot, sl, tp);
}

double CalculateLot(string symbol, double price, double sl)
{
   double balance   = AccountInfoDouble(ACCOUNT_BALANCE);
   double riskMoney = balance * RiskPercent / 100.0;
   double point = SymbolInfoDouble(symbol, SYMBOL_POINT);
   double tickValue = SymbolInfoDouble(symbol, SYMBOL_TRADE_TICK_VALUE);
   double slPoints = MathAbs(price - sl) / point;
   if(slPoints < 1) slPoints = 1;
   if(point <= 0 || tickValue <= 0) return 0.01;
   double lot = riskMoney / (slPoints * tickValue);
   double minLot = SymbolInfoDouble(symbol, SYMBOL_VOLUME_MIN);
   double maxLot = SymbolInfoDouble(symbol, SYMBOL_VOLUME_MAX);
   double lotStep = SymbolInfoDouble(symbol, SYMBOL_VOLUME_STEP);
   if(lot < minLot) lot = minLot;
   if(lot > maxLot) lot = maxLot;
   if(lotStep > 0) lot = MathFloor(lot / lotStep) * lotStep;
   return NormalizeDouble(lot, 2);
}

void PlacePendingOrder(string symbol, string side, double price, double lot, double sl, double tp)
{
   if(!TerminalInfoInteger(TERMINAL_TRADE_ALLOWED)) { Print("❌ Auto Trading disabled"); return; }
   if(!SymbolSelect(symbol, true)) { Print("❌ Symbol not found: ", symbol); return; }

   MqlTick tick;
   if(!SymbolInfoTick(symbol, tick)) { Print("❌ Cannot get tick"); return; }

   ENUM_ORDER_TYPE type;
   if(side == "BUY") type = ORDER_TYPE_BUY_STOP;
   else type = ORDER_TYPE_SELL_STOP;

   int digits = (int)SymbolInfoInteger(symbol, SYMBOL_DIGITS);
   price = NormalizeDouble(price, digits);
   sl    = NormalizeDouble(sl, digits);
   tp    = NormalizeDouble(tp, digits);

   MqlTradeRequest req = {};
   MqlTradeResult  res = {};
   req.action = TRADE_ACTION_PENDING;
   req.symbol = symbol;
   req.volume = lot;
   req.type = type;
   req.price = price;
   req.sl = sl;
   req.tp = tp;
   req.deviation = 200;
   req.comment = "XM Pending Order";
   req.type_filling = ORDER_FILLING_RETURN;

   if(OrderSend(req, res))
   {
      if(res.retcode == TRADE_RETCODE_DONE)
         Print("✅ Pending order placed | Ticket: ", res.order);
      else
         Print("❌ Pending order failed | Retcode: ", res.retcode);
   }
   else Print("❌ OrderSend error: ", GetLastError());
}

string GetJSONValue(string json, string key)
{
   string search = "\"" + key + "\":";
   int pos = StringFind(json, search);
   if(pos < 0) return "";
   pos += StringLen(search);
   while(pos < StringLen(json))
   {
      char c = StringGetCharacter(json, pos);
      if(c != '"' && c != ' ' && c != ':') break;
      pos++;
   }
   string out = "";
   while(pos < StringLen(json))
   {
      char c = StringGetCharacter(json, pos);
      if(c == '"' || c == ',' || c == '}') break;
      out += CharToString(c);
      pos++;
   }
   return out;
}