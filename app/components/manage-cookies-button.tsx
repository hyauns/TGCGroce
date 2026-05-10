"use client"

import { useCookieConsent } from "@/lib/cookie-consent-context"

export function ManageCookiesButton() {
  const { openManage } = useCookieConsent()

  return (
    <button 
      onClick={openManage}
      className="text-black hover:text-[rgb(37,99,235)] transition-colors text-sm flex items-center gap-2 bg-transparent border-none p-0 cursor-pointer"
    >
      Cookie Preferences
    </button>
  )
}
