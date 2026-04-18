//+------------------------------------------------------------------+
//| SuperEA_Follower_API_v7.0.mq5                                    |
//| ตรวจสอบ Login ผ่าน API /api/signal-ea + เทรดตาม Global Signal    |
//+------------------------------------------------------------------+
#property strict
#property version   "7.0"
#property copyright "SuperEA"
#property link      ""

// ===================== INPUT PARAMETERS =====================
input string   API_URL = "https://yourdomain.com/api/signal-ea";
input int      PollingInterval = 5;
input int      DeviationPoints = 200;
input double   RiskPercent = 10.0;
input bool     UseFixedLot = false;
input double   FixedLot = 0.1;
input bool     DebugMode = true;

// ===================== GLOBAL VARIABLES =====================
string g_login = "";
string g_broker = "";
bool   g_verified = false;
string g_lastTimestamp = "";

//+------------------------------------------------------------------+
//| Expert initialization function                                   |
//+------------------------------------------------------------------+
int OnInit()
{
   g_login = IntegerToString(AccountInfoInteger(ACCOUNT_LOGIN));
   g_broker = AccountInfoString(ACCOUNT_COMPANY);
   
   Print("╔══════════════════════════════════════════════════════════╗");
   Print("║     SUPER EA FOLLOWER API v7.0 STARTED                  ║");
   Print("╠══════════════════════════════════════════════════════════╣");
   Print("║ Account Login: ", g_login);
   Print("║ Broker: ", g_broker);
   Print("║ API URL: ", API_URL);
   Print("║ Polling Interval: ", PollingInterval, " seconds");
   Print("╚══════════════════════════════════════════════════════════╝");
   
   // ✅ ตรวจสอบ Login กับ API
   if(CheckLoginWithAPI())
   {
      g_verified = true;
      Print("✅ IB VERIFICATION PASSED — EA can trade");
      Comment("✅ Verified | Waiting for signals...");
   }
   else
   {
      g_verified = false;
      Print("❌ IB VERIFICATION FAILED — EA will NOT trade");
      Comment("❌ Login not registered\nPlease open account via our link");
      return INIT_FAILED;
   }
   
   if(!TerminalInfoInteger(TERMINAL_TRADE_ALLOWED))
   {
      Print("⚠️ WARNING: Auto Trading is OFF!");
      Comment("⚠️ Auto Trading OFF! Please enable it.");
   }
   
   EventSetTimer(PollingInterval);
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
//| Timer function — ตรวจสอบและรับสัญญาณ                             |
//+------------------------------------------------------------------+
void OnTimer()
{
   if(!g_verified)
   {
      // ถ้ายังไม่ verified ให้ลองตรวจสอบอีกครั้ง (เผื่อ Login ถูกเพิ่มทีหลัง)
      if(CheckLoginWithAPI())
      {
         g_verified = true;
         Print("✅ IB VERIFICATION PASSED (re-check)");
         Comment("✅ Verified | Waiting for signals...");
      }
      return;
   }
   
   // ✅ รับสัญญาณจาก Global Signal
   FetchGlobalSignal();
}

//+------------------------------------------------------------------+
//| Tick function                                                    |
//+------------------------------------------------------------------+
void OnTick()
{
   // ไม่ต้องทำอะไร (ใช้ Timer แทน)
}

//+------------------------------------------------------------------+
//| ตรวจสอบ Login กับ API /api/signal-ea                             |
//+------------------------------------------------------------------+
bool CheckLoginWithAPI()
{
   string login = IntegerToString(AccountInfoInteger(ACCOUNT_LOGIN));
   string url = API_URL;
   string headers = "Content-Type: application/json";
   string body = "{\"login\":\"" + login + "\",\"broker\":\"xm\"}";
   
   char postData[];
   StringToCharArray(body, postData);
   
   char responseData[];
   string responseHeaders;
   int timeout = 5000;
   
   int res = WebRequest("POST", url, headers, timeout, postData, responseData, responseHeaders);
   
   if(res != 200)
   {
      if(DebugMode) Print("⚠️ HTTP error: ", res);
      return false;
   }
   
   string response = CharArrayToString(responseData);
   if(DebugMode) Print("📨 API Response: ", response);
   
   // ตรวจสอบว่า {"success":true}
   if(StringFind(response, "\"success\":true") >= 0)
   {
      return true;
   }
   
   return false;
}

//+------------------------------------------------------------------+
//| ดึง Global Signal จาก API (ส่วนนี้คุณปรับตาม original ได้)         |
//+------------------------------------------------------------------+
void FetchGlobalSignal()
{
   // ⚠️ ส่วนนี้คุณจะใส่โค้ด Fetch สัญญาณจาก API ของคุณเอง
   // ตัวอย่างง่ายๆ:
   /*
   string url = "https://your-signal-api.com/latest";
   char result[];
   string headers = "";
   int res = WebRequest("GET", url, headers, 5000, NULL, result, headers);
   
   if(res == 200)
   {
      string json = CharArrayToString(result);
      // แยก json แล้วเรียก OpenOrderSafe()
   }
   */
   
   // ตัวอย่าง dummy
   if(DebugMode)
   {
      static int count = 0;
      count++;
      if(count % 60 == 0) Print("⏳ Waiting for global signal...");
   }
}

// ===================== ส่วนจัดการการเทรด (จาก original ของคุณ) =====================

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
   
   if(symbol == "XAUUSD" || symbol == "GOLD")
   {
      if(StringFind(broker, "XM") >= 0) return "GOLD";
      if(StringFind(broker, "EXNESS") >= 0) return "XAUUSDm";
      return "XAUUSD";
   }
   
   if(symbol == "EURUSD")
   {
      if(StringFind(broker, "XM") >= 0) return "EURUSDm";
      return "EURUSD";
   }
   
   if(symbol == "GBPUSD")
   {
      if(StringFind(broker, "XM") >= 0) return "GBPUSDm";
      return "GBPUSD";
   }
   
   if(symbol == "USDJPY")
   {
      if(StringFind(broker, "XM") >= 0) return "USDJPYm";
      return "USDJPY";
   }
   
   string autoSymbol = FindSymbolAuto(originalSymbol);
   if(autoSymbol != "") return autoSymbol;
   
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
   
   if(point <= 0 || tick_value <= 0) return 0;
   
   double sl_points = MathAbs(entry_price - sl_price) / point;
   if(sl_points < 1) sl_points = 1;
   
   double lot = risk_amount / (sl_points * tick_value);
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
   
   if(lotStep > 0) lot = MathFloor(lot / lotStep) * lotStep;
   lot = NormalizeDouble(lot, 2);
   return lot;
}

