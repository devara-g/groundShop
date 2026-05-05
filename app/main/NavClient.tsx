"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

const NAV_ITEMS = [
  {
    href: "/main/feed",
    label: "Jelajah",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
      </svg>
    )
  },
  {
    href: "/main/contacts",
    label: "Teman",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    )
  },
  {
    href: "/main/chat",
    label: "Pesan",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
      </svg>
    )
  },
  {
    href: "/main/notifications",
    label: "Notifikasi",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
      </svg>
    )
  },
  {
    href: "/main/profile",
    label: "Profil",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    )
  },
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
            <span className={`transition-transform ${isActive ? "scale-110" : "group-hover:scale-110"}`}>
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
            <span className={`mb-1 transition-transform ${isActive ? "scale-110" : ""}`}>{item.icon}</span>
            <span className="text-[10px]">{item.label}</span>
          </Link>
        )
      })}
    </nav>
  )
}
