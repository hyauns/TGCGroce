"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Sparkles, Clock } from "lucide-react"
import { ImageWithFallback } from "@/components/ui/image-with-fallback"

interface HeroProps {
  heroTitle: string
  heroSubtitle: string
  heroImageUrl: string | null
}

export function Hero({ heroTitle, heroSubtitle, heroImageUrl }: HeroProps) {
  const imageSource = heroImageUrl || "/placeholder.png"

  return (
    <section className="relative bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 text-white py-20 lg:py-32 overflow-hidden">
      <div className="absolute inset-0 bg-black/20"></div>
      <div className="container mx-auto px-4 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-8 items-center min-h-[50vh]">
          
          {/* Left Column (Content) */}
          <div className="text-center lg:text-left flex flex-col justify-center">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 text-white leading-tight">
              {heroTitle}
            </h1>
            <p className="text-base sm:text-lg mb-8 text-blue-100 leading-relaxed max-w-2xl mx-auto lg:mx-0">
              {heroSubtitle}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <Link href="/products">
                <Button size="lg" className="bg-white text-blue-900 hover:bg-blue-50 text-lg px-8 py-4 h-auto hover:-translate-y-1 hover:shadow-xl transition-all duration-300 w-full sm:w-auto font-semibold">
                  <Sparkles className="mr-2 h-5 w-5" />
                  Shop Now
                </Button>
              </Link>
              <Link href="/products?isPreOrder=true">
                <Button
                  variant="outline"
                  size="lg"
                  className="border-2 border-white text-white hover:bg-white hover:text-blue-900 text-lg px-8 py-4 h-auto bg-transparent hover:-translate-y-1 hover:shadow-xl transition-all duration-300 w-full sm:w-auto font-semibold"
                >
                  <Clock className="mr-2 h-5 w-5" />
                  View Pre-orders
                </Button>
              </Link>
            </div>
          </div>

          {/* Right Column (Visual) */}
          <div className="relative flex justify-center items-center h-full mt-8 lg:mt-0">
            {/* Subtle glowing orb */}
            <div className="absolute inset-0 bg-purple-500/20 blur-[100px] rounded-full scale-110 -z-10 animate-pulse"></div>
            
            {/* Product Image */}
            <div className="relative w-full max-w-sm sm:max-w-md mx-auto aspect-square">
              <ImageWithFallback
                src={imageSource}
                fallbackSrc="/placeholder.png"
                alt={heroTitle}
                width={800}
                height={800}
                className="w-full h-full object-contain hover:scale-105 transition-transform duration-500 drop-shadow-[0_20px_50px_rgba(168,85,247,0.5)] z-20 relative"
              />
            </div>
          </div>

        </div>
      </div>
      <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-background to-transparent z-10 pointer-events-none"></div>
    </section>
  )
}
