//+------------------------------------------------------------------+
//| SuperEA_Follower_API_v6.1.mq5                                    |
//| แก้ไข Order Filling Mode + Magic Number                          |
//+------------------------------------------------------------------+
#property strict
#property version   "6.10"
#property copyright "SuperEA"
#property link      ""

// ===================== INPUT PARAMETERS =====================
input string   API_KEY = "";
input string   API_URL = "http://192.168.43.217:3000/api/ea/signal";
input int      PollingInterval = 5;
input int      DeviationPoints = 200;
input double   RiskPercent = 10.0;
input bool     UseFixedLot = false;
input double   FixedLot = 0.1;
input bool     DebugMode = true;

// ===================== GLOBAL VARIABLES =====================
string g_login = "";
string g_broker = "";
string g_lastTimestamp = "";
int g_signalCount = 0;

//+------------------------------------------------------------------+
//| Expert initialization function                                   |
//+------------------------------------------------------------------+
int OnInit()
{
   g_login = IntegerToString(AccountInfoInteger(ACCOUNT_LOGIN));
   g_broker = AccountInfoString(ACCOUNT_COMPANY);
   
   Print("╔══════════════════════════════════════════════════════════╗");
   Print("║     SUPER EA FOLLOWER API v6.1 STARTED                  ║");
   Print("╠══════════════════════════════════════════════════════════╣");
   Print("║ Account Login: ", g_login);
   Print("║ Broker: ", g_broker);
   Print("║ API URL: ", API_URL);
   Print("║ Polling Interval: ", PollingInterval, " seconds");
   Print("║ Risk Percent: ", RiskPercent, "%");
   Print("║ Use Fixed Lot: ", UseFixedLot);
   if(UseFixedLot) Print("║ Fixed Lot: ", FixedLot);
   Print("╚══════════════════════════════════════════════════════════╝");
   
   if(API_KEY == "")
   {
      Print("❌ ERROR: API_KEY is empty!");
      Print("👉 Please enter your API Key in EA properties");
      Comment("❌ Please set API_KEY");
      return INIT_FAILED;
   }
   
   if(!TerminalInfoInteger(TERMINAL_TRADE_ALLOWED))
   {
      Print("⚠️ WARNING: Auto Trading is OFF!");
      Comment("⚠️ Auto Trading OFF! Please enable it.");
   }
   
   EventSetTimer(PollingInterval);
   Print("✅ EA initialized successfully!");
   Comment("✅ EA Ready | Waiting for global signals...");
   
   return INIT_SUCCEEDED;
}

//+------------------------------------------------------------------+
//| Expert deinitialization function                                 |
//+------------------------------------------------------------------+
void OnDeinit(const int reason)
{
   EventKillTimer();
   Print("EA Stopped. Reason: ", reason);
   Comment("");
}

//+------------------------------------------------------------------+
//| Timer function                                                   |
//+------------------------------------------------------------------+
void OnTimer()
{
   if(API_KEY != "") FetchSignal();
   else Comment("❌ No API Key!");
}

//+------------------------------------------------------------------+
//| Tick function                                                    |
//+------------------------------------------------------------------+
void OnTick() { }

//+------------------------------------------------------------------+
//| อ่านค่า JSON แบบ Flat                                            |
//+------------------------------------------------------------------+
string GetJSONValue(string json, string key)
{
   string searchKey = "\"" + key + "\"";
   int keyPos = StringFind(json, searchKey);
   if(keyPos < 0) return "";
   
   int colonPos = StringFind(json, ":", keyPos);
   if(colonPos < 0) return "";
   
   colonPos++;
   while(colonPos < StringLen(json) && 
         (StringSubstr(json, colonPos, 1) == " " || 
          StringSubstr(json, colonPos, 1) == "\t"))
   {
      colonPos++;
   }
   
   if(StringSubstr(json, colonPos, 1) == "\"")
   {
      int endQuote = StringFind(json, "\"", colonPos + 1);
      if(endQuote < 0) return "";
      return StringSubstr(json, colonPos + 1, endQuote - colonPos - 1);
   }
   
   int endPos = colonPos;
   while(endPos < StringLen(json))
   {
      string ch = StringSubstr(json, endPos, 1);
      if(ch == "," || ch == "}" || ch == "]") break;
      endPos++;
   }
   
   string value = StringSubstr(json, colonPos, endPos - colonPos);
   StringTrimLeft(value);
   StringTrimRight(value);
   return value;
}

