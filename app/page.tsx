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
          🚀 สมัครใช้งานฟรี 30 วัน
          <br className="block sm:hidden" />
          🚀 รองรับการใช้งานหลายรูปแบบตามความสะดวกของคุณ
          <br className="block sm:hidden" />
          
        </p>

        {/* ✅ กลยุทธ์ของระบบ (responsive) */}
        <div className="mt-6 p-4 sm:p-5 bg-gray-800/70 border-l-4 border-green-500 rounded-md shadow-md">
          <p className="text-lg sm:text-xl md:text-2xl font-bold text-green-400 mb-2">
            🎯 แนวคิดการทำงานของระบบ
          </p>
           <ul className="list-disc list-inside text-sm sm:text-base md:text-lg text-slate-200 space-y-1">
            <li>ไม่เปิดออเดอร์โดยไม่มีเหตุผล</li>
            <li>ไม่ฝืนแนวโน้มของตลาด</li>
            <li>เลือกเฉพาะจังหวะที่มีความได้เปรียบสูง</li>
          </ul>
          <p className="text-sm sm:text-base md:text-lg text-slate-200 mt-3">
            📊 บางช่วงเวลาอาจไม่มีสัญญาณเข้าเทรด
            <br />
            เพื่อหลีกเลี่ยงความเสี่ยงที่ไม่จำเป็น และรักษาเสถียรภาพของพอร์ตในระยะยาว
          </p>
          <p className="text-sm sm:text-base md:text-lg text-slate-300 mt-3 italic font-medium">
            💡 ระบบนี้ไม่ได้ออกแบบมาเพื่อผลตอบแทนระยะสั้น<br />
            แต่เน้นการบริหารความเสี่ยงและการเติบโตอย่างยั่งยืน
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
          <li>📡 EA รับสัญญาณจากเซิร์ฟเวอร์กลาง และเปิดออเดอร์ใน MT5 โดยอัตโนมัติ</li>
          <li>💰 คำนวณขนาด Lot อัตโนมัติตาม % Risk หรือกำหนด Fixed Lot ได้</li>
          <li>🛑 ตั้ง Stop Loss และ Take Profit อัตโนมัติทุกครั้งที่เปิดออเดอร์</li>
          <li>🔄 รองรับ Forex, Gold (XAUUSD), Crypto และหุ้นบางตัว</li>
          <li>⚡ ใช้อัตราส่วน Risk:Reward 1:2 เพื่อเพิ่มโอกาสทำกำไรในระยะยาว</li>
          <li>🔐 ปรับค่า % Risk และขนาด Lot ได้ตามต้องการ</li>
        </ul>
        <p className="text-xs text-slate-400 mt-4 text-center">
          👉 อ่านรายละเอียดเพิ่มเติมที่หน้า <a href="/features" className="underline">คุณสมบัติ</a>
        </p>
      </div>
    </div>
  );
}