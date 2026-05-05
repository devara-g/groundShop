"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

const NAV_ITEMS = [
  { href: "/main/feed", icon: "🌐", label: "Jelajah" },
  { href: "/main/contacts", icon: "👥", label: "Teman" },
  { href: "/main/chat", icon: "💬", label: "Pesan" },
  { href: "/main/profile", icon: "👤", label: "Profil" },
]

export function DesktopNav() {
  const pathname = usePathname()

  return (
    <nav className="flex flex-col gap-2 flex-1">
      {NAV_ITEMS.map((item) => {
        const isActive = pathname.startsWith(item.href)
        return (
          <Link 
            key={item.href} 
            href={item.href} 
            className={`flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all group ${
              isActive 
                ? "bg-slate-900 text-white font-bold shadow-md" 
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100 font-medium"
            }`}
          >
            <span className={`text-2xl transition-transform ${isActive ? "scale-105" : "group-hover:scale-105"}`}>
              {item.icon}
            </span>
            <span className="mt-0.5 text-[15px]">{item.label}</span>
          </Link>
        )
      })}
    </nav>
  )
}

export function MobileNav() {
  const pathname = usePathname()

  return (
    <nav className="flex items-center justify-around p-2">
      {NAV_ITEMS.map((item) => {
        const isActive = pathname.startsWith(item.href)
        return (
          <Link 
            key={item.href} 
            href={item.href} 
            className={`flex flex-col items-center justify-center w-16 h-14 rounded-2xl transition-colors ${
              isActive 
                ? "text-blue-600 font-bold" 
                : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"
            }`}
          >
            <span className={`text-xl mb-1 ${isActive ? "scale-110" : ""}`}>{item.icon}</span>
            <span className="text-[10px]">{item.label}</span>
          </Link>
        )
      })}
    </nav>
  )
}
