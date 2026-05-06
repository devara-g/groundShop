"use client"

import { useState } from "react"

const COLORS = ["bg-blue-500","bg-purple-500","bg-green-500","bg-orange-500","bg-pink-500","bg-teal-500"]
const getColor = (name: string) => COLORS[(name?.charCodeAt(0) || 0) % COLORS.length]

export default function SafeImage({ 
  src, 
  alt, 
  className, 
  fallbackText,
  isAvatar = false
}: { 
  src?: string | null, 
  alt?: string, 
  className?: string,
  fallbackText?: string,
  isAvatar?: boolean
}) {
  const [error, setError] = useState(false)

  if (!src || error) {
    if (isAvatar && fallbackText) {
      const color = getColor(fallbackText)
      return (
        <div className={`flex items-center justify-center font-bold text-white ${color} ${className}`}>
          {fallbackText.charAt(0).toUpperCase()}
        </div>
      )
    }
    
    return (
      <div className={`flex items-center justify-center bg-slate-100 font-bold text-slate-400 ${className}`}>
        {isAvatar ? "?" : "Tidak Ada Gambar"}
      </div>
    )
  }

  return (
    <img 
      src={src} 
      alt={alt || "image"} 
      className={className} 
      onError={() => setError(true)}
    />
  )
}
