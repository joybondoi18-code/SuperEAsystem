export default function Home() {
  return (
    <div className="flex flex-col md:grid md:grid-cols-2 gap-6 items-center px-4 py-6">
      {/* Left side */}
        <div className="w-full">
        <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold leading-tight">
        ระบบบอทเทรดแบบรวมศูนย์{" "}
        <span className="whitespace-nowrap">Forex + Crypto</span>
      </h1>

        <p className="text-slate-300 mt-3 text-xs sm:text-sm md:text-base">
          🚀 สมัครใช้งานฟรี
          <br className="block sm:hidden" />
          🚀 มีรูปแบบการใช้งานหลากหลายให้เลือก
          <br className="block sm:hidden" />
          
        </p>

        {/* ✅ กลยุทธ์ของระบบ (responsive) */}
        <div className="mt-6 p-4 sm:p-5 bg-gray-800/70 border-l-4 border-green-500 rounded-md shadow-md">
          <p className="text-lg sm:text-xl md:text-2xl font-bold text-green-400 mb-2">
            🎯 กลยุทธ์ของระบบ:
          </p>
          <ul className="list-disc list-inside text-sm sm:text-base md:text-lg text-slate-200 space-y-1">
            <li>ไม่เทรดมั่ว</li>
            <li>ไม่ฝืนตลาด</li>
            <li>เลือกเฉพาะจังหวะที่ได้เปรียบจริง</li>
          </ul>
          <p className="text-sm sm:text-base md:text-lg text-slate-200 mt-3">
            📊 ดังนั้นบางช่วงอาจไม่มีออเดอร์<br />
            แต่นั่นคือการ “ป้องกันความเสี่ยง” และรักษากำไรระยะยาว
          </p>
          <p className="text-sm sm:text-base md:text-lg text-slate-300 mt-3 italic font-medium">
            💡 ระบบของเราไม่ได้ออกแบบมาเพื่อรวยเร็ว<br />
            แต่ออกแบบมาเพื่ออยู่รอดและเติบโตในระยะยาว
          </p>
        </div>

        <div className="mt-6 flex gap-3">
          <a className="btn w-full sm:w-auto text-center" href="/auth">
            เข้าสู่ระบบ / สมัคร
          </a>
        </div>
      </div>

      {/* Right side - Features (responsive) */}
      <div className="card w-full mt-6 md:mt-0">
        <ul className="space-y-3 text-sm sm:text-base md:text-lg">
          <li>📡 EA รับสัญญาณจากเซิร์ฟเวอร์กลาง เพื่อเปิดออเดอร์ใน MT5 อัตโนมัติ</li>
          <li>💰 คำนวณ Lot จากต้นทุน อัตโนมัติตาม % Risk หรือใช้ Fixed Lot</li>
          <li>🛑 ตั้ง Stop Loss และ Take Profit อัตโนมัสทุกครั้งที่เปิดออเดอร์</li>
          <li>🔄 รองรับ XAUUSD, EURUSD, GBPUSD, USDJPY และหุ้น (AMD, AAPL, TSLA)</li>
          <li>⚡ ใช้ RR 1:2 ถึงแม้จะเสีย 5 ไม้ ชนะ 5 ไม้ ก็ยังมีกำไรสุทธิได้ในระยะยาว</li>
          <li>🔐 ปรับค่า % Risk และ Lot ได้ตามข้อกำหนดของโบรกเกอร์</li>
        </ul>
        <p className="text-xs text-slate-400 mt-4 text-center">
          👉 อ่านรายละเอียดเพิ่มเติมที่หน้า <a href="/features" className="underline">คุณสมบัติ</a>
        </p>
      </div>
    </div>
  );
}