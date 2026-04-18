"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"
import { MapPin, Truck, CheckCircle, Loader2, Calendar, Package } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  getShippingOptions,
  calculateDeliveryRange,
  formatDeliveryDate,
  formatDeliveryRange,
  validateZipCode,
  getRegionalAdjustment,
} from "@/lib/delivery-calculator"

interface DeliveryOption {
  id: string
  name: string
  description: string
  price: number
  days: string
  icon: React.ReactNode
  popular?: boolean
  minDate: Date
  maxDate: Date
  estimatedDate: Date
}

interface DeliveryCalculatorProps {
  productPrice?: number
  isPreOrder?: boolean
  preOrderDate?: string
  className?: string
}

export function DeliveryCalculator({
  productPrice = 0,
  isPreOrder = false,
  preOrderDate,
  className = "",
}: DeliveryCalculatorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [zipCode, setZipCode] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const [selectedOption, setSelectedOption] = useState<string | null>(null)
  const [deliveryOptions, setDeliveryOptions] = useState<DeliveryOption[]>([])

  // Format ZIP code input
  const handleZipCodeChange = (value: string) => {
    const formatted = value.replace(/\D/g, "").slice(0, 5)
    setZipCode(formatted)
  }

  const freeShippingThreshold = 75
  const isFreeShipping = productPrice >= freeShippingThreshold

  const calculateDelivery = async () => {
    if (!validateZipCode(zipCode)) return

    setIsLoading(true)
    setShowResults(false)

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500))

    const currentDate = new Date()
    const orderDate = isPreOrder && preOrderDate ? new Date(preOrderDate) : currentDate
    const regionalAdjustment = getRegionalAdjustment(zipCode)
    const shippingOptions = getShippingOptions(productPrice)

    const options: DeliveryOption[] = shippingOptions.map((option) => {
      const adjustedMinDays = option.minDays + regionalAdjustment
      const adjustedMaxDays = option.maxDays + regionalAdjustment

      const { minDate, maxDate, estimatedDate } = calculateDeliveryRange(
        orderDate,
        adjustedMinDays,
        adjustedMaxDays,
        1, // 1 day processing time
      )

      let adjustedPrice = option.price
      if (regionalAdjustment > 0 && option.price > 0) {
        adjustedPrice = option.price + 2.99
      }

      return {
        id: option.id,
        name: option.name,
        description: `${adjustedMinDays}-${adjustedMaxDays} business days`,
        price: adjustedPrice,
        days: `${adjustedMinDays}-${adjustedMaxDays}`,
        icon: <Package className="w-4 h-4" />,
        popular: option.popular,
        minDate,
        maxDate,
        estimatedDate,
      }
    })

    setDeliveryOptions(options)
    setIsLoading(false)
    setShowResults(true)
  }

  const handleReset = () => {
    setZipCode("")
    setShowResults(false)
    setSelectedOption(null)
    setDeliveryOptions([])
  }

  const handleClose = () => {
    setIsOpen(false)
    setTimeout(() => {
      handleReset()
    }, 300)
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "flex items-center gap-2 transition-all duration-200 hover:shadow-md hover:scale-105",
            className,
          )}
        >
          <MapPin className="w-4 h-4" />
          <span className="hidden sm:inline">Calculate Delivery</span>
          <span className="sm:hidden">Delivery</span>
        </Button>
      </DialogTrigger>

      <DialogContent className="fixed left-[50%] top-[50%] translate-x-[-50%] translate-y-[-50%] w-full max-w-lg mx-4 my-4 max-h-[90vh] overflow-y-auto bg-white rounded-xl shadow-2xl border-0 z-50 animate-in fade-in-0 zoom-in-95 slide-in-from-left-1/2 slide-in-from-top-[48%] duration-300">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-white to-purple-50 rounded-xl" />

        <div className="relative z-10">
          <DialogHeader className="text-center pb-6 border-b border-gray-100">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
              <Truck className="w-8 h-8 text-white" />
            </div>
            <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Delivery Calculator
            </DialogTitle>
            <p className="text-gray-600 mt-2">
              Get accurate delivery estimates for your {isPreOrder ? "pre-order" : "order"}
            </p>
          </DialogHeader>

          <div className="py-6 space-y-6">
            {!showResults ? (
              <div className="space-y-6">
                {/* ZIP Code Input */}
                <div className="space-y-3">
                  <label className="block text-sm font-semibold text-gray-700">Enter your ZIP code</label>
                  <div className="relative">
                    <Input
                      type="text"
                      placeholder="12345"
                      value={zipCode}
                      onChange={(e) => handleZipCodeChange(e.target.value)}
                      className="pl-10 pr-4 py-3 text-lg font-mono tracking-wider border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-lg transition-all duration-200"
                      maxLength={5}
                    />
                    <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  </div>
                  <p className="text-xs text-gray-500">we&apos;ll calculate delivery options based on your location</p>
                </div>

                {/* Order Info */}
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4 border border-blue-100">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">Order Value:</span>
                    <span className="font-bold text-lg text-blue-600">${productPrice.toFixed(2)}</span>
                  </div>

                  {isFreeShipping ? (
                    <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 rounded-md p-2">
                      <CheckCircle className="w-4 h-4" />
                      <span className="font-medium">Qualifies for FREE standard shipping!</span>
                    </div>
                  ) : (
                    <div className="text-sm text-blue-700 bg-blue-50 rounded-md p-2">
                      <span>Add ${(75 - productPrice).toFixed(2)} more for FREE shipping</span>
                    </div>
                  )}

                  {isPreOrder && (
                    <div className="flex items-center gap-2 text-sm text-purple-700 bg-purple-50 rounded-md p-2 mt-2">
                      <Calendar className="w-4 h-4" />
                      <span>Pre-order item - delivery calculated from release date</span>
                    </div>
                  )}
                </div>

                {/* Calculate Button */}
                <Button
                  onClick={calculateDelivery}
                  disabled={zipCode.length !== 5 || isLoading}
                  className="w-full py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-lg transition-all duration-200 transform hover:scale-105 disabled:transform-none disabled:opacity-50"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Calculating...
                    </>
                  ) : (
                    <>
                      <Truck className="w-5 h-5 mr-2" />
                      Calculate Delivery Options
                    </>
                  )}
                </Button>
              </div>
            ) : (
              <div className="space-y-6 animate-in fade-in-0 slide-in-from-bottom-4 duration-500">
                {/* Results Header */}
                <div className="text-center">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <CheckCircle className="w-6 h-6 text-green-600" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900">Delivery Options for {zipCode}</h3>
                  <p className="text-sm text-gray-600 mt-1">Choose your preferred delivery method</p>
                </div>

                {/* Delivery Options */}
                <div className="space-y-3">
                  {deliveryOptions.map((option, index) => {
                    const estimatedDate = formatDeliveryDate(option.estimatedDate)
                    const dateRange = formatDeliveryRange(option.minDate, option.maxDate)

                    return (
                      <Card
                        key={option.id}
                        className={`cursor-pointer transition-all duration-300 hover:shadow-lg hover:scale-[1.02] border-2 animate-in slide-in-from-left-4 ${
                          selectedOption === option.id
                            ? "border-blue-500 bg-blue-50 shadow-md"
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                        style={{ animationDelay: `${index * 100}ms` }}
                        onClick={() => setSelectedOption(option.id)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white">
                                {option.icon}
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <h4 className="font-semibold text-gray-900">{option.name}</h4>
                                  {option.price === 0 && (
                                    <Badge className="bg-green-500 text-white text-xs">FREE</Badge>
                                  )}
                                  {option.popular && (
                                    <Badge className="bg-orange-500 text-white text-xs">POPULAR</Badge>
                                  )}
                                </div>
                                <p className="text-sm text-gray-600">{option.description}</p>
                                <p className="text-xs text-blue-600 font-medium mt-1">{estimatedDate}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="font-bold text-lg">
                                {option.price === 0 ? "FREE" : `$${option.price.toFixed(2)}`}
                              </div>
                              <div className="text-xs text-gray-500">{dateRange}</div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>

                <Separator />

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={handleReset}
                    className="flex-1 py-2 border-gray-300 hover:bg-gray-50 bg-transparent"
                  >
                    Calculate Again
                  </Button>
                  <Button
                    onClick={handleClose}
                    className="flex-1 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
                  >
                    Close
                  </Button>
                </div>

                {/* Additional Info */}
                <div className="bg-gray-50 rounded-lg p-3 text-center">
                  <p className="text-xs text-gray-600">
                    All delivery times exclude weekends and US federal holidays. Processing time included.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

