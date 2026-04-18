"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Mail, ExternalLink } from "lucide-react"
import Link from "next/link"

interface PasswordResetDemoProps {
  email: string
  onClose: () => void
}

export function PasswordResetDemo({ email, onClose }: PasswordResetDemoProps) {
  const demoResetUrl = `/auth/reset-password?token=demo_reset_token_${Date.now()}`

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Demo Email Simulation
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-800 font-medium mb-2">📧 Email sent to: {email}</p>
            <p className="text-sm text-blue-700 mb-3">Subject: Reset your CardMaster password</p>
            <div className="text-xs text-blue-600 bg-white p-3 rounded border">
              <p className="mb-2">Hi there,</p>
              <p className="mb-2">
                You requested to reset your password for your CardMaster account. Click the link below to reset your
                password:
              </p>
              <p className="mb-2 font-mono text-blue-800">
                {window.location.origin}
                {demoResetUrl}
              </p>
              <p className="mb-2">This link will expire in 1 hour.</p>
              <p>If you didn&apos;t request this, please ignore this email.</p>
            </div>
          </div>

          <div className="flex gap-2">
            <Link href={demoResetUrl} className="flex-1">
              <Button className="w-full">
                <ExternalLink className="h-4 w-4 mr-2" />
                Open Reset Link
              </Button>
            </Link>
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </div>

          <p className="text-xs text-gray-500 text-center">
            In a real application, this would be sent as an actual email.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

