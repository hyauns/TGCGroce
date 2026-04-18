"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function DemoResetPage() {
  const router = useRouter()

  useEffect(() => {
    // Generate a demo token and redirect to reset password page
    const demoToken = "demo_reset_token_" + Date.now()
    router.push(`/auth/reset-password?token=${demoToken}`)
  }, [router])

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Redirecting to password reset...</p>
      </div>
    </div>
  )
}

