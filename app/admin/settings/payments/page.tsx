import { getPaymentGatewayStatus } from "@/app/actions/settings"
import { PaymentSettingsClient } from "./client"
import { ShieldCheck, ShieldAlert } from "lucide-react"

export default async function PaymentSettingsPage() {
  const isGatewayEnabled = await getPaymentGatewayStatus()
  
  // Checking health based on the presence of WEBHOOK_SECRET
  const isSecretConfigured = !!process.env.WEBHOOK_SECRET
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"
  const webhookEndpoint = `${siteUrl}/api/webhooks/gateway`

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Payment Integrations</h1>
        <p className="text-gray-500">Manage your custom payment gateway and webhook integrations.</p>
      </div>

      <div className="grid gap-6">
        {/* Card 1: Webhook Identity (Read Only) */}
        <div className="bg-white rounded-lg border shadow-sm flex flex-col">
          <div className="p-6 border-b">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Webhook Integration</h2>
                <p className="text-sm text-gray-500 mt-1">This endpoint receives realtime payment events from the Gateway.</p>
              </div>
              
              {/* Health Badge */}
              <div className="shrink-0 flex items-center">
                {isSecretConfigured ? (
                  <div className="inline-flex items-center space-x-1 bg-green-50 text-green-700 px-3 py-1 rounded-full border border-green-200 text-sm font-medium">
                    <ShieldCheck className="h-4 w-4" />
                    <span>Configured & Secure</span>
                  </div>
                ) : (
                  <div className="inline-flex items-center space-x-1 bg-red-50 text-red-700 px-3 py-1 rounded-full border border-red-200 text-sm font-medium">
                    <ShieldAlert className="h-4 w-4" />
                    <span>Missing Secret</span>
                  </div>
                )}
              </div>
            </div>

            {/* Read Only Input */}
            <div className="mt-4">
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide mb-2">
                Webhook URL
              </label>
              <PaymentSettingsClient 
                webhookEndpoint={webhookEndpoint} 
                initialGatewayState={isGatewayEnabled} 
                mode="copy-only" 
              />
            </div>
            
            <div className="mt-4 bg-amber-50 border border-amber-200 rounded-md p-3">
              <p className="text-amber-800 text-sm">
                <strong>Attention:</strong> The webhook route cannot be disabled. It runs continuously to guarantee all paid customer orders are properly recorded.
              </p>
            </div>
          </div>
        </div>

        {/* Card 2: Checkout Frontend Visibility */}
        <div className="bg-white rounded-lg border shadow-sm p-6">
           <PaymentSettingsClient 
              webhookEndpoint={webhookEndpoint} 
              initialGatewayState={isGatewayEnabled} 
              mode="toggle-only" 
           />
        </div>
      </div>
    </div>
  )
}
