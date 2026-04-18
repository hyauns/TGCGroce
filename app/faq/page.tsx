"use client"

import type React from "react"

import { useState } from "react"
import { Search, ChevronDown, ChevronUp, Package, RefreshCw, CreditCard, User, HelpCircle, Star } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Header } from "@/app/components/header"
import { Footer } from "@/app/components/footer"

interface FAQ {
  question: string
  answer: string
}

interface FAQCategory {
  title: string
  icon: React.ReactNode
  faqs: FAQ[]
}

const faqData: FAQCategory[] = [
  {
    title: "Orders & Shipping",
    icon: <Package className="w-5 h-5" />,
    faqs: [
      {
        question: "How long does shipping take?",
        answer:
          "Standard shipping typically takes 3-7 business days within the continental US. Express shipping (1-3 business days) and overnight shipping options are also available. International shipping times vary by destination, usually 7-21 business days.",
      },
      {
        question: "Do you offer free shipping?",
        answer:
          "Yes! We offer free standard shipping on orders over $75 within the US. For orders under $75, standard shipping is $4.99. Free shipping promotions may also be available during special events.",
      },
      {
        question: "Can I track my order?",
        answer:
          "Once your order ships, you'll receive a tracking number via email. You can also track your order by logging into your account and visiting the 'My Orders' section.",
      },
      {
        question: "What if my order arrives damaged?",
        answer:
          "We're sorry if your order arrives damaged! Please contact us within 48 hours of delivery with photos of the damaged items. We'll arrange for a replacement or full refund at no cost to you.",
      },
      {
        question: "Can I change or cancel my order?",
        answer:
          "Orders can be modified or cancelled within 1 hour of placement. After that, orders enter our fulfillment process and cannot be changed. Please contact customer service immediately if you need to make changes.",
      },
    ],
  },
  {
    title: "Returns & Exchanges",
    icon: <RefreshCw className="w-5 h-5" />,
    faqs: [
      {
        question: "What is your return policy?",
        answer:
          "We accept returns within 30 days of delivery for unopened products in original condition. Trading cards and sealed products must remain unopened. Custom or personalized items cannot be returned unless defective.",
      },
      {
        question: "How do I return an item?",
        answer:
          "Log into your account, go to 'My Orders,' and select 'Return Item' next to the product you wish to return. Print the prepaid return label and drop off at any authorized shipping location. Refunds are processed within 5-7 business days after we receive your return.",
      },
      {
        question: "Do you offer exchanges?",
        answer:
          "Yes! If you need a different size, color, or version of a product, you can exchange it within 30 days. The exchange process is similar to returns - just select 'Exchange' instead of 'Return' in your account.",
      },
      {
        question: "Who pays for return shipping?",
        answer:
          "We provide free return shipping labels for defective items or our errors. For other returns, a $4.99 return shipping fee will be deducted from your refund. Exchanges over $50 include free return shipping.",
      },
      {
        question: "Can I return opened card packs?",
        answer:
          "Unfortunately, opened trading card packs, booster boxes, or individual cards cannot be returned due to the nature of collectible products. We only accept returns for unopened, sealed products in original condition.",
      },
    ],
  },
  {
    title: "Product Information",
    icon: <Star className="w-5 h-5" />,
    faqs: [
      {
        question: "Are your products authentic?",
        answer:
          "Yes! All our products are 100% authentic and sourced directly from official distributors like Wizards of the Coast, The Pokémon Company, and other authorized suppliers. We guarantee authenticity on all items.",
      },
      {
        question: "Do you sell individual cards?",
        answer:
          "Currently, we focus on sealed products like booster packs, boxes, and bundles. We're working on expanding to individual card sales in the future. Follow us on social media for updates!",
      },
      {
        question: "What condition are your products in?",
        answer:
          "All our sealed products are in mint/near-mint condition and stored in climate-controlled environments. Any condition issues are clearly noted in product descriptions with detailed photos.",
      },
      {
        question: "Do you offer pre-orders?",
        answer:
          "Yes! We offer pre-orders for upcoming releases. Pre-order items are charged when you place the order and ship on or shortly after the official release date. You'll receive email updates about any delays.",
      },
      {
        question: "Can I get a specific card from a pack?",
        answer:
          "Trading card packs contain randomized cards, so we cannot guarantee specific cards. Each pack's contents are determined by the manufacturer's randomization process, which is part of the excitement of collecting!",
      },
    ],
  },
  {
    title: "Account Management",
    icon: <User className="w-5 h-5" />,
    faqs: [
      {
        question: "How do I create an account?",
        answer:
          "Click 'Sign Up' in the top right corner of any page. You'll need to provide your email address, create a password, and verify your email. Having an account allows you to track orders, save favorites, and checkout faster.",
      },
      {
        question: "I forgot my password. How do I reset it?",
        answer:
          "Click 'Sign In' then 'Forgot Password' on the login page. Enter your email address and we'll send you a secure link to reset your password. The link expires after 24 hours for security.",
      },
      {
        question: "How do I update my account information?",
        answer:
          "Log into your account and click 'Account Settings' or 'Profile.' You can update your name, email, password, shipping addresses, and communication preferences from there.",
      },
      {
        question: "Can I save items for later?",
        answer:
          "Yes! Click the heart icon on any product to add it to your wishlist. You can view and manage your wishlist by clicking the heart icon in the top navigation or visiting your account page.",
      },
      {
        question: "How do I delete my account?",
        answer:
          "We're sorry to see you go! Please contact our customer service team to request account deletion. We'll remove your personal information within 30 days, though we may retain order history for legal and business purposes.",
      },
    ],
  },
  {
    title: "Payment & Security",
    icon: <CreditCard className="w-5 h-5" />,
    faqs: [
      {
        question: "What payment methods do you accept?",
        answer:
          "We accept Credit Card payments. All payments are processed securely through encrypted connections.",
      },
      {
        question: "Is my payment information secure?",
        answer:
          "We use industry-standard SSL encryption and are PCI DSS compliant. We never store your complete credit card information on our servers - all payment processing is handled by secure, certified payment processors.",
      },
      {
        question: "When will I be charged?",
        answer:
          "For in-stock items, you're charged immediately when you place your order. For pre-orders, you're charged when the order is placed, not when it ships. If there are any issues, we'll contact you before processing payment.",
      },
      {
        question: "Can I use multiple payment methods?",
        answer:
          "Currently, each order must be paid with a single payment method. However, you can use gift cards or store credit in combination with another payment method to complete your purchase.",
      },
      {
        question: "Do you offer payment plans?",
        answer:
          "For orders over $200, we partner with Klarna and Afterpay to offer buy-now-pay-later options. These services allow you to split your purchase into smaller, interest-free payments over time.",
      },
    ],
  },
  {
    title: "General Questions",
    icon: <HelpCircle className="w-5 h-5" />,
    faqs: [
      {
        question: "How can I contact customer service?",
        answer:
          "You can reach us through our Contact page, email us at cs@tcglore.com, or call us at +1 (303) 668-3245 Monday-Friday 9 AM to 6 PM EST. We typically respond to emails within 24 hours.",
      },
      {
        question: "Do you have a physical store?",
        answer:
          "We're currently an online-only retailer, which allows us to offer competitive prices and a wide selection. However, we do attend major gaming conventions and tournaments - follow our social media for event announcements!",
      },
      {
        question: "Do you offer bulk discounts?",
        answer:
          "Yes! We offer volume discounts for orders over $500. Contact our sales team at cs@tcglore.com for custom pricing on large orders. We also have special pricing for game stores and tournament organizers.",
      },
      {
        question: "Can I cancel my subscription?",
        answer:
          "If you have any subscription services with us, you can cancel anytime by logging into your account and managing your subscriptions, or by contacting customer service. Cancellations take effect at the end of your current billing period.",
      },
      {
        question: "Do you ship internationally?",
        answer:
          "Yes, we ship to most countries worldwide! International shipping costs and delivery times vary by destination. Please note that customers are responsible for any customs duties, taxes, or fees imposed by their country.",
      },
    ],
  },
]

