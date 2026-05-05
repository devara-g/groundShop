import React from "react"

const COLORS = ["bg-blue-500", "bg-purple-500", "bg-green-500", "bg-orange-500", "bg-pink-500", "bg-teal-500"]

export function Avatar({
  username,
  avatarUrl,
  size = "md",
}: {
  username: string
  avatarUrl?: string | null
  size?: "sm" | "md" | "lg" | "xl" | "2xl"
}) {
  const sizeClasses = {
    sm: "w-8 h-8 text-sm",
    md: "w-10 h-10 text-base",
    lg: "w-12 h-12 text-lg",
    xl: "w-16 h-16 text-2xl",
    "2xl": "w-24 h-24 text-4xl",
  }

  const roundedClass = size === "2xl" ? "rounded-full" : (size === "lg" || size === "md" ? "rounded-2xl" : "rounded-xl")
  
  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={username}
        className={`${sizeClasses[size]} ${roundedClass} object-cover shadow-inner`}
      />
    )
  }

  const color = COLORS[(username?.charCodeAt(0) || 0) % COLORS.length]

  return (
    <div
      className={`${sizeClasses[size]} ${color} ${roundedClass} flex items-center justify-center text-white font-bold shadow-inner`}
    >
      {username?.[0]?.toUpperCase() || "?"}
    </div>
  )
}
