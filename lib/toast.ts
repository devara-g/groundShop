import { ToastType } from "@/app/components/ToastProvider"

export const toast = (message: string, type: ToastType = "info") => {
  if (typeof window !== "undefined") {
    const event = new CustomEvent("toast", { detail: { message, type } })
    window.dispatchEvent(event)
  }
}