//+------------------------------------------------------------------+
//| แปลงเป็นตัวพิมพ์ใหญ่                                             |
//+------------------------------------------------------------------+
string ToUpper(string str)
{
   string result = "";
   for(int i = 0; i < StringLen(str); i++)
   {
      int ch = StringGetCharacter(str, i);
      if(ch >= 97 && ch <= 122) ch -= 32;
      result += StringFormat("%c", ch);
   }
   return result;
}

//+------------------------------------------------------------------+
//| ค้นหา Symbol อัตโนมัติ                                            |
//+------------------------------------------------------------------+
string FindSymbolAuto(string searchSymbol)
{
   searchSymbol = ToUpper(searchSymbol);
   
   for(int i = 0; i < SymbolsTotal(false); i++)
   {
      string sym = SymbolName(i, false);
      string symUpper = ToUpper(sym);
      
      if(StringFind(symUpper, searchSymbol) >= 0)
      {
         Print("✅ Auto-found symbol: ", sym, " for ", searchSymbol);
         return sym;
      }
   }
   
   return "";
}

//+------------------------------------------------------------------+
//| แปลงชื่อสัญลักษณ์ตาม Broker                                      |
//+------------------------------------------------------------------+
string MapSymbolForBroker(string symbol)
{
   string broker = ToUpper(g_broker);
   string originalSymbol = symbol;
   symbol = ToUpper(symbol);
   
   Print("🔍 Mapping: ", originalSymbol, " for broker: ", broker);
   
   if(symbol == "XAUUSD" || symbol == "GOLD")
   {
      if(StringFind(broker, "XM") >= 0) return "GOLD";
      if(StringFind(broker, "EXNESS") >= 0) return "XAUUSDm";
      return "XAUUSD";
   }
   
   if(symbol == "EURUSD")
   {
      if(StringFind(broker, "XM") >= 0) return "EURUSDm";
      if(StringFind(broker, "EXNESS") >= 0) return "EURUSDm";
      return "EURUSD";
   }
   
   if(symbol == "GBPUSD")
   {
      if(StringFind(broker, "XM") >= 0) return "GBPUSDm";
      if(StringFind(broker, "EXNESS") >= 0) return "GBPUSDm";
      return "GBPUSD";
   }
   
   if(symbol == "USDJPY")
   {
      if(StringFind(broker, "XM") >= 0) return "USDJPYm";
      if(StringFind(broker, "EXNESS") >= 0) return "USDJPYm";
      return "USDJPY";
   }
   
   string autoSymbol = FindSymbolAuto(originalSymbol);
   if(autoSymbol != "") return autoSymbol;
   
   Print("⚠️ Could not map symbol: ", originalSymbol, " using as-is");
   return originalSymbol;
}

//+------------------------------------------------------------------+
//| คำนวณ Lot Size                                                  |
//+------------------------------------------------------------------+
double CalculateLotSafe(string symbol, double entry_price, double sl_price)
{
   double balance = AccountInfoDouble(ACCOUNT_BALANCE);
   double risk_amount = balance * RiskPercent / 100.0;
   
   double point = SymbolInfoDouble(symbol, SYMBOL_POINT);
   double tick_value = SymbolInfoDouble(symbol, SYMBOL_TRADE_TICK_VALUE);
   
   if(point <= 0 || tick_value <= 0)
   {
      Print("❌ Invalid point/tick value for ", symbol);
      return 0;
   }
   
   double sl_points = MathAbs(entry_price - sl_price) / point;
   if(sl_points < 1) sl_points = 1;
   
   double lot = risk_amount / (sl_points * tick_value);
   
   if(DebugMode)
   {
      Print("🔢 Lot Calc: Balance=", DoubleToString(balance, 2), 
            " Risk%=", RiskPercent,
            " SL_Points=", DoubleToString(sl_points, 0),
            " RawLot=", DoubleToString(lot, 4));
   }
   
   return lot;
}