export default function FAQPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [expandedItems, setExpandedItems] = useState<string[]>([])

  const toggleExpanded = (categoryIndex: number, faqIndex: number) => {
    const key = `${categoryIndex}-${faqIndex}`
    setExpandedItems((prev) => (prev.includes(key) ? prev.filter((item) => item !== key) : [...prev, key]))
  }

  const filteredData = faqData
    .map((category) => ({
      ...category,
      faqs: category.faqs.filter(
        (faq) =>
          faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
          faq.answer.toLowerCase().includes(searchTerm.toLowerCase()),
      ),
    }))
    .filter((category) => category.faqs.length > 0)

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main>
        {/* Header Section */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-16">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Frequently Asked Questions</h1>
            <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
              Find answers to common questions about orders, shipping, returns, and more
            </p>

            {/* Search Bar */}
            <div className="max-w-md mx-auto relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                type="text"
                placeholder="Search FAQs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 py-3 text-gray-900 bg-white border-0 shadow-lg"
              />
            </div>
          </div>
        </div>

        {/* FAQ Content */}
        <div className="container mx-auto px-4 py-12">
          {searchTerm && (
            <div className="mb-8">
              <p className="text-gray-600">
                {filteredData.reduce((total, category) => total + category.faqs.length, 0)} results found for "
                {searchTerm}"
              </p>
            </div>
          )}

          <div className="grid gap-8">
            {filteredData.map((category, categoryIndex) => (
              <Card key={categoryIndex} className="shadow-lg">
                <CardContent className="p-0">
                  {/* Category Header */}
                  <div className="bg-gradient-to-r from-gray-50 to-gray-100 p-6 border-b">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-100 rounded-lg text-blue-600">{category.icon}</div>
                      <h2 className="text-2xl font-bold text-gray-900">{category.title}</h2>
                      <span className="ml-auto bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                        {category.faqs.length} questions
                      </span>
                    </div>
                  </div>

                  {/* FAQ Items */}
                  <div className="divide-y divide-gray-200">
                    {category.faqs.map((faq, faqIndex) => {
                      const key = `${categoryIndex}-${faqIndex}`
                      const isExpanded = expandedItems.includes(key)

                      return (
                        <div key={faqIndex} className="p-6">
                          <button
                            onClick={() => toggleExpanded(categoryIndex, faqIndex)}
                            className="w-full text-left flex items-center justify-between gap-4 group"
                          >
                            <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                              {faq.question}
                            </h3>
                            <div className="flex-shrink-0">
                              {isExpanded ? (
                                <ChevronUp className="w-5 h-5 text-gray-500 group-hover:text-blue-600 transition-colors" />
                              ) : (
                                <ChevronDown className="w-5 h-5 text-gray-500 group-hover:text-blue-600 transition-colors" />
                              )}
                            </div>
                          </button>

                          {isExpanded && (
                            <div className="mt-4 text-gray-700 leading-relaxed animate-in slide-in-from-top-2 duration-200">
                              {faq.answer}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredData.length === 0 && searchTerm && (
            <div className="text-center py-12">
              <HelpCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No results found</h3>
              <p className="text-gray-600 mb-6">
                We couldn't find any FAQs matching your search. Try different keywords or browse our categories above.
              </p>
              <button
                onClick={() => setSearchTerm("")}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Clear Search
              </button>
            </div>
          )}

          {/* Contact Section */}
          <Card className="mt-12 bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
            <CardContent className="p-8 text-center">
              <div className="flex items-center justify-center gap-3 mb-4">
                <div className="p-3 bg-blue-100 rounded-full">
                  <HelpCircle className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900">Still need help?</h3>
              </div>
              <p className="text-gray-700 mb-6 max-w-2xl mx-auto">
                Can't find the answer you're looking for? Our customer service team is here to help you with any
                questions or concerns.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <a
                  href="/contact"
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  Contact Support
                </a>
                <a
                  href="mailto:cs@tcglore.com"
                  className="bg-white text-blue-600 px-6 py-3 rounded-lg border-2 border-blue-600 hover:bg-blue-50 transition-colors font-medium"
                >
                  Email Us
                </a>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  )
}
