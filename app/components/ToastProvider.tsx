"use client"

import { useEffect, useState } from "react"

export type ToastType = "success" | "error" | "info"
type ToastMsg = { id: number; message: string; type: ToastType }

export default function ToastProvider() {
  const [toasts, setToasts] = useState<ToastMsg[]>([])

  useEffect(() => {
    const handleToast = (e: CustomEvent<{ message: string; type: ToastType }>) => {
      const id = Date.now()
      setToasts((prev) => [...prev, { id, message: e.detail.message, type: e.detail.type }])
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id))
      }, 4000)
    }

    window.addEventListener("toast" as any, handleToast as any)
    return () => window.removeEventListener("toast" as any, handleToast as any)
  }, [])

  if (toasts.length === 0) return null

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] flex flex-col gap-2 pointer-events-none w-full max-w-sm px-4">
      {toasts.map((t) => (
        <div 
          key={t.id} 
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl shadow-xl border backdrop-blur-md font-medium text-sm pointer-events-auto toast-animate ${
            t.type === "success" 
              ? "bg-green-50/95 border-green-200 text-green-800" 
              : t.type === "error"
              ? "bg-red-50/95 border-red-200 text-red-800"
              : "bg-slate-800/95 border-slate-700 text-white shadow-slate-900/20"
          }`}
        >
          {t.type === "success" && (
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 shrink-0 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
          )}
          {t.type === "error" && (
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 shrink-0 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          )}
          {t.type === "info" && (
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 shrink-0 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          )}
          <span className="flex-1 min-w-0 break-words">{t.message}</span>
        </div>
      ))}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes toast-bounce-in {
          0% { 
            opacity: 0; 
            transform: translateY(-100%) scale(0.3); 
          }
          50% { 
            opacity: 1; 
            transform: translateY(15%) scale(1.1); 
          }
          70% { 
            transform: translateY(-5%) scale(0.95); 
          }
          100% { 
            transform: translateY(0) scale(1); 
          }
        }
        .toast-animate {
          animation: toast-bounce-in 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }
      `}} />
    </div>
  )
}