//+------------------------------------------------------------------+
//| Normalize Lot                                                    |
//+------------------------------------------------------------------+
double NormalizeLot(string symbol, double lot)
{
   double minLot = SymbolInfoDouble(symbol, SYMBOL_VOLUME_MIN);
   double maxLot = SymbolInfoDouble(symbol, SYMBOL_VOLUME_MAX);
   double lotStep = SymbolInfoDouble(symbol, SYMBOL_VOLUME_STEP);
   
   if(lot <= 0 || lot < minLot) lot = minLot;
   if(lot > maxLot) lot = maxLot;
   
   if(lotStep > 0)
   {
      lot = MathFloor(lot / lotStep) * lotStep;
   }
   
   lot = NormalizeDouble(lot, 2);
   if(DebugMode) Print("📊 Normalized Lot: ", lot, " (Min=", minLot, ")");
   return lot;
}

//+------------------------------------------------------------------+
//| เปิดออเดอร์ (แก้ไขแล้ว)                                          |
//+------------------------------------------------------------------+
bool OpenOrderSafe(string symbol, string side, double sl_price, double tp_price)
{
   string mappedSymbol = MapSymbolForBroker(symbol);
   
   Print("📊 Symbol Mapping: ", symbol, " -> ", mappedSymbol);
   
   if(mappedSymbol == "")
   {
      Print("❌ Invalid mapped symbol");
      return false;
   }
   
   if(!SymbolSelect(mappedSymbol, true))
   {
      Print("❌ Cannot select symbol: ", mappedSymbol);
      return false;
   }
   
   if(!TerminalInfoInteger(TERMINAL_TRADE_ALLOWED))
   {
      Print("❌ Auto Trading is disabled!");
      return false;
   }
   
   MqlTick tick;
   if(!SymbolInfoTick(mappedSymbol, tick))
   {
      Print("❌ Cannot get tick for ", mappedSymbol);
      return false;
   }
   
   double price;
   ENUM_ORDER_TYPE type;
   
   if(ToUpper(side) == "BUY")
   {
      price = tick.ask;
      type = ORDER_TYPE_BUY;
      Print("📈 BUY at ", DoubleToString(price, 5));
   }
   else if(ToUpper(side) == "SELL")
   {
      price = tick.bid;
      type = ORDER_TYPE_SELL;
      Print("📉 SELL at ", DoubleToString(price, 5));
   }
   else
   {
      Print("❌ Invalid side: ", side);
      return false;
   }
   
   double lot;
   if(UseFixedLot)
   {
      lot = FixedLot;
   }
   else
   {
      lot = CalculateLotSafe(mappedSymbol, price, sl_price);
   }
   
   lot = NormalizeLot(mappedSymbol, lot);
   if(lot <= 0)
   {
      Print("❌ Invalid lot: ", lot);
      return false;
   }
   
   double marginRequired = SymbolInfoDouble(mappedSymbol, SYMBOL_MARGIN_INITIAL) * lot;
   double freeMargin = AccountInfoDouble(ACCOUNT_MARGIN_FREE);
   if(marginRequired > freeMargin)
   {
      Print("❌ Not enough margin! Required: ", DoubleToString(marginRequired, 2), 
            " Free: ", DoubleToString(freeMargin, 2));
      return false;
   }
   
   int digits = (int)SymbolInfoInteger(mappedSymbol, SYMBOL_DIGITS);
   double point = SymbolInfoDouble(mappedSymbol, SYMBOL_POINT);
   
   sl_price = NormalizeDouble(sl_price, digits);
   tp_price = NormalizeDouble(tp_price, digits);
   
   long stopLevel = SymbolInfoInteger(mappedSymbol, SYMBOL_TRADE_STOPS_LEVEL);
   double minStopDistance = stopLevel * point;
   
   if(sl_price > 0)
   {
      double slDistance = MathAbs(price - sl_price);
      if(slDistance < minStopDistance && slDistance > 0)
      {
         if(type == ORDER_TYPE_BUY)
            sl_price = price - minStopDistance;
         else
            sl_price = price + minStopDistance;
         sl_price = NormalizeDouble(sl_price, digits);
         Print("⚠️ Adjusted SL to ", sl_price);
      }
   }
   
   if(tp_price > 0)
   {
      double tpDistance = MathAbs(tp_price - price);
      if(tpDistance < minStopDistance && tpDistance > 0)
      {
         if(type == ORDER_TYPE_BUY)
            tp_price = price + minStopDistance;
         else
            tp_price = price - minStopDistance;
         tp_price = NormalizeDouble(tp_price, digits);
         Print("⚠️ Adjusted TP to ", tp_price);
      }
   }
   
   MqlTradeRequest req = {};
   MqlTradeResult res = {};
   
   req.action = TRADE_ACTION_DEAL;
   req.symbol = mappedSymbol;
   req.volume = lot;
   req.type = type;
   req.price = price;
   req.sl = sl_price;
   req.tp = tp_price;
   req.deviation = DeviationPoints;
   req.magic = 0;  // ✅ เปลี่ยน Magic Number เป็น 0 (Broker กำหนดเอง)
   req.comment = "API-Signal-v6.1";
   
   // ✅ เปลี่ยน Filling Mode: ลอง ORDER_FILLING_FOK ก่อน
   req.type_filling = ORDER_FILLING_FOK;
   
   Print("🚀 Sending Order: ", mappedSymbol, " ", side, " Lot=", lot, " Magic=0");
   
   if(!OrderSend(req, res))
   {
      int error = GetLastError();
      Print("❌ OrderSend Error: ", error);
      return false;
   }
   
   if(res.retcode != TRADE_RETCODE_DONE)
   {
      Print("❌ Order Rejected: ", res.retcode);
      return false;
   }
   
   Print("✅✅✅ ORDER SUCCESS! Ticket: ", res.order);
   g_signalCount++;
   Comment("✅ Order OK on ", mappedSymbol, " Ticket: ", res.order);
   
   return true;
}

