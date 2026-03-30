"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import {
  Calculator,
  Truck,
  Clock,
  MapPin,
  Package,
  CheckCircle,
  AlertCircle,
  Zap,
  Shield,
  Star,
  Calendar,
  DollarSign,
} from "lucide-react"
import { calculateDelivery, type DeliveryOption, type DeliveryInfo } from "@/lib/delivery-calculator"

interface EnhancedDeliveryCalculatorProps {
  productPrice: number
  isPreOrder?: boolean
  preOrderDate?: string
  onShippingSelect?: (option: DeliveryOption, deliveryInfo: DeliveryInfo) => void
  className?: string
}

export function EnhancedDeliveryCalculator({
  productPrice,
  isPreOrder = false,
  preOrderDate,
  onShippingSelect,
  className = "",
}: EnhancedDeliveryCalculatorProps) {
  const [zipCode, setZipCode] = useState("")
  const [isCalculating, setIsCalculating] = useState(false)
  const [deliveryResults, setDeliveryResults] = useState<Array<{
    option: DeliveryOption
    deliveryInfo: DeliveryInfo
  }> | null>(null)
  const [selectedOption, setSelectedOption] = useState<{ option: DeliveryOption; deliveryInfo: DeliveryInfo } | null>(
    null,
  )
  const [isOpen, setIsOpen] = useState(false)
  const [error, setError] = useState("")

  const validateZipCode = (zip: string) => {
    const zipRegex = /^\d{5}(-\d{4})?$/
    return zipRegex.test(zip)
  }

  const handleCalculate = async () => {
    if (!validateZipCode(zipCode)) {
      setError("Please enter a valid ZIP code (e.g., 12345 or 12345-6789)")
      return
    }

    setError("")
    setIsCalculating(true)

    // Simulate API call delay
    await new Promise((resolve) => setTimeout(resolve, 1500))

    const results = calculateDelivery(zipCode, productPrice, isPreOrder, preOrderDate)
    setDeliveryResults(results)
    setIsCalculating(false)
  }

  const handleOptionSelect = (option: DeliveryOption, deliveryInfo: DeliveryInfo) => {
    const selection = { option, deliveryInfo }
    setSelectedOption(selection)
    onShippingSelect?.(option, deliveryInfo)
    setIsOpen(false)
  }

  const resetCalculator = () => {
    setDeliveryResults(null)
    setSelectedOption(null)
    setZipCode("")
    setError("")
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className={`gap-2 transition-all duration-200 hover:scale-105 ${className}`}>
          <Calculator className="h-4 w-4" />
          Calculate Delivery
        </Button>
      </DialogTrigger>

      <DialogContent className="w-[95vw] max-w-2xl max-h-[90vh] overflow-y-auto bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <DialogHeader className="text-center pb-4 border-b border-blue-200">
          <div className="flex items-center justify-center gap-3 mb-2">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center animate-pulse">
              <Truck className="w-6 h-6 text-white" />
            </div>
            <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Smart Delivery Calculator
            </DialogTitle>
          </div>
          <p className="text-gray-600 text-sm">Get precise delivery estimates with holiday and weekend calculations</p>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {!deliveryResults ? (
            // Input Section
            <div className="space-y-4">
              <div className="bg-white/70 rounded-lg p-4 border border-blue-200">
                <div className="flex items-center gap-2 mb-3">
                  <MapPin className="h-5 w-5 text-blue-600" />
                  <label className="font-semibold text-gray-900">Enter Your ZIP Code</label>
                </div>

                <div className="flex gap-2">
                  <div className="flex-1">
                    <Input
                      type="text"
                      placeholder="e.g., 12345 or 12345-6789"
                      value={zipCode}
                      onChange={(e) => {
                        setZipCode(e.target.value)
                        setError("")
                      }}
                      className={`transition-all duration-200 ${error ? "border-red-300 focus:border-red-500" : "border-blue-300 focus:border-blue-500"}`}
                      maxLength={10}
                    />
                    {error && (
                      <div className="flex items-center gap-1 mt-2 text-red-600 text-sm">
                        <AlertCircle className="h-4 w-4" />
                        <span>{error}</span>
                      </div>
                    )}
                  </div>

                  <Button
                    onClick={handleCalculate}
                    disabled={isCalculating || !zipCode}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 transition-all duration-200 px-6"
                  >
                    {isCalculating ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Calculating...</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Calculator className="h-4 w-4" />
                        <span>Calculate</span>
                      </div>
                    )}
                  </Button>
                </div>
              </div>

              {/* Order Info */}
              <div className="bg-white/70 rounded-lg p-4 border border-blue-200">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Package className="h-5 w-5 text-blue-600" />
                  Order Information
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Order Value:</span>
                    <span className="font-semibold">${productPrice.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Free Shipping:</span>
                    <span className={`font-semibold ${productPrice >= 75 ? "text-green-600" : "text-orange-600"}`}>
                      {productPrice >= 75 ? "Qualified ✓" : `Need $${(75 - productPrice).toFixed(2)} more`}
                    </span>
                  </div>
                  {isPreOrder && (
                    <div className="flex justify-between sm:col-span-2">
                      <span className="text-gray-600">Pre-order Release:</span>
                      <span className="font-semibold text-purple-600">{preOrderDate || "TBA"}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Features */}
              <div className="bg-white/70 rounded-lg p-4 border border-blue-200">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Star className="h-5 w-5 text-yellow-500" />
                  Calculator Features
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                  <div className="flex items-center gap-2 text-gray-700">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span>Holiday-aware calculations</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-700">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span>Weekend exclusions</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-700">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span>Regional pricing adjustments</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-700">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span>Real-time carrier rates</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            // Results Section
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-6 w-6 text-green-600 animate-bounce" />
                  <h3 className="text-lg font-bold text-gray-900">Delivery Options for {zipCode}</h3>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={resetCalculator}
                  className="text-blue-600 border-blue-300 hover:bg-blue-50 bg-transparent"
                >
                  Calculate Again
                </Button>
              </div>

              <div className="space-y-3">
                {deliveryResults.map((result, index) => (
                  <Card
                    key={result.option.id}
                    className={`transition-all duration-300 hover:shadow-lg cursor-pointer transform hover:scale-[1.02] animate-slide-in border-2 ${
                      selectedOption?.option.id === result.option.id
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 hover:border-blue-300"
                    }`}
                    style={{ animationDelay: `${index * 100}ms` }}
                    onClick={() => handleOptionSelect(result.option, result.deliveryInfo)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-10 h-10 rounded-full flex items-center justify-center ${
                              result.option.id === "express"
                                ? "bg-red-100"
                                : result.option.id === "priority"
                                  ? "bg-orange-100"
                                  : "bg-blue-100"
                            }`}
                          >
                            {result.option.id === "express" ? (
                              <Zap className="h-5 w-5 text-red-600" />
                            ) : result.option.id === "priority" ? (
                              <Clock className="h-5 w-5 text-orange-600" />
                            ) : (
                              <Truck className="h-5 w-5 text-blue-600" />
                            )}
                          </div>
                          <div>
                            <h4 className="font-bold text-gray-900 flex items-center gap-2">
                              {result.option.name}
                              {result.option.id === "express" && (
                                <Badge className="bg-red-500 text-white text-xs">FASTEST</Badge>
                              )}
                              {result.deliveryInfo.adjustedPrice === 0 && (
                                <Badge className="bg-green-500 text-white text-xs">FREE</Badge>
                              )}
                            </h4>
                            <p className="text-sm text-gray-600">{result.option.description}</p>
                          </div>
                        </div>

                        <div className="text-right">
                          <div className="text-xl font-bold text-gray-900">
                            {result.deliveryInfo.adjustedPrice === 0
                              ? "FREE"
                              : `$${result.deliveryInfo.adjustedPrice.toFixed(2)}`}
                          </div>
                          {result.deliveryInfo.originalPrice !== result.deliveryInfo.adjustedPrice && (
                            <div className="text-sm text-gray-500 line-through">
                              ${result.deliveryInfo.originalPrice.toFixed(2)}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-1 text-gray-600">
                            <Calendar className="h-4 w-4" />
                            <span>
                              Arrives{" "}
                              {result.deliveryInfo.estimatedDate.toLocaleDateString("en-US", {
                                weekday: "short",
                                month: "short",
                                day: "numeric",
                              })}
                            </span>
                          </div>
                          <div className="flex items-center gap-1 text-gray-600">
                            <Clock className="h-4 w-4" />
                            <span>{result.deliveryInfo.businessDays} business days</span>
                          </div>
                        </div>

                        {selectedOption?.option.id === result.option.id && (
                          <div className="flex items-center gap-1 text-blue-600 font-medium">
                            <CheckCircle className="h-4 w-4" />
                            <span>Selected</span>
                          </div>
                        )}
                      </div>

                      {result.deliveryInfo.savings > 0 && (
                        <div className="mt-2 flex items-center gap-1 text-green-600 text-sm font-medium">
                          <DollarSign className="h-4 w-4" />
                          <span>You save ${result.deliveryInfo.savings.toFixed(2)}!</span>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Additional Info */}
              <div className="bg-white/70 rounded-lg p-4 border border-blue-200 mt-4">
                <div className="flex items-center gap-2 mb-2">
                  <Shield className="h-5 w-5 text-green-600" />
                  <h4 className="font-semibold text-gray-900">Delivery Guarantee</h4>
                </div>
                <div className="text-sm text-gray-600 space-y-1">
                  <p>• All delivery times exclude weekends and federal holidays</p>
                  <p>• Free shipping automatically applied on orders $75+</p>
                  <p>• Tracking information provided for all shipments</p>
                  <p>• Secure packaging with authenticity verification</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
