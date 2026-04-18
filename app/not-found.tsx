/* eslint-disable react/no-unescaped-entities */
"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { FileQuestion, Home, Search } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function NotFound() {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState("")

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/products?search=${encodeURIComponent(searchQuery.trim())}`)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full p-8 text-center bg-white shadow-sm border border-gray-100 rounded-2xl">
        <div className="mx-auto w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center mb-6">
          <FileQuestion className="w-8 h-8 text-blue-600" />
        </div>

        <h2 className="text-3xl font-extrabold text-gray-900 mb-2">
          Page Not Found
        </h2>

        <p className="text-gray-600 mb-8">
          Sorry, we couldn't find the page you were looking for. The link might be broken, or the page may have been removed.
        </p>

        <form onSubmit={handleSearch} className="mb-8 relative">
          <div className="relative flex items-center w-full h-12 rounded-lg border border-gray-200 bg-gray-50 overflow-hidden focus-within:ring-2 focus-within:border-blue-500 focus-within:ring-blue-200 transition-all">
            <div className="grid place-items-center h-full w-12 text-gray-400">
              <Search className="h-5 w-5" />
            </div>
            <input
              type="text"
              className="peer h-full w-full outline-none text-sm text-gray-700 bg-transparent pr-2"
              placeholder="Search for products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <button
              type="submit"
              className="px-4 h-full bg-blue-600 text-white font-medium text-sm hover:bg-blue-700 transition-colors"
            >
              Search
            </button>
          </div>
        </form>

        <div className="flex flex-col gap-3 justify-center">
          <Link href="/">
            <Button className="w-full flex items-center justify-center gap-2" size="lg">
              <Home className="w-4 h-4" />
              Back to Homepage
            </Button>
          </Link>
          
          <Link href="/products">
            <Button variant="outline" className="w-full flex items-center justify-center gap-2" size="lg">
              Browse All Products
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}