//+------------------------------------------------------------------+
//| ดึง Global Signal จาก API                                        |
//+------------------------------------------------------------------+
void FetchSignal()
{
   if(API_KEY == "")
   {
      Comment("❌ No API Key");
      return;
   }
   
   string mt5Login = IntegerToString(AccountInfoInteger(ACCOUNT_LOGIN));
   string url = API_URL + "?apiKey=" + API_KEY + "&mt5Login=" + mt5Login;
   
   char result[];
   string headers = "";
   int timeout = 5000;
   char postData[];
   
   int res = WebRequest("GET", url, headers, timeout, postData, result, headers);
   
   if(res != 200)
   {
      if(DebugMode) Print("⚠️ HTTP: ", res);
      Comment("⏳ HTTP:", res);
      return;
   }
   
   string json = CharArrayToString(result);
   Print("📨 RAW: ", json);
   
   string status = GetJSONValue(json, "status");
   Print("Status: ", status);
   
   if(status == "waiting" || status == "")
   {
      Comment("Waiting for global signal...");
      return;
   }
   
   if(status == "expired")
   {
      Print("⏰ Signal expired");
      Comment("Signal expired");
      return;
   }
   
   if(status != "active")
   {
      Comment("Unknown status: ", status);
      return;
   }
   
   string action = GetJSONValue(json, "action");
   string symbol = GetJSONValue(json, "symbol");
   string side = GetJSONValue(json, "side");
   string timestamp = GetJSONValue(json, "timestamp");
   
   double sl = StringToDouble(GetJSONValue(json, "sl"));
   double tp = StringToDouble(GetJSONValue(json, "tp"));
   
   StringTrimLeft(symbol);
   StringTrimRight(symbol);
   
   Print("📡 Global Signal: ", side, " ", symbol, " SL=", sl, " TP=", tp, " TS=", timestamp);
   
   if(ToUpper(action) != "OPEN")
   {
      Print("❌ Invalid action: ", action);
      return;
   }
   
   if(ToUpper(side) != "BUY" && ToUpper(side) != "SELL")
   {
      Print("❌ Invalid side: ", side);
      return;
   }
   
   if(timestamp != "" && timestamp == g_lastTimestamp)
   {
      if(DebugMode) Print("⏸️ Duplicate global signal ignored (same timestamp)");
      return;
   }
   
   if(timestamp == "")
   {
      string signalHash = side + "|" + symbol + "|" + DoubleToString(sl, 5);
      static string lastHash = "";
      if(signalHash == lastHash)
      {
         if(DebugMode) Print("⏸️ Duplicate signal ignored");
         return;
      }
      lastHash = signalHash;
   }
   else
   {
      g_lastTimestamp = timestamp;
   }
   
   Print("🚀 Processing global signal for: ", symbol);
   
   if(OpenOrderSafe(symbol, side, sl, tp))
   {
      Print("✅ Order executed on ", symbol);
   }
   else
   {
      Print("❌ Order failed on ", symbol);
   }
}

//+------------------------------------------------------------------+ 