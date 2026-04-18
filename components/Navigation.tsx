"use client";

export default function Navigation() {
  const links = [
    { href: "/", label: "หน้าหลัก" },
    { href: "/auth", label: "เข้าสู่ระบบ/สมัครสมาชิก" },
    { href: "/dashboard", label: "แดชบอร์ด" }
  ];

  return (
    <nav className="ml-auto flex gap-4 text-sm items-center">
      {links.map((link) => (
        <a key={link.href} href={link.href} className="hover:underline">
          {link.label}
        </a>
      ))}
      
      {/* ปุ่มภาษา */}
      <div className="flex gap-2 ml-2">
        <span className="px-2 py-1 text-xs border rounded bg-gray-100">TH</span>
        <button className="px-2 py-1 text-xs border rounded hover:bg-gray-100 opacity-50">
          EN (Soon)
        </button>
      </div>
    </nav>
  );
}