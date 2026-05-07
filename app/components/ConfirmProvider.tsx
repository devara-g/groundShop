"use client"

import { useEffect, useState } from "react"

type ConfirmState = {
  isOpen: boolean
  message: string
  resolve: ((value: boolean) => void) | null
}

export default function ConfirmProvider() {
  const [confirmState, setConfirmState] = useState<ConfirmState>({
    isOpen: false,
    message: "",
    resolve: null
  })

  useEffect(() => {
    const handleConfirm = (e: CustomEvent<{ message: string; resolve: (val: boolean) => void }>) => {
      setConfirmState({
        isOpen: true,
        message: e.detail.message,
        resolve: e.detail.resolve
      })
    }

    window.addEventListener("custom-confirm" as any, handleConfirm as any)
    return () => window.removeEventListener("custom-confirm" as any, handleConfirm as any)
  }, [])

  const handleAction = (value: boolean) => {
    if (confirmState.resolve) {
      confirmState.resolve(value)
    }
    setConfirmState({ isOpen: false, message: "", resolve: null })
  }

  if (!confirmState.isOpen) return null

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm confirm-overlay">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden confirm-modal">
        <div className="p-6 text-center">
          <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-slate-900 mb-2">Konfirmasi Aksi</h3>
          <p className="text-slate-500">{confirmState.message}</p>
        </div>
        <div className="flex border-t border-slate-100">
          <button 
            onClick={() => handleAction(false)}
            className="flex-1 px-4 py-4 text-slate-500 font-semibold hover:bg-slate-50 transition-colors"
          >
            Batal
          </button>
          <div className="w-px bg-slate-100"></div>
          <button 
            onClick={() => handleAction(true)}
            className="flex-1 px-4 py-4 text-red-600 font-bold hover:bg-red-50 transition-colors"
          >
            Hapus
          </button>
        </div>
      </div>
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes pop-in {
          0% { 
            opacity: 0; 
            transform: scale(0.5) translateY(20%); 
          }
          50% { 
            transform: scale(1.05) translateY(-2%); 
          }
          80% { 
            transform: scale(0.98) translateY(1%); 
          }
          100% { 
            opacity: 1; 
            transform: scale(1) translateY(0); 
          }
        }
        .confirm-overlay { animation: fade-in 0.25s ease-out forwards; }
        .confirm-modal { animation: pop-in 0.45s cubic-bezier(0.34, 1.56, 0.64, 1) forwards; }
      `}} />
    </div>
  )
}