//+------------------------------------------------------------------+
//| เปิดออเดอร์ (จาก original ของคุณ)                                 |
//+------------------------------------------------------------------+
bool OpenOrderSafe(string symbol, string side, double sl_price, double tp_price)
{
   string mappedSymbol = MapSymbolForBroker(symbol);
   
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
   }
   else if(ToUpper(side) == "SELL")
   {
      price = tick.bid;
      type = ORDER_TYPE_SELL;
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
   
   int digits = (int)SymbolInfoInteger(mappedSymbol, SYMBOL_DIGITS);
   double point = SymbolInfoDouble(mappedSymbol, SYMBOL_POINT);
   
   sl_price = NormalizeDouble(sl_price, digits);
   tp_price = NormalizeDouble(tp_price, digits);
   
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
   req.magic = 0;
   req.comment = "SuperEA-v7.0";
   req.type_filling = ORDER_FILLING_FOK;
   
   if(!OrderSend(req, res))
   {
      Print("❌ OrderSend Error: ", GetLastError());
      return false;
   }
   
   if(res.retcode != TRADE_RETCODE_DONE)
   {
      Print("❌ Order Rejected: ", res.retcode);
      return false;
   }
   
   Print("✅ ORDER SUCCESS! Ticket: ", res.order);
   return true;
}

//+------------------------------------------------------------------+ 