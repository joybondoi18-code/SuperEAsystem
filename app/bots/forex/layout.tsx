import { Inter } from "next/font/google";
import Link from "next/link";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Forex Bot",
  description: "AI Trading System for MT5 - Powered",
};

export default function ForexLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="min-h-screen bg-cover bg-center bg-fixed"
      style={{ backgroundImage: "url('/532745_86781eb15a154794a8cdfc021c6f5d09~mv2.webp')" }}
    >
      <div className="min-h-screen bg-slate-900/70 flex flex-col">
       
        {/* Main Content - เต็มหน้าจอ ไม่มีขอบด้านข้าง */}
        <main className="flex-1 w-full px-4 py-6">
          {children}
        </main>

        {/* Footer */}
        <footer className="text-white/70 py-3 text-center text-sm flex-shrink-0 px-4">
          © {new Date().getFullYear()} Forex Bot — Developed by
        </footer>
      </div>
    </div>
  );
}