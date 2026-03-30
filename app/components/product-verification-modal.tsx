"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, AlertTriangle, Eye, Award, Zap, Database, Wifi, X, ExternalLink, Copy, Check } from "lucide-react"

interface ProductVerificationModalProps {
  isOpen: boolean
  onClose: () => void
  productId: number
  productName: string
}

type VerificationStep = {
  id: string
  label: string
  icon: React.ReactNode
  duration: number
}

type VerificationState = "idle" | "loading" | "success" | "error"

export function ProductVerificationModal({ isOpen, onClose, productId, productName }: ProductVerificationModalProps) {
  const [verificationState, setVerificationState] = useState<VerificationState>("idle")
  const [currentStep, setCurrentStep] = useState(0)
  const [completedSteps, setCompletedSteps] = useState<string[]>([])
  const [copied, setCopied] = useState(false)

  const verificationSteps: VerificationStep[] = [
    {
      id: "database",
      label: "Connecting to authentication database",
      icon: <Database className="w-5 h-5" />,
      duration: 1200,
    },
    {
      id: "security",
      label: "Performing security scan",
      icon: <Award className="w-5 h-5" />,
      duration: 1500,
    },
    {
      id: "license",
      label: "Verifying official licensing",
      icon: <Award className="w-5 h-5" />,
      duration: 1000,
    },
    {
      id: "network",
      label: "Cross-referencing with manufacturer",
      icon: <Wifi className="w-5 h-5" />,
      duration: 1300,
    },
    {
      id: "final",
      label: "Finalizing authenticity check",
      icon: <Eye className="w-5 h-5" />,
      duration: 800,
    },
  ]

  const productCode = `TCG-${productId.toString().padStart(6, "0")}-AUTH`
  const verificationId = `VER-${Date.now().toString().slice(-8)}`

  useEffect(() => {
    if (verificationState === "loading") {
      runVerification()
    }
  }, [verificationState])

  const runVerification = async () => {
    setCurrentStep(0)
    setCompletedSteps([])

    for (let i = 0; i < verificationSteps.length; i++) {
      setCurrentStep(i)
      await new Promise((resolve) => setTimeout(resolve, verificationSteps[i].duration))
      setCompletedSteps((prev) => [...prev, verificationSteps[i].id])
    }

    // Simulate random result (90% authentic for demo)
    const isAuthentic = Math.random() > 0.1
    setVerificationState(isAuthentic ? "success" : "error")
  }

  const startVerification = () => {
    setVerificationState("loading")
  }

  const resetVerification = () => {
    setVerificationState("idle")
    setCurrentStep(0)
    setCompletedSteps([])
  }

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error("Failed to copy:", err)
    }
  }

  const handleClose = () => {
    resetVerification()
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md mx-auto p-0 overflow-hidden bg-white">
        {/* Header */}
        <div className="relative bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 pb-8">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleClose}
            className="absolute right-2 top-2 text-white hover:bg-white/20 rounded-full"
          >
            <X className="h-4 w-4" />
          </Button>
          <div className="text-center">
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
              <img src="/images/shield-verified.png" alt="Shield" className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-bold mb-2">Product Verification</h2>
            <p className="text-blue-100 text-sm">Authenticating product legitimacy</p>
          </div>
          {/* Decorative elements */}
          <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2 w-8 h-8 bg-white rounded-full"></div>
        </div>

        <div className="p-6 pt-8">
          {/* Product Info */}
          <div className="text-center mb-6">
            <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">{productName}</h3>
            <div className="bg-gray-100 rounded-lg p-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Product ID:</span>
                <div className="flex items-center gap-2">
                  <code className="text-sm font-mono text-blue-600">{productCode}</code>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(productCode)}
                    className="h-6 w-6 p-0 hover:bg-blue-100"
                  >
                    {copied ? <Check className="h-3 w-3 text-green-600" /> : <Copy className="h-3 w-3" />}
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Idle State */}
          {verificationState === "idle" && (
            <div className="text-center space-y-4">
              <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mx-auto">
                <img src="/images/shield-verified.png" alt="Shield" className="w-10 h-10" />
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Ready to Verify</h4>
                <p className="text-gray-600 text-sm mb-4">
                  Click below to start the authenticity verification process. This will check our secure database to
                  confirm product legitimacy.
                </p>
              </div>
              <Button
                onClick={startVerification}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 h-12 text-base font-semibold"
              >
                <Zap className="w-4 h-4 mr-2" />
                Start Verification
              </Button>
            </div>
          )}

          {/* Loading State */}
          {verificationState === "loading" && (
            <div className="space-y-6">
              {/* Main Loading Animation */}
              <div className="text-center">
                <div className="relative w-24 h-24 mx-auto mb-4">
                  {/* Outer rotating ring */}
                  <div className="absolute inset-0 border-4 border-blue-200 rounded-full"></div>
                  <div className="absolute inset-0 border-4 border-transparent border-t-blue-600 rounded-full animate-spin"></div>
                  {/* Inner pulsing shield */}
                  <div className="absolute inset-4 bg-blue-600 rounded-full flex items-center justify-center animate-pulse">
                    <img src="/images/shield-verified.png" alt="Shield" className="w-8 h-8 brightness-0 invert" />
                  </div>
                  {/* Security particles */}
                  <div className="absolute -inset-2">
                    <div className="absolute top-0 left-1/2 w-2 h-2 bg-green-400 rounded-full animate-ping"></div>
                    <div className="absolute bottom-0 right-1/4 w-1.5 h-1.5 bg-purple-400 rounded-full animate-ping animation-delay-300"></div>
                    <div className="absolute top-1/3 right-0 w-1 h-1 bg-blue-400 rounded-full animate-ping animation-delay-700"></div>
                  </div>
                </div>
                <h4 className="font-semibold text-gray-900 mb-2">Verifying Authenticity</h4>
                <p className="text-gray-600 text-sm">Please wait while we authenticate your product...</p>
              </div>

              {/* Verification Steps */}
              <div className="space-y-3">
                {verificationSteps.map((step, index) => (
                  <div
                    key={step.id}
                    className={`flex items-center gap-3 p-3 rounded-lg transition-all duration-500 ${
                      completedSteps.includes(step.id)
                        ? "bg-green-50 border border-green-200"
                        : currentStep === index
                          ? "bg-blue-50 border border-blue-200"
                          : "bg-gray-50 border border-gray-200"
                    }`}
                  >
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 ${
                        completedSteps.includes(step.id)
                          ? "bg-green-600 text-white"
                          : currentStep === index
                            ? "bg-blue-600 text-white animate-pulse"
                            : "bg-gray-300 text-gray-600"
                      }`}
                    >
                      {completedSteps.includes(step.id) ? (
                        <CheckCircle className="w-4 h-4" />
                      ) : currentStep === index ? (
                        <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        step.icon
                      )}
                    </div>
                    <span
                      className={`text-sm font-medium transition-colors duration-300 ${
                        completedSteps.includes(step.id)
                          ? "text-green-700"
                          : currentStep === index
                            ? "text-blue-700"
                            : "text-gray-600"
                      }`}
                    >
                      {step.label}
                    </span>
                    {completedSteps.includes(step.id) && <CheckCircle className="w-4 h-4 text-green-600 ml-auto" />}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Success State */}
          {verificationState === "success" && (
            <div className="text-center space-y-4">
              <div className="relative">
                <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
                  <CheckCircle className="w-12 h-12 text-green-600" />
                </div>
                {/* Success particles */}
                <div className="absolute inset-0 pointer-events-none">
                  <div className="absolute top-4 left-8 w-2 h-2 bg-green-400 rounded-full animate-ping"></div>
                  <div className="absolute top-8 right-6 w-1.5 h-1.5 bg-emerald-400 rounded-full animate-ping animation-delay-300"></div>
                  <div className="absolute bottom-6 left-12 w-1 h-1 bg-green-500 rounded-full animate-ping animation-delay-500"></div>
                </div>
              </div>

              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h4 className="font-bold text-green-900 mb-2 flex items-center justify-center gap-2">
                  <img src="/images/shield-verified.png" alt="Shield" className="w-5 h-5" />
                  Product Verified Authentic
                </h4>
                <p className="text-green-800 text-sm mb-3">
                  This product has been successfully verified as 100% authentic and officially licensed.
                </p>

                <div className="space-y-2 text-left">
                  <div className="flex justify-between text-sm">
                    <span className="text-green-700">Verification ID:</span>
                    <code className="text-green-800 font-mono">{verificationId}</code>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-green-700">Verified At:</span>
                    <span className="text-green-800">{new Date().toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-green-700">Status:</span>
                    <Badge className="bg-green-600 text-white text-xs">AUTHENTIC</Badge>
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <Button onClick={handleClose} className="flex-1 bg-green-600 hover:bg-green-700 text-white">
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Confirmed
                </Button>
                <Button
                  variant="outline"
                  onClick={() => copyToClipboard(verificationId)}
                  className="px-3 bg-transparent"
                >
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>

              <p className="text-xs text-gray-500">Save your verification ID for future reference</p>
            </div>
          )}

          {/* Error State */}
          {verificationState === "error" && (
            <div className="text-center space-y-4">
              <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
                <AlertTriangle className="w-12 h-12 text-red-600" />
              </div>

              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <h4 className="font-bold text-red-900 mb-2 flex items-center justify-center gap-2">
                  <AlertTriangle className="w-5 h-5" />
                  Verification Failed
                </h4>
                <p className="text-red-800 text-sm mb-3">
                  We could not verify the authenticity of this product. This may indicate a counterfeit item.
                </p>

                <div className="space-y-2 text-left">
                  <div className="flex justify-between text-sm">
                    <span className="text-red-700">Verification ID:</span>
                    <code className="text-red-800 font-mono">{verificationId}</code>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-red-700">Checked At:</span>
                    <span className="text-red-800">{new Date().toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-red-700">Status:</span>
                    <Badge variant="destructive" className="text-xs">
                      UNVERIFIED
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <Button onClick={resetVerification} variant="outline" className="flex-1 bg-transparent">
                  Try Again
                </Button>
                <Button className="flex-1 bg-red-600 hover:bg-red-700 text-white">
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Report Issue
                </Button>
              </div>

              <p className="text-xs text-gray-500">Contact support if you believe this is an error</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
