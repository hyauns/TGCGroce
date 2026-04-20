/* eslint-disable react/no-unescaped-entities */
"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  CreditCard,
  Shield,
  Lock,
  CheckCircle,
  AlertCircle,
  Loader2,
  X,
  Zap,
  Clock,
  Star,
  Wifi,
  Database,
  Globe,
  Award,
  Eye,
  Fingerprint,
  ShieldCheck,
} from "lucide-react"
import { useRouter } from "next/navigation"
import Image from "next/image"

interface PaymentProcessingModalProps {
  isOpen: boolean
  onClose: () => void
}

type ProcessingStage = "processing" | "validating" | "confirming" | "success" | "error"

interface ProcessingStep {
  id: string
  label: string
  description: string
  icon: React.ComponentType<{ className?: string }>
  completed: boolean
  duration: number
  color: string
}

export function PaymentProcessingModal({ isOpen, onClose }: PaymentProcessingModalProps) {
  const [stage, setStage] = useState<ProcessingStage>("processing")
  const [progress, setProgress] = useState(0)
  const [showConfetti, setShowConfetti] = useState(false)
  const [currentStepIndex, setCurrentStepIndex] = useState(0)
  const [animationPhase, setAnimationPhase] = useState<"enter" | "processing" | "success">("enter")
  const [orderNumber, setOrderNumber] = useState("")
  const [pulseAnimation, setPulseAnimation] = useState(true)
  const [securityChecks, setSecurityChecks] = useState([
    { id: 1, label: "Card Authentication", completed: false },
    { id: 2, label: "Fraud Detection", completed: false },
    { id: 3, label: "Bank Verification", completed: false },
    { id: 4, label: "Transaction Approval", completed: false },
  ])

  const [steps, setSteps] = useState<ProcessingStep[]>([
    {
      id: "processing",
      label: "Initiating Secure Payment",
      description: "Establishing encrypted connection to payment gateway",
      icon: CreditCard,
      completed: false,
      duration: 2200,
      color: "blue",
    },
    {
      id: "validating",
      label: "Advanced Security Validation",
      description: "Performing multi-layer fraud detection and card verification",
      icon: ShieldCheck,
      completed: false,
      duration: 2000,
      color: "purple",
    },
    {
      id: "confirming",
      label: "Bank Authorization",
      description: "Securing final approval from your financial institution",
      icon: Lock,
      completed: false,
      duration: 1800,
      color: "indigo",
    },
    {
      id: "completing",
      label: "Transaction Complete",
      description: "Payment confirmed - Your order is now being processed",
      icon: CheckCircle,
      completed: false,
      duration: 1200,
      color: "green",
    },
  ])

  const router = useRouter()

  useEffect(() => {
    if (!isOpen) return

    // Generate realistic order number
    const timestamp = Date.now().toString().slice(-6)
    const randomStr = Math.random().toString(36).substr(2, 4).toUpperCase()
    setOrderNumber(`TCG-${timestamp}-${randomStr}`)

    const processPayment = async () => {
      // Reset all states
      setStage("processing")
      setProgress(0)
      setShowConfetti(false)
      setCurrentStepIndex(0)
      setAnimationPhase("enter")
      setPulseAnimation(true)
      setSteps((prev) => prev.map((step) => ({ ...step, completed: false })))
      setSecurityChecks((prev) => prev.map((check) => ({ ...check, completed: false })))

      // Entry animation
      setTimeout(() => setAnimationPhase("processing"), 600)

      // Process each step with enhanced animations
      for (let i = 0; i < steps.length; i++) {
        const step = steps[i]
        setCurrentStepIndex(i)

        // Update stage
        const stageMap: Record<number, ProcessingStage> = {
          0: "processing",
          1: "validating",
          2: "confirming",
          3: "success",
        }
        setStage(stageMap[i])

        // Animate security checks during validation step
        if (i === 1) {
          for (let j = 0; j < securityChecks.length; j++) {
            setTimeout(
              () => {
                setSecurityChecks((prev) =>
                  prev.map((check, index) => (index === j ? { ...check, completed: true } : check)),
                )
              },
              (j + 1) * 400,
            )
          }
        }

        // Enhanced progress animation with easing
        const startProgress = (i / steps.length) * 100
        const endProgress = ((i + 1) / steps.length) * 100
        const progressDuration = step.duration
        const totalFrames = progressDuration / 16 // 60fps
        let frame = 0

        const progressInterval = setInterval(() => {
          frame++
          const progressRatio = frame / totalFrames
          // Easing function for smooth animation
          const easedProgress = 1 - Math.pow(1 - progressRatio, 3)
          const currentProgress = startProgress + (endProgress - startProgress) * easedProgress

          if (frame >= totalFrames) {
            setProgress(endProgress)
            clearInterval(progressInterval)
          } else {
            setProgress(currentProgress)
          }
        }, 16)

        // Wait for step duration
        await new Promise((resolve) => setTimeout(resolve, step.duration))

        // Mark step as completed with staggered animation
        setSteps((prev) => prev.map((s, index) => (index === i ? { ...s, completed: true } : s)))
        clearInterval(progressInterval)
        setProgress(endProgress)
      }

      // Success state animations
      setAnimationPhase("success")
      setShowConfetti(true)
      setPulseAnimation(false)

      // Redirect with enhanced timing
      setTimeout(() => {
        router.push("/checkout/success")
      }, 3500)
    }

    // Simulate realistic error rate (1% chance)
    if (Math.random() < 0.01) {
      setTimeout(() => {
        setStage("error")
        setProgress(0)
        setAnimationPhase("enter")
        setPulseAnimation(false)
      }, 4000)
    } else {
      processPayment()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, router])

  const handleRetry = () => {
    setStage("processing")
    setProgress(0)
    setCurrentStepIndex(0)
    setAnimationPhase("enter")
    setPulseAnimation(true)
    setSteps((prev) => prev.map((step) => ({ ...step, completed: false })))
    setSecurityChecks((prev) => prev.map((check) => ({ ...check, completed: false })))

    setTimeout(() => {
      window.location.reload()
    }, 500)
  }

  const getStageContent = () => {
    switch (stage) {
      case "processing":
        return {
          icon: CreditCard,
          title: "Secure Payment Processing",
          description:
            "Your payment is being processed through our encrypted gateway with bank-grade security protocols.",
          color: "text-blue-600",
          bgColor: "bg-gradient-to-br from-blue-50 to-cyan-50",
          borderColor: "border-blue-300",
          ringColor: "ring-blue-500",
          gradientFrom: "from-blue-500",
          gradientTo: "to-cyan-500",
        }
      case "validating":
        return {
          icon: ShieldCheck,
          title: "Advanced Security Validation",
          description:
            "Performing comprehensive fraud detection and multi-factor authentication to protect your transaction.",
          color: "text-purple-600",
          bgColor: "bg-gradient-to-br from-purple-50 to-pink-50",
          borderColor: "border-purple-300",
          ringColor: "ring-purple-500",
          gradientFrom: "from-purple-500",
          gradientTo: "to-pink-500",
        }
      case "confirming":
        return {
          icon: Lock,
          title: "Bank Authorization in Progress",
          description: "Securing final approval from your financial institution with real-time verification protocols.",
          color: "text-indigo-600",
          bgColor: "bg-gradient-to-br from-indigo-50 to-blue-50",
          borderColor: "border-indigo-300",
          ringColor: "ring-indigo-500",
          gradientFrom: "from-indigo-500",
          gradientTo: "to-blue-500",
        }
      case "success":
        return {
          icon: CheckCircle,
          title: "Payment Successfully Completed!",
          description: "Your transaction has been approved and your order is confirmed. Thank you for your purchase!",
          color: "text-green-600",
          bgColor: "bg-gradient-to-br from-green-50 to-emerald-50",
          borderColor: "border-green-300",
          ringColor: "ring-green-500",
          gradientFrom: "from-green-500",
          gradientTo: "to-emerald-500",
        }
      case "error":
        return {
          icon: AlertCircle,
          title: "Payment Processing Issue",
          description:
            "We encountered a temporary issue while processing your payment. This is usually due to a network timeout or bank verification delay.",
          color: "text-red-600",
          bgColor: "bg-gradient-to-br from-red-50 to-orange-50",
          borderColor: "border-red-300",
          ringColor: "ring-red-500",
          gradientFrom: "from-red-500",
          gradientTo: "to-orange-500",
        }
    }
  }

  if (!isOpen) return null

  const stageContent = getStageContent()
  const StageIcon = stageContent.icon
  const currentStep = steps[currentStepIndex]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Enhanced Backdrop with Dynamic Blur */}
      <div
        className="absolute inset-0 bg-gradient-to-br from-slate-900/90 via-slate-800/85 to-slate-900/90 backdrop-blur-2xl transition-all duration-1000"
        style={{
          backdropFilter: "blur(20px) saturate(1.2)",
          background:
            stage === "success"
              ? "radial-gradient(circle at center, rgba(34, 197, 94, 0.1) 0%, rgba(15, 23, 42, 0.9) 70%)"
              : stage === "error"
                ? "radial-gradient(circle at center, rgba(239, 68, 68, 0.1) 0%, rgba(15, 23, 42, 0.9) 70%)"
                : "radial-gradient(circle at center, rgba(59, 130, 246, 0.1) 0%, rgba(15, 23, 42, 0.9) 70%)",
        }}
      />

      {/* Premium Confetti Animation */}
      {showConfetti && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {/* Premium confetti particles with physics */}
          {[...Array(150)].map((_, i) => (
            <div
              key={i}
              className="absolute animate-bounce"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 4}s`,
                animationDuration: `${2 + Math.random() * 4}s`,
                transform: `rotate(${Math.random() * 360}deg)`,
              }}
            >
              <div
                className={`w-4 h-4 rounded-full shadow-2xl ${
                  i % 8 === 0
                    ? "bg-gradient-to-br from-yellow-400 to-orange-400"
                    : i % 8 === 1
                      ? "bg-gradient-to-br from-green-400 to-emerald-400"
                      : i % 8 === 2
                        ? "bg-gradient-to-br from-blue-400 to-cyan-400"
                        : i % 8 === 3
                          ? "bg-gradient-to-br from-purple-400 to-pink-400"
                          : i % 8 === 4
                            ? "bg-gradient-to-br from-pink-400 to-rose-400"
                            : i % 8 === 5
                              ? "bg-gradient-to-br from-orange-400 to-red-400"
                              : i % 8 === 6
                                ? "bg-gradient-to-br from-indigo-400 to-purple-400"
                                : "bg-gradient-to-br from-teal-400 to-green-400"
                }`}
              />
            </div>
          ))}
          {/* Floating celebration elements */}
          {[...Array(40)].map((_, i) => (
            <div
              key={`celebration-${i}`}
              className="absolute animate-pulse"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 3}s`,
                animationDuration: `${1.5 + Math.random() * 2}s`,
              }}
            >
              {i % 3 === 0 ? (
                <Star className="w-6 h-6 text-yellow-400 drop-shadow-lg" />
              ) : i % 3 === 1 ? (
                <CheckCircle className="w-5 h-5 text-green-400 drop-shadow-lg" />
              ) : (
                <Award className="w-5 h-5 text-purple-400 drop-shadow-lg" />
              )}
            </div>
          ))}
        </div>
      )}

      {/* Premium Modal Design */}
      <Card
        className={`relative w-full max-w-3xl mx-auto bg-white/98 backdrop-blur-3xl border-2 shadow-2xl transition-all duration-1000 ${
          animationPhase === "enter"
            ? "animate-in fade-in-0 zoom-in-95 duration-700"
            : animationPhase === "success"
              ? "scale-105 shadow-3xl ring-4 ring-green-200"
              : ""
        } ${stageContent.borderColor} ring-4 ${stageContent.ringColor} ring-opacity-30 rounded-3xl overflow-hidden`}
        style={{
          background: "linear-gradient(135deg, rgba(255,255,255,0.98) 0%, rgba(255,255,255,0.95) 100%)",
          boxShadow:
            stage === "success"
              ? "0 25px 50px -12px rgba(34, 197, 94, 0.25), 0 0 0 1px rgba(34, 197, 94, 0.1)"
              : "0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.1)",
        }}
      >
        {/* Close button for error state */}
        {stage === "error" && (
          <Button
            variant="ghost"
            size="sm"
            className="absolute top-8 right-8 h-12 w-12 p-0 hover:bg-red-100 transition-all duration-300 rounded-full z-10 shadow-lg"
            onClick={onClose}
          >
            <X className="h-6 w-6" />
          </Button>
        )}

        <CardContent className="p-12">
          {/* Premium Header Section */}
          <div
            className={`text-center mb-12 p-8 rounded-3xl ${stageContent.bgColor} ${stageContent.borderColor} border-2 shadow-inner relative overflow-hidden`}
          >
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-5">
              <div className="absolute inset-0 bg-gradient-to-br from-white/50 to-transparent" />
              <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.1)_0%,transparent_50%)]" />
            </div>

            {/* Premium Icon with Multi-layer Effects */}
            <div className="relative mb-8">
              <div className="relative inline-block">
                {/* Outer glow layers */}
                <div
                  className={`absolute inset-0 bg-gradient-to-br ${stageContent.gradientFrom} ${stageContent.gradientTo} opacity-20 blur-3xl rounded-full scale-150 ${pulseAnimation ? "animate-pulse" : ""}`}
                />
                <div
                  className={`absolute inset-0 bg-gradient-to-br ${stageContent.gradientFrom} ${stageContent.gradientTo} opacity-10 blur-2xl rounded-full scale-125 ${pulseAnimation ? "animate-ping" : ""}`}
                />

                {/* Main icon container */}
                <div
                  className={`relative w-32 h-32 rounded-full bg-gradient-to-br ${stageContent.gradientFrom} ${stageContent.gradientTo} p-1 shadow-2xl`}
                >
                  <div className="w-full h-full rounded-full bg-white/95 backdrop-blur-sm flex items-center justify-center">
                    <StageIcon
                      className={`h-16 w-16 ${stageContent.color} transition-all duration-700 relative z-10`}
                    />
                  </div>
                </div>

                {/* Animated rings for processing states */}
                {stage !== "success" && stage !== "error" && (
                  <>
                    {/* Outer rotating ring */}
                    <div className="absolute inset-0 border-4 border-gray-200 rounded-full">
                      <div
                        className={`absolute inset-0 border-4 border-transparent rounded-full animate-spin`}
                        style={{
                          borderTopColor: stageContent.color.includes("blue")
                            ? "#3B82F6"
                            : stageContent.color.includes("purple")
                              ? "#8B5CF6"
                              : stageContent.color.includes("indigo")
                                ? "#6366F1"
                                : "#3B82F6",
                        }}
                      />
                    </div>
                    {/* Middle pulsing ring */}
                    <div className={`absolute inset-4 border-2 border-gray-300 rounded-full animate-ping opacity-60`} />
                    {/* Inner subtle ring */}
                    <div className="absolute inset-8 border border-gray-400 rounded-full animate-pulse opacity-40" />
                  </>
                )}

                {/* Success state celebration ring */}
                {stage === "success" && (
                  <div className="absolute inset-0 border-4 border-green-400 rounded-full animate-pulse shadow-2xl">
                    <div className="absolute inset-2 border-2 border-green-300 rounded-full animate-ping opacity-60" />
                  </div>
                )}
              </div>
            </div>

            {/* Premium Title and Description */}
            <h2 className="text-4xl font-bold mb-6 text-gray-900 tracking-tight leading-tight">{stageContent.title}</h2>
            <p className="text-gray-700 text-xl leading-relaxed max-w-2xl mx-auto font-medium">
              {stageContent.description}
            </p>
          </div>

          {/* Enhanced Progress Section */}
          {stage !== "error" && (
            <div className="mb-12">
              {/* Premium Progress Bar */}
              <div className="relative w-full bg-gray-200 rounded-full h-6 mb-10 overflow-hidden shadow-inner">
                <div
                  className={`absolute top-0 left-0 h-full bg-gradient-to-r ${stageContent.gradientFrom} ${stageContent.gradientTo} rounded-full transition-all duration-1000 ease-out shadow-lg relative overflow-hidden`}
                  style={{ width: `${progress}%` }}
                >
                  {/* Shimmer effect */}
                  <div
                    className="absolute top-0 left-0 h-full w-40 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-pulse"
                    style={{
                      transform: `translateX(${(progress / 100) * 500 - 160}px)`,
                      transition: "transform 1s ease-out",
                    }}
                  />
                </div>
                {/* Progress indicator dot */}
                <div
                  className={`absolute top-1/2 transform -translate-y-1/2 w-4 h-4 bg-white rounded-full shadow-lg border-2 ${stageContent.borderColor} transition-all duration-1000`}
                  style={{ left: `calc(${progress}% - 8px)` }}
                />
              </div>

              {/* Premium Progress Percentage */}
              <div className="text-center mb-10">
                <div className="inline-flex items-center space-x-4 bg-white/80 backdrop-blur-sm rounded-2xl px-8 py-4 shadow-lg border border-gray-200">
                  <span className="text-5xl font-bold text-gray-800 tabular-nums">{Math.round(progress)}%</span>
                  <div className="text-left">
                    <div className="text-lg font-semibold text-gray-700">Complete</div>
                    <div className="text-sm text-gray-500">Processing securely</div>
                  </div>
                </div>
              </div>

              {/* Premium Progress Steps */}
              <div className="space-y-6">
                {steps.map((step, index) => {
                  const StepIcon = step.icon
                  const isActive = index === currentStepIndex
                  const isCompleted = step.completed
                  const isPending = index > currentStepIndex

                  const stepColors = {
                    blue: { bg: "bg-blue-50", border: "border-blue-300", text: "text-blue-600", ring: "ring-blue-200" },
                    purple: {
                      bg: "bg-purple-50",
                      border: "border-purple-300",
                      text: "text-purple-600",
                      ring: "ring-purple-200",
                    },
                    indigo: {
                      bg: "bg-indigo-50",
                      border: "border-indigo-300",
                      text: "text-indigo-600",
                      ring: "ring-indigo-200",
                    },
                    green: {
                      bg: "bg-green-50",
                      border: "border-green-300",
                      text: "text-green-600",
                      ring: "ring-green-200",
                    },
                  }

                  const colors = stepColors[step.color as keyof typeof stepColors] || stepColors.blue

                  return (
                    <div
                      key={step.id}
                      className={`flex items-center space-x-6 p-6 rounded-2xl transition-all duration-700 relative overflow-hidden ${
                        isCompleted
                          ? "bg-green-50 border-2 border-green-300 scale-105 shadow-xl ring-4 ring-green-100"
                          : isActive
                            ? `${colors.bg} border-2 ${colors.border} scale-105 shadow-xl ring-4 ${colors.ring}`
                            : "bg-gray-50 border border-gray-200 hover:bg-gray-100 hover:shadow-md"
                      }`}
                    >
                      {/* Background gradient for active/completed states */}
                      {(isActive || isCompleted) && (
                        <div className="absolute inset-0 bg-gradient-to-r from-white/50 to-transparent opacity-60" />
                      )}

                      {/* Premium Step Icon */}
                      <div
                        className={`flex-shrink-0 relative z-10 ${
                          isCompleted ? "text-green-600" : isActive ? colors.text : "text-gray-400"
                        }`}
                      >
                        {isCompleted ? (
                          <div className="relative">
                            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center shadow-lg">
                              <CheckCircle className="h-8 w-8 text-green-600" />
                            </div>
                            <div className="absolute inset-0 bg-green-400 rounded-full animate-ping opacity-30" />
                          </div>
                        ) : isActive ? (
                          <div className="relative">
                            <div
                              className={`w-12 h-12 ${colors.bg} rounded-full flex items-center justify-center shadow-lg border-2 ${colors.border}`}
                            >
                              <StepIcon className="h-8 w-8 animate-pulse" />
                            </div>
                            <Loader2 className="absolute -top-1 -right-1 h-5 w-5 animate-spin text-blue-500" />
                            <div className="absolute inset-0 bg-blue-400 rounded-full animate-ping opacity-20" />
                          </div>
                        ) : (
                          <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center shadow-md">
                            <StepIcon className="h-8 w-8" />
                          </div>
                        )}
                      </div>

                      {/* Premium Step Content */}
                      <div className="flex-1 min-w-0 relative z-10">
                        <div className="flex items-center justify-between mb-3">
                          <h4
                            className={`font-bold text-xl ${
                              isCompleted
                                ? "text-green-800"
                                : isActive
                                  ? colors.text.replace("text-", "text-").replace("-600", "-800")
                                  : "text-gray-600"
                            }`}
                          >
                            {step.label}
                          </h4>
                          {isActive && (
                            <div className="flex items-center space-x-3 text-blue-600 bg-blue-100 px-4 py-2 rounded-full">
                              <Clock className="h-5 w-5 animate-pulse" />
                              <span className="text-sm font-semibold">Processing...</span>
                            </div>
                          )}
                        </div>
                        <p
                          className={`text-base leading-relaxed ${
                            isCompleted
                              ? "text-green-700"
                              : isActive
                                ? colors.text.replace("-600", "-700")
                                : "text-gray-500"
                          }`}
                        >
                          {step.description}
                        </p>
                      </div>

                      {/* Premium Completion Indicator */}
                      {isCompleted && (
                        <div className="flex-shrink-0 relative z-10">
                          <div className="w-4 h-4 bg-green-500 rounded-full animate-pulse shadow-lg ring-2 ring-green-200" />
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>

              {/* Security Checks for Validation Step */}
              {stage === "validating" && (
                <div className="mt-8 p-6 bg-purple-50 rounded-2xl border-2 border-purple-200">
                  <h3 className="text-lg font-bold text-purple-800 mb-4 flex items-center">
                    <Eye className="h-5 w-5 mr-2" />
                    Real-time Security Verification
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {securityChecks.map((check) => (
                      <div
                        key={check.id}
                        className={`flex items-center space-x-3 p-3 rounded-lg transition-all duration-500 ${
                          check.completed
                            ? "bg-green-100 text-green-800 border border-green-300"
                            : "bg-white text-purple-700 border border-purple-200"
                        }`}
                      >
                        {check.completed ? (
                          <CheckCircle className="h-5 w-5 text-green-600" />
                        ) : (
                          <Loader2 className="h-5 w-5 animate-spin text-purple-600" />
                        )}
                        <span className="font-medium">{check.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Premium Security Badges Section */}
          {stage !== "error" && (
            <div className="mb-10">
              {/* Enhanced Security Features Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
                <div className="flex flex-col items-center space-y-3 p-6 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl border-2 border-blue-200 shadow-lg hover:shadow-xl transition-all duration-300">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center shadow-lg">
                    <Shield className="h-8 w-8 text-white" />
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-blue-800">256-bit SSL</div>
                    <div className="text-sm text-blue-600">Military-grade encryption</div>
                  </div>
                </div>
                <div className="flex flex-col items-center space-y-3 p-6 bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl border-2 border-green-200 shadow-lg hover:shadow-xl transition-all duration-300">
                  <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full flex items-center justify-center shadow-lg">
                    <Fingerprint className="h-8 w-8 text-white" />
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-green-800">Fraud Detection</div>
                    <div className="text-sm text-green-600">Real-time monitoring</div>
                  </div>
                </div>
                <div className="flex flex-col items-center space-y-3 p-6 bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl border-2 border-purple-200 shadow-lg hover:shadow-xl transition-all duration-300">
                  <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center shadow-lg">
                    <Award className="h-8 w-8 text-white" />
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-purple-800">Secure Checkout</div>
                    <div className="text-sm text-purple-600">Industry-standard protection</div>
                  </div>
                </div>
              </div>

              {/* Additional Premium Security Indicators */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-8">
                <div className="flex items-center justify-center space-x-2 p-4 bg-gradient-to-r from-indigo-50 to-blue-50 rounded-xl border border-indigo-200 shadow-md">
                  <Wifi className="h-5 w-5 text-indigo-600" />
                  <span className="text-sm font-medium text-indigo-800">Secure Connection</span>
                </div>
                <div className="flex items-center justify-center space-x-2 p-4 bg-gradient-to-r from-teal-50 to-green-50 rounded-xl border border-teal-200 shadow-md">
                  <Database className="h-5 w-5 text-teal-600" />
                  <span className="text-sm font-medium text-teal-800">Data Protected</span>
                </div>
                <div className="flex items-center justify-center space-x-2 p-4 bg-gradient-to-r from-orange-50 to-red-50 rounded-xl border border-orange-200 shadow-md">
                  <Globe className="h-5 w-5 text-orange-600" />
                  <span className="text-sm font-medium text-orange-800">Global Security</span>
                </div>
                <div className="flex items-center justify-center space-x-2 p-4 bg-gradient-to-r from-pink-50 to-purple-50 rounded-xl border border-pink-200 shadow-md">
                  <Lock className="h-5 w-5 text-pink-600" />
                  <span className="text-sm font-medium text-pink-800">End-to-End</span>
                </div>
              </div>

              {/* Premium Trust Badges */}
              <div className="flex justify-center items-center space-x-8 p-6 bg-gradient-to-r from-gray-50 to-slate-50 rounded-2xl border border-gray-200 shadow-inner">
                <div className="text-center group hover:scale-105 transition-transform duration-300">
                  <div className="w-24 h-16 bg-white rounded-lg shadow-lg flex items-center justify-center mb-2 group-hover:shadow-xl transition-shadow">
                    <Image
                      src="/images/trustwave.png"
                      alt="Trustwave Trusted Commerce"
                      width={80}
                      height={32}
                      className="h-8 w-auto"
                    />
                  </div>
                  <div className="text-xs text-gray-600 font-medium">Verified Merchant</div>
                </div>
                <div className="text-center group hover:scale-105 transition-transform duration-300">
                  <div className="w-24 h-16 bg-white rounded-lg shadow-lg flex items-center justify-center mb-2 group-hover:shadow-xl transition-shadow">
                    <Image
                      src="/images/positivessl.png"
                      alt="PositiveSSL Secured"
                      width={80}
                      height={24}
                      className="h-6 w-auto"
                    />
                  </div>
                  <div className="text-xs text-gray-600 font-medium">SSL Protected</div>
                </div>
              </div>
            </div>
          )}

          {/* Error State with Premium Design */}
          {stage === "error" && (
            <div className="space-y-8">
              <div className="p-8 bg-gradient-to-br from-red-50 to-orange-50 border-2 border-red-200 rounded-2xl shadow-inner">
                <h3 className="font-bold text-red-800 mb-6 text-xl flex items-center">
                  <AlertCircle className="h-6 w-6 mr-3" />
                  Troubleshooting Guide:
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <div className="flex items-start space-x-3 p-3 bg-white/80 rounded-lg">
                      <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0" />
                      <span className="text-red-700 font-medium">Verify your card information is correct</span>
                    </div>
                    <div className="flex items-start space-x-3 p-3 bg-white/80 rounded-lg">
                      <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0" />
                      <span className="text-red-700 font-medium">Check that your card has sufficient funds</span>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-start space-x-3 p-3 bg-white/80 rounded-lg">
                      <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0" />
                      <span className="text-red-700 font-medium">Ensure your billing address matches</span>
                    </div>
                    <div className="flex items-start space-x-3 p-3 bg-white/80 rounded-lg">
                      <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0" />
                      <span className="text-red-700 font-medium">Try a different payment method</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex space-x-4">
                <Button
                  onClick={handleRetry}
                  className="flex-1 h-16 text-lg font-semibold shadow-xl hover:shadow-2xl transition-all duration-300 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                >
                  <Zap className="h-6 w-6 mr-3" />
                  Try Again
                </Button>
                <Button
                  variant="outline"
                  onClick={onClose}
                  className="flex-1 h-16 text-lg font-semibold bg-white hover:bg-gray-50 shadow-xl hover:shadow-2xl transition-all duration-300 border-2"
                >
                  Cancel Order
                </Button>
              </div>
            </div>
          )}

          {/* Processing State Message */}
          {stage !== "error" && stage !== "success" && (
            <div className="text-center p-8 bg-gradient-to-r from-amber-50 to-yellow-50 border-2 border-amber-200 rounded-2xl shadow-inner">
              <div className="flex items-center justify-center space-x-4 text-amber-800 mb-4">
                <div className="relative">
                  <Lock className="h-8 w-8 animate-pulse" />
                  <div className="absolute inset-0 bg-amber-400 rounded-full animate-ping opacity-30" />
                </div>
                <span className="font-bold text-xl">Secure Transaction in Progress</span>
              </div>
              <div className="text-amber-700 text-lg mb-4">
                Your payment is being processed with the highest security standards
              </div>
              <div className="text-sm text-amber-600 bg-amber-100 inline-block px-4 py-2 rounded-full">
                Please do not close this window or navigate away
              </div>
            </div>
          )}

          {/* Success State Message */}
          {stage === "success" && (
            <div className="text-center p-8 bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 rounded-2xl shadow-inner relative overflow-hidden">
              {/* Success background pattern */}
              <div className="absolute inset-0 opacity-10">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(34,197,94,0.3)_0%,transparent_50%)]" />
              </div>

              <div className="relative z-10">
                <div className="flex items-center justify-center space-x-4 text-green-800 mb-6">
                  <div className="relative">
                    <CheckCircle className="h-10 w-10" />
                    <div className="absolute inset-0 bg-green-400 rounded-full animate-ping opacity-40" />
                  </div>
                  <span className="font-bold text-2xl">Order #{orderNumber}</span>
                </div>
                <p className="text-green-700 text-xl mb-4 font-semibold">Payment completed successfully!</p>
                <p className="text-green-600 mb-6">Your order has been confirmed and is being prepared for shipment.</p>
                <div className="inline-flex items-center space-x-3 bg-green-100 px-6 py-3 rounded-full">
                  <Loader2 className="h-5 w-5 animate-spin text-green-600" />
                  <span className="text-green-700 font-medium">Redirecting to confirmation page...</span>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}


