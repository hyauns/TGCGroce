"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Mail,
  Phone,
  MapPin,
  Clock,
  Send,
  MessageSquare,
  HelpCircle,
  Package,
  RefreshCw,
  CreditCard,
  Truck,
  Shield,
  CheckCircle,
} from "lucide-react"
import { Header } from "../components/header"
import { Footer } from "../components/footer"
import { useToast } from "@/hooks/use-toast"

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitSuccess, setSubmitSuccess] = useState(false)
  const [recaptchaVerified, setRecaptchaVerified] = useState(false)
  const { toast } = useToast()

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!recaptchaVerified) {
      toast({ title: "Verification Required", description: "Please complete the security verification.", variant: "destructive" })
      return
    }

    setIsSubmitting(true)

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || "Failed to send message")
      }

      setSubmitSuccess(true)
    } catch (error: any) {
      console.error("Contact form error:", error)
      toast({
        title: "Unable to Send Message",
        description: error.message || "Something went wrong. Please try again or email us directly at cs@tcglore.com.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const isFormValid = formData.name && formData.email && formData.subject && formData.message && recaptchaVerified

  const faqs = [
    {
      category: "Order Tracking",
      icon: Package,
      questions: [
        {
          q: "How can I track my order?",
          a: "You can track your order by visiting our Order Tracking page and entering your order number and email address. you&apos;ll also receive tracking information via email once your order ships.",
        },
        {
          q: "When will my order ship?",
          a: "Most orders placed before 1 PM PST are processed the same day. Standard shipping takes 5-7 business days, Express takes 2-3 business days, and Overnight takes 1 business day.",
        },
        {
          q: "My tracking shows 'Label Created' - what does this mean?",
          a: "This means your shipping label has been generated and your package is being prepared for pickup by our carrier. It should be in transit within 24 hours.",
        },
      ],
    },
    {
      category: "Returns & Exchanges",
      icon: RefreshCw,
      questions: [
        {
          q: "What is your return policy?",
          a: "We accept returns within 30 days of delivery for unopened products in original condition. Trading card products must remain sealed to be eligible for return.",
        },
        {
          q: "How do I initiate a return?",
          a: "Visit our Returns page to start the return process. you&apos;ll receive a prepaid return label and instructions on how to package your items.",
        },
        {
          q: "Can I exchange an item for a different product?",
          a: "Yes, exchanges are available for items of equal or lesser value. Price differences for higher-value items must be paid separately.",
        },
      ],
    },
    {
      category: "Product Availability",
      icon: Package,
      questions: [
        {
          q: "When will out-of-stock items be restocked?",
          a: "Restock dates vary by product. You can sign up for restock notifications on product pages, and we&apos;ll email you when items become available.",
        },
        {
          q: "Do you offer pre-orders for upcoming releases?",
          a: "Yes, we offer pre-orders for most major TCG releases. Pre-orders are charged at the time of purchase and ship when the product is released.",
        },
        {
          q: "Are your cards authentic?",
          a: "All our products are sourced directly from official distributors and manufacturers. We guarantee 100% authenticity on all trading card products.",
        },
      ],
    },
    {
      category: "Payment & Billing",
      icon: CreditCard,
      questions: [
        {
          q: "What payment methods do you accept?",
          a: "We accept Credit Card payments.",
        },
        {
          q: "When will my card be charged?",
          a: "Your card is charged immediately upon order placement. For pre-orders, payment is processed at the time of order, not at shipping.",
        },
        {
          q: "Is my payment information secure?",
          a: "Yes, we use industry-standard SSL encryption and comply with PCI DSS standards to protect your payment information.",
        },
      ],
    },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-16">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Contact Us</h1>
            <p className="text-xl text-blue-100 max-w-2xl mx-auto">
              We&apos;re here to help! Get in touch with our customer service team for any questions about your orders,
              products, or account.
            </p>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Contact Form */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  Send us a Message
                </CardTitle>
                <CardDescription>
                  Fill out the form below and we&apos;ll get back to you within 24 hours during business days.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {submitSuccess ? (
                  <div className="flex flex-col items-center justify-center text-center py-12 px-4">
                    <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-6">
                      <CheckCircle className="h-8 w-8 text-green-600" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-3">Thank you for reaching out!</h3>
                    <p className="text-gray-600 max-w-md leading-relaxed">
                      Your message has been successfully sent. We have received your inquiry and our team will review it.
                      You can expect a reply to your email within 24 business hours.
                    </p>
                    <Button
                      variant="outline"
                      className="mt-8"
                      onClick={() => {
                        setSubmitSuccess(false)
                        setFormData({ name: "", email: "", subject: "", message: "" })
                        setRecaptchaVerified(false)
                      }}
                    >
                      <Send className="mr-2 h-4 w-4" />
                      Send Another Message
                    </Button>
                  </div>
                ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Full Name *</Label>
                      <Input
                        id="name"
                        name="name"
                        type="text"
                        value={formData.name}
                        onChange={handleInputChange}
                        required
                        placeholder="Enter your full name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email Address *</Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        required
                        placeholder="Enter your email address"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="subject">Subject *</Label>
                    <Input
                      id="subject"
                      name="subject"
                      type="text"
                      value={formData.subject}
                      onChange={handleInputChange}
                      required
                      placeholder="What is your inquiry about?"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="message">Message *</Label>
                    <Textarea
                      id="message"
                      name="message"
                      value={formData.message}
                      onChange={handleInputChange}
                      required
                      placeholder="Please provide details about your inquiry..."
                      rows={6}
                    />
                  </div>

                  {/* reCAPTCHA Simulation */}
                  <div className="space-y-2">
                    <Label>Security Verification *</Label>
                    <div className="border border-gray-300 rounded-lg p-4 bg-gray-50">
                      <div className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          id="recaptcha"
                          checked={recaptchaVerified}
                          onChange={(e) => setRecaptchaVerified(e.target.checked)}
                          className="w-4 h-4"
                        />
                        <label htmlFor="recaptcha" className="text-sm">
                          I&apos;m not a robot
                        </label>
                        <Shield className="h-4 w-4 text-gray-500" />
                      </div>
                      <p className="text-xs text-gray-500 mt-2">
                        This site is protected by reCAPTCHA and the Google Privacy Policy and Terms of Service apply.
                      </p>
                    </div>
                  </div>

                  <Button type="submit" className="w-full" disabled={!isFormValid || isSubmitting}>
                    {isSubmitting ? (
                      <>
                        <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                        Sending Message...
                      </>
                    ) : (
                      <>
                        <Send className="mr-2 h-4 w-4" />
                        Send Message
                      </>
                    )}
                  </Button>
                </form>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Contact Information */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Get in Touch</CardTitle>
                <CardDescription>Multiple ways to reach our customer service team</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-start space-x-3">
                  <Mail className="h-5 w-5 text-blue-600 mt-1" />
                  <div>
                    <h4 className="font-semibold">Email Support</h4>
                    <p className="text-sm text-gray-600"><a href="mailto:cs@tcglore.com">cs@tcglore.com</a></p>
                    <p className="text-xs text-gray-500">Response within 24 hours</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <Phone className="h-5 w-5 text-blue-600 mt-1" />
                  <div>
                    <h4 className="font-semibold">Phone Support</h4>
                    <p className="text-sm text-gray-600"><a href="tel:+13036683245">+1 (303) 668-3245</a></p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <MapPin className="h-5 w-5 text-blue-600 mt-1" />
                  <div>
                    <h4 className="font-semibold">Mailing Address</h4>
                    <p className="text-sm text-gray-600">
                      TOY HAULERZ LLC Customer Service
                      <br />
                      1757 NORTH CENTRAL AVENUE
                      <br />
                      FLAGLER BEACH, FL 32136, United States
                    </p>
                  </div>
                </div>

                <Separator />

                <div className="flex items-start space-x-3">
                  <Clock className="h-5 w-5 text-blue-600 mt-1" />
                  <div>
                    <h4 className="font-semibold">Business Hours</h4>
                    <div className="text-sm text-gray-600 space-y-1">
                      <p>Monday - Friday: 8:00 AM - 8:00 PM PST</p>
                      <p>Saturday: 9:00 AM - 6:00 PM PST</p>
                      <p>Sunday: 10:00 AM - 4:00 PM PST</p>
                    </div>
                    <Badge variant="secondary" className="mt-2">
                      Extended holiday hours during peak seasons
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button variant="outline" className="w-full justify-start bg-transparent">
                  <Package className="mr-2 h-4 w-4" />
                  Track Your Order
                </Button>
                <Button variant="outline" className="w-full justify-start bg-transparent">
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Start a Return
                </Button>
                <Button variant="outline" className="w-full justify-start bg-transparent">
                  <Truck className="mr-2 h-4 w-4" />
                  Shipping Information
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mt-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Frequently Asked Questions</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Find quick answers to common questions. can&apos;t find what you&apos;re looking for? Use the contact form above.
            </p>
          </div>

          <Tabs defaultValue="Order Tracking" className="w-full">
            <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4">
              {faqs.map((category) => (
                <TabsTrigger key={category.category} value={category.category} className="text-xs lg:text-sm">
                  <category.icon className="h-4 w-4 mr-1" />
                  {category.category}
                </TabsTrigger>
              ))}
            </TabsList>

            {faqs.map((category) => (
              <TabsContent key={category.category} value={category.category} className="mt-6">
                <div className="grid gap-4">
                  {category.questions.map((faq, index) => (
                    <Card key={index}>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-lg flex items-start gap-2">
                          <HelpCircle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                          {faq.q}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <p className="text-gray-600 leading-relaxed">{faq.a}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </div>

        {/* Additional Help Section */}
        <div className="mt-16 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-8 text-center">
          <h3 className="text-2xl font-bold mb-4">Still Need Help?</h3>
          <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
            Our customer service team is standing by to assist you with any questions or concerns. We&apos;re committed to
            providing exceptional support for all your TCG needs.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg">
              <Phone className="mr-2 h-4 w-4" />
              Call Us Now
            </Button>
            <Button variant="outline" size="lg">
              <Mail className="mr-2 h-4 w-4" />
              Email Support
            </Button>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  )
}

