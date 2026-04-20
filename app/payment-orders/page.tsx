/* eslint-disable react/no-unescaped-entities */
"use client"

import { useState } from "react"
import {
  CheckCircle,
  Shield,
  CreditCard,
  Package,
  Truck,
  Clock,
  AlertTriangle,
  Phone,
  Mail,
  Lock,
  Eye,
  Users,
} from "lucide-react"
import Image from "next/image"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import { Footer } from "@/app/components/footer"
import { Header } from "@/app/components/header"

export default function PaymentOrdersPage() {
  const [activeStep, setActiveStep] = useState(0)

  const paymentSteps = [
    {
      icon: CheckCircle,
      title: "Order Placed",
      description: "Your order is confirmed and entered into our system",
      color: "text-green-600",
      bgColor: "bg-green-50",
      time: "Immediate",
    },
    {
      icon: Shield,
      title: "Payment Verification",
      description: "Security checks and authorization hold placed",
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      time: "1-24 hours",
    },
    {
      icon: Package,
      title: "Order Processing",
      description: "Items picked, packed, and prepared for shipment",
      color: "text-orange-600",
      bgColor: "bg-orange-50",
      time: "1-2 business days",
    },
    {
      icon: CreditCard,
      title: "Payment Charged",
      description: "Final payment processed when order ships",
      color: "text-purple-600",
      bgColor: "bg-purple-50",
      time: "At shipment",
    },
  ]

  const securityFeatures = [
    {
      icon: Lock,
      title: "256-bit SSL Encryption",
      description: "All payment data is encrypted using industry-standard security protocols",
    },
    {
      icon: Shield,
      title: "PCI DSS Compliant",
      description: "We meet the highest standards for payment card industry security",
    },
    {
      icon: Eye,
      title: "AI Fraud Detection",
      description: "Advanced algorithms monitor transactions for suspicious activity",
    },
    {
      icon: Users,
      title: "Manual Review Process",
      description: "Our security team reviews flagged orders to prevent fraud",
    },
  ]

  const acceptedCards = [
    { name: "Visa", logo: "/images/visa.svg" },
    { name: "Mastercard", logo: "/images/mastercard.svg" },
    { name: "American Express", logo: "/images/amex.svg" },
    { name: "Discover", logo: "/images/discover.svg" },
  ]

  const fulfillmentSteps = [
    {
      step: 1,
      title: "Order Confirmation",
      description: "You receive an email confirmation with your order details",
      time: "Immediate",
    },
    {
      step: 2,
      title: "Payment Verification",
      description: "Our security team verifies your payment information",
      time: "1-24 hours",
    },
    {
      step: 3,
      title: "Inventory Check",
      description: "We confirm all items are in stock and available",
      time: "1-2 hours",
    },
    {
      step: 4,
      title: "Order Processing",
      description: "Items are picked from our warehouse and carefully packed",
      time: "1-2 business days",
    },
    {
      step: 5,
      title: "Shipment",
      description: "Your order is shipped and tracking information is provided",
      time: "Same day as processing",
    },
    {
      step: 6,
      title: "Delivery",
      description: "Your order arrives at your specified address",
      time: "Based on shipping method",
    },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-700 text-white">
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-4xl mx-auto text-center">
            <div className="flex justify-center mb-6">
              <div className="bg-white/20 p-4 rounded-full">
                <Shield className="h-12 w-12" />
              </div>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-6">Payment & Orders</h1>
            <p className="text-xl md:text-2xl mb-8 text-blue-100">
              Understanding our secure payment process and order fulfillment
            </p>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        <Tabs defaultValue="payment-process" className="max-w-6xl mx-auto">
          <TabsList className="grid w-full grid-cols-4 mb-8">
            <TabsTrigger value="payment-process" className="flex items-center space-x-2">
              <CreditCard className="h-4 w-4" />
              <span className="hidden sm:inline">Payment Process</span>
            </TabsTrigger>
            <TabsTrigger value="security" className="flex items-center space-x-2">
              <Shield className="h-4 w-4" />
              <span className="hidden sm:inline">Security</span>
            </TabsTrigger>
            <TabsTrigger value="fulfillment" className="flex items-center space-x-2">
              <Package className="h-4 w-4" />
              <span className="hidden sm:inline">Fulfillment</span>
            </TabsTrigger>
            <TabsTrigger value="payment-methods" className="flex items-center space-x-2">
              <CreditCard className="h-4 w-4" />
              <span className="hidden sm:inline">Payment Methods</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="payment-process" className="space-y-8">
            {/* Payment Timeline */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Clock className="h-5 w-5" />
                  <span>Payment Processing Timeline</span>
                </CardTitle>
                <CardDescription>
                  Your card will not be charged immediately. Here&apos;s our secure payment process:
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {paymentSteps.map((step, index) => {
                    const Icon = step.icon
                    return (
                      <div key={index} className="flex items-start space-x-4">
                        <div className={`${step.bgColor} p-3 rounded-full flex-shrink-0`}>
                          <Icon className={`h-6 w-6 ${step.color}`} />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <h3 className="text-lg font-semibold">{step.title}</h3>
                            <Badge variant="outline">{step.time}</Badge>
                          </div>
                          <p className="text-gray-600">{step.description}</p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Authorization Hold Explanation */}
            <Card>
              <CardHeader>
                <CardTitle>Authorization Hold Explained</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Important:</strong> You may see a temporary authorization hold on your card statement. This
                    is NOT a charge.
                  </AlertDescription>
                </Alert>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold mb-2">What is an Authorization Hold?</h4>
                    <p className="text-gray-600 text-sm">
                      A small temporary hold (usually $1-5) that verifies your payment method is valid. This hold will
                      disappear from your statement within 1-3 business days.
                    </p>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">When Will I Be Charged?</h4>
                    <p className="text-gray-600 text-sm">
                      Your card will only be charged the full order amount when your items are ready to ship and leave
                      our warehouse facility.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="security" className="space-y-8">
            {/* Security Measures */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Shield className="h-5 w-5" />
                  <span>Our Security Commitment</span>
                </CardTitle>
                <CardDescription>
                  We implement multiple layers of security to protect your financial information
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-6">
                  {securityFeatures.map((feature, index) => {
                    const Icon = feature.icon
                    return (
                      <div key={index} className="flex items-start space-x-3">
                        <div className="bg-blue-50 p-2 rounded-lg flex-shrink-0">
                          <Icon className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <h4 className="font-semibold mb-1">{feature.title}</h4>
                          <p className="text-sm text-gray-600">{feature.description}</p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Verification Process */}
            <Card>
              <CardHeader>
                <CardTitle>Payment Verification Process</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <div className="bg-blue-100 p-3 rounded-full w-fit mx-auto mb-3">
                      <CreditCard className="h-6 w-6 text-blue-600" />
                    </div>
                    <h4 className="font-semibold mb-2">Billing Verification</h4>
                    <p className="text-sm text-gray-600">
                      We verify your billing address matches your card's registered address
                    </p>
                  </div>
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <div className="bg-green-100 p-3 rounded-full w-fit mx-auto mb-3">
                      <Eye className="h-6 w-6 text-green-600" />
                    </div>
                    <h4 className="font-semibold mb-2">Pattern Analysis</h4>
                    <p className="text-sm text-gray-600">
                      AI algorithms analyze purchase patterns to detect unusual activity
                    </p>
                  </div>
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <div className="bg-purple-100 p-3 rounded-full w-fit mx-auto mb-3">
                      <Users className="h-6 w-6 text-purple-600" />
                    </div>
                    <h4 className="font-semibold mb-2">Manual Review</h4>
                    <p className="text-sm text-gray-600">Our security team manually reviews flagged transactions</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Why We Do This */}
            <Card>
              <CardHeader>
                <CardTitle>Why We Implement These Security Measures</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold mb-3 flex items-center">
                      <Shield className="h-5 w-5 mr-2 text-blue-600" />
                      Protecting You
                    </h4>
                    <ul className="space-y-2 text-sm text-gray-600">
                      <li>• Prevents unauthorized use of your payment information</li>
                      <li>• Reduces risk of identity theft and fraud</li>
                      <li>• Ensures secure handling of your financial data</li>
                      <li>• Provides peace of mind during online shopping</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-3 flex items-center">
                      <Users className="h-5 w-5 mr-2 text-green-600" />
                      Protecting Our Community
                    </h4>
                    <ul className="space-y-2 text-sm text-gray-600">
                      <li>• Maintains fair pricing for all customers</li>
                      <li>• Prevents fraudulent orders from affecting inventory</li>
                      <li>• Ensures legitimate customers get the products they want</li>
                      <li>• Builds trust in our marketplace</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="fulfillment" className="space-y-8">
            {/* Order Fulfillment Process */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Package className="h-5 w-5" />
                  <span>Order Fulfillment Process</span>
                </CardTitle>
                <CardDescription>
                  From order confirmation to delivery - Here&apos;s what happens to your order
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {fulfillmentSteps.map((step, index) => (
                    <div key={index} className="flex items-start space-x-4">
                      <div className="bg-blue-100 text-blue-600 rounded-full w-8 h-8 flex items-center justify-center font-semibold text-sm flex-shrink-0">
                        {step.step}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-semibold">{step.title}</h4>
                          <Badge variant="outline">{step.time}</Badge>
                        </div>
                        <p className="text-gray-600 text-sm">{step.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Shipping Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Truck className="h-5 w-5" />
                  <span>Shipping & Tracking</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-3 gap-6">
                  <div>
                    <h4 className="font-semibold mb-2">Standard Shipping</h4>
                    <p className="text-sm text-gray-600 mb-2">5-7 business days</p>
                    <p className="text-sm text-gray-600">$9.99 (FREE over $75)</p>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Express Shipping</h4>
                    <p className="text-sm text-gray-600 mb-2">2-3 business days</p>
                    <p className="text-sm text-gray-600">$19.99</p>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Overnight Shipping</h4>
                    <p className="text-sm text-gray-600 mb-2">1 business day</p>
                    <p className="text-sm text-gray-600">$39.99</p>
                  </div>
                </div>
                <Separator className="my-6" />
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-semibold mb-2">Tracking Information</h4>
                  <p className="text-sm text-gray-600">
                    Once your order ships, you&apos;ll receive an email with tracking information. You can also track your
                    order anytime by visiting your account dashboard or using our order tracking page.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="payment-methods" className="space-y-8">
            {/* Accepted Payment Methods */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <CreditCard className="h-5 w-5" />
                  <span>Accepted Payment Methods</span>
                </CardTitle>
                <CardDescription>We accept the following credit cards for secure transactions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  {acceptedCards.map((card, index) => (
                    <div
                      key={index}
                      className="bg-white border-2 border-gray-200 rounded-lg p-4 text-center hover:border-blue-300 transition-colors"
                    >
                      <Image src={card.logo || "/placeholder.svg"} alt={card.name} width={100} height={32} className="h-8 mx-auto mb-2 object-contain" />
                      <p className="text-sm font-medium">{card.name}</p>
                    </div>
                  ))}
                </div>

                <Alert className="border-red-200 bg-red-50">
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                  <AlertDescription className="text-red-800">
                    <strong>Important:</strong> We only accept traditional credit cards. Virtual cards, debit gift
                    cards, and prepaid cards are not supported and orders using these payment methods will be
                    automatically cancelled.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>

            {/* Payment Requirements */}
            <Card>
              <CardHeader>
                <CardTitle>Payment Requirements</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold mb-3 text-green-600">✓ Accepted</h4>
                    <ul className="space-y-2 text-sm">
                      <li>• Visa credit cards</li>
                      <li>• Mastercard credit cards</li>
                      <li>• American Express credit cards</li>
                      <li>• Discover credit cards</li>
                      <li>• Cards with matching billing addresses</li>
                      <li>• Cards with sufficient credit limits</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-3 text-red-600">✗ Not Accepted</h4>
                    <ul className="space-y-2 text-sm">
                      <li>• Virtual credit cards</li>
                      <li>• Debit gift cards</li>
                      <li>• Prepaid cards</li>
                      
                      <li>• Bank transfers or wire payments</li>
                      <li>• Cryptocurrency payments</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Why These Restrictions */}
            <Card>
              <CardHeader>
                <CardTitle>Why These Payment Restrictions?</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <p className="text-gray-600">
                    Our payment restrictions are in place to ensure the security and integrity of all transactions:
                  </p>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-semibold mb-2">Security Benefits</h4>
                      <ul className="space-y-1 text-sm text-gray-600">
                        <li>• Enhanced fraud protection</li>
                        <li>• Better chargeback protection</li>
                        <li>• Verified cardholder identity</li>
                        <li>• Reduced payment disputes</li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-2">Customer Benefits</h4>
                      <ul className="space-y-1 text-sm text-gray-600">
                        <li>• Faster order processing</li>
                        <li>• Better customer service</li>
                        <li>• Easier returns and refunds</li>
                        <li>• Protected purchase history</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Contact Support */}
        <Card className="mt-12">
          <CardHeader>
            <CardTitle>Need Help with Your Payment or Order?</CardTitle>
            <CardDescription>
              Our customer service team is here to assist you with any questions or concerns
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="text-center">
                <div className="bg-blue-100 p-3 rounded-full w-fit mx-auto mb-3">
                  <Phone className="h-6 w-6 text-blue-600" />
                </div>
                <h4 className="font-semibold mb-2">Phone Support</h4>
                <p className="text-sm text-gray-600 mb-2"><a href="tel:+13036683245" className="text-gray-600">+1 (303) 668-3245</a></p>
                <p className="text-xs text-gray-500">Mon-Fri: 9AM-6PM EST</p>
              </div>
              <div className="text-center">
                <div className="bg-green-100 p-3 rounded-full w-fit mx-auto mb-3">
                  <Mail className="h-6 w-6 text-green-600" />
                </div>
                <h4 className="font-semibold mb-2">Email Support</h4>
                <p className="text-sm text-gray-600 mb-2"><a href="mailto:cs@tcglore.com" className="text-gray-600">cs@tcglore.com</a></p>
                <p className="text-xs text-gray-500">Response within 24 hours</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Footer />
    </div>
  )
}



