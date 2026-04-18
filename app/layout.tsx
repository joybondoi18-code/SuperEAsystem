import "./globals.css";
import type { Metadata } from "next";
import AppHeader from "../components/AppHeader";
import Navigation from "../components/Navigation";


export const metadata: Metadata = {
  title: "TradeBot System",
  description: "Multi-bot trading system with admin panel",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th">
      <body>
        <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
          {/* Fixed Header */}
          <header className="border-b border-slate-700/80 sticky top-0 backdrop-blur-lg bg-slate-900/95 z-50 shadow-lg">
            <div className="container mx-auto px-4 flex items-center justify-between py-3">
              <AppHeader />
              <Navigation />
            </div>
          </header>

          {/* Main Content Area */}
          <main className="flex-1 container mx-auto px-4 py-6">
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700/50 shadow-2xl overflow-hidden">
              {children}
            </div>
          </main>

          {/* Footer */}
          <footer className="border-t border-slate-700/50 bg-slate-900/80 backdrop-blur-sm mt-auto">
            <div className="container mx-auto px-4 py-4 text-center text-sm text-slate-400">
              © 2025 TradeBot System • Professional Trading Platform
            </div>
          </footer>
        </div>
        {/* ✅ วางโค้ด tawk.to ของคุณตรงนี้ */}
        <script
          type="text/javascript"
          dangerouslySetInnerHTML={{
            __html: `
              var Tawk_API=Tawk_API||{}, Tawk_LoadStart=new Date();
              (function(){
                var s1=document.createElement("script"),s0=document.getElementsByTagName("script")[0];
                s1.async=true;
                s1.src='https://embed.tawk.to/69b4e667a6cbc81c39f85fd5/1jjla81o2';
                s1.charset='UTF-8';
                s1.setAttribute('crossorigin','*');
                s0.parentNode.insertBefore(s1,s0);
              })();
            `,
          }}
        />
      </body>
    </html>
  );
}