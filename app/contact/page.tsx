import type { Metadata } from "next"
import { Header } from "@/app/components/header"
import { Footer } from "@/app/components/footer"
import ContactFormContent from "./contact-form"

export const metadata: Metadata = {
  title: "Contact TCG Lore | Trading Card Store Support",
  description: "Contact our customer support team for inquiries about your trading card orders, shipping, returns, or general questions.",
}

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <ContactFormContent />
      <Footer />
    </div>
  )
}
