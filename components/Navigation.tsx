"use client";

export default function Navigation() {
  const links = [
    { href: "/", label: "หน้าหลัก" },
    { href: "/auth", label: "สมัครสมาชิก" },
    { href: "/dashboard", label: "แดชบอร์ด" }
  ];

  return (
    <nav className="ml-auto flex gap-4 text-sm items-center">
      {links.map((link) => (
        <a key={link.href} href={link.href} className="hover:underline">
          {link.label}
        </a>
      ))}
    </nav>
  );
}