"use client"

import { useState } from "react"
import { Copy, Check, CreditCard, ToggleLeft, ToggleRight } from "lucide-react"
import { togglePaymentGateway } from "@/app/actions/settings"
import { Button } from "@/components/ui/button"

interface PaymentSettingsClientProps {
  webhookEndpoint: string
  initialGatewayState: boolean
  mode: "copy-only" | "toggle-only"
}

export function PaymentSettingsClient({ webhookEndpoint, initialGatewayState, mode }: PaymentSettingsClientProps) {
  const [copied, setCopied] = useState(false)
  const [isGatewayEnabled, setIsGatewayEnabled] = useState(initialGatewayState)
  const [isUpdating, setIsUpdating] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(webhookEndpoint)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleToggle = async () => {
    try {
      setIsUpdating(true)
      const newState = !isGatewayEnabled
      // Optimistic update
      setIsGatewayEnabled(newState)
      await togglePaymentGateway(newState)
    } catch (e) {
      console.error(e)
      // Revert on error
      setIsGatewayEnabled(isGatewayEnabled)
    } finally {
      setIsUpdating(false)
    }
  }

  if (mode === "copy-only") {
    return (
      <div className="flex items-center space-x-2">
        <code className="flex-1 block p-3 bg-gray-50 border border-gray-300 rounded-md text-sm font-mono text-gray-800 break-all">
          {webhookEndpoint}
        </code>
        <Button 
          variant="outline" 
          size="icon" 
          onClick={handleCopy} 
          className="shrink-0 h-[46px] w-[46px]"
          title="Copy to clipboard"
        >
          {copied ? <Check className="h-5 w-5 text-green-600" /> : <Copy className="h-5 w-5 text-gray-500" />}
        </Button>
      </div>
    )
  }

  return (
    <div className="flex items-center justify-between">
      <div>
        <h2 className="text-lg font-semibold text-gray-900 flex items-center">
          <CreditCard className="mr-2 h-5 w-5 text-blue-600" />
          Checkout Gateway Display
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          Toggle whether the "Credit Card / Gateway" payment method is visible to buyers on the public Checkout page.
        </p>
      </div>
      <button 
        onClick={handleToggle}
        disabled={isUpdating}
        className="shrink-0 ml-4 focus:outline-none disabled:opacity-50"
      >
        {isGatewayEnabled 
          ? <ToggleRight className="w-12 h-12 text-blue-600 drop-shadow-sm transition-transform active:scale-95" /> 
          : <ToggleLeft className="w-12 h-12 text-gray-300 hover:text-gray-400 transition-colors active:scale-95" />
        }
      </button>
    </div>
  )
}
