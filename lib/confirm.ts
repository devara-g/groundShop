export const confirmAction = (message: string): Promise<boolean> => {
  return new Promise((resolve) => {
    if (typeof window !== "undefined") {
      const event = new CustomEvent("custom-confirm", { 
        detail: { 
          message, 
          resolve 
        } 
      })
      window.dispatchEvent(event)
    } else {
      resolve(false)
    }
  })
}
