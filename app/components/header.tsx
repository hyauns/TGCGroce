"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import {
  Search,
  ShoppingCart,
  Heart,
  User,
  Menu,
  LogIn,
  UserPlus,
  Settings,
  LogOut,
  Package,
  X,
  Phone,
  Mail,
  Truck,
} from "lucide-react"
import { useCart } from "@/lib/cart-context"
import { useWishlist } from "@/lib/wishlist-context"
import { useAuth } from "@/lib/auth-context"
import { saveSearchQuery, getRecentSearches, getLiveSuggestions } from "@/lib/search"

const categories = [
  "Magic: The Gathering",
  "Pokemon",
  "Yu-Gi-Oh!",
  "Disney Lorcana",
  "One Piece Card Game",
  "Digimon Card Game",
  "Star Wars: Unlimited",
  "Flesh and Blood",
]

export function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [recentSearches, setRecentSearches] = useState<string[]>([])
  const router = useRouter()

  const { getCartCount, recentlyAddedItem } = useCart()
  const { getWishlistCount } = useWishlist()
  const { user, isAuthenticated, logout } = useAuth()
  const [cartBounce, setCartBounce] = useState(false)

  const cartCount = getCartCount()
  const wishlistCount = getWishlistCount()

  const searchParamsHook = useSearchParams()

  useEffect(() => {
    setRecentSearches(getRecentSearches())
    // Pre-populate input from URL on mount (e.g. landing on /products?search=pokemon)
    const urlSearch = searchParamsHook.get("search") ?? searchParamsHook.get("q") ?? ""
    if (urlSearch) setSearchQuery(urlSearch)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (searchQuery.trim().length <= 1) {
      setSuggestions([])
      setShowSuggestions(false)
      return
    }
    // 300ms debounce — prevents a DB call on every keystroke
    const timer = setTimeout(() => {
      getLiveSuggestions(searchQuery, 5).then((newSuggestions) => {
        setSuggestions(newSuggestions)
        setShowSuggestions(newSuggestions.length > 0)
      })
    }, 300)
    return () => clearTimeout(timer)
  }, [searchQuery])

  const handleSearch = (query: string) => {
    if (!query.trim()) return

    saveSearchQuery(query)
    setRecentSearches(getRecentSearches())
    setSearchQuery("")
    setShowSuggestions(false)
    router.push(`/products?search=${encodeURIComponent(query)}`)
  }

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    handleSearch(searchQuery)
  }

  const handleSuggestionClick = (suggestion: string) => {
    handleSearch(suggestion)
  }

  useEffect(() => {
    if (recentlyAddedItem) {
      setCartBounce(true)
      const timer = setTimeout(() => {
        setCartBounce(false)
      }, 600)
      return () => clearTimeout(timer)
    }
  }, [recentlyAddedItem])

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false)
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      {/* Top Bar */}
      <div className="bg-blue-600 text-white text-sm py-2">
        <div className="container mx-auto px-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <span>Free shipping on orders over $75</span>
            <span className="hidden md:inline">•</span>
            <span className="hidden md:inline">Authentic products guaranteed</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="hidden sm:inline">Need help? Call +1 (303) 668-3245</span>
          </div>
        </div>
      </div>

      {/* Main Header */}
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <div className="bg-blue-600 text-white p-2 rounded-lg">
              <Package className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold">TGC Lore Inc.</h1>
              <p className="text-xs text-gray-600 hidden sm:block">Trading Card Games</p>
            </div>
          </Link>

          {/* Search Bar - Desktop */}
          <div className="hidden md:flex flex-1 max-w-md mx-8 relative">
            <form onSubmit={handleSearchSubmit} className="relative w-full">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search for cards, sets, or products..."
                className="pl-10 pr-4"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => {
                  if (searchQuery.trim().length > 1) {
                    setShowSuggestions(true)
                  }
                }}
                onBlur={() => {
                  setTimeout(() => setShowSuggestions(false), 200)
                }}
              />

              {showSuggestions && (suggestions.length > 0 || recentSearches.length > 0) && (
                <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-md shadow-lg mt-1 z-50">
                  {suggestions.length > 0 && (
                    <div className="p-2">
                      <div className="text-xs font-medium text-gray-500 mb-2">Suggestions</div>
                      {suggestions.map((suggestion, index) => (
                        <button
                          key={index}
                          className="w-full text-left px-3 py-2 hover:bg-gray-100 rounded text-sm"
                          onClick={() => handleSuggestionClick(suggestion)}
                        >
                          <Search className="inline h-3 w-3 mr-2 text-gray-400" />
                          {suggestion}
                        </button>
                      ))}
                    </div>
                  )}

                  {recentSearches.length > 0 && searchQuery.trim().length <= 1 && (
                    <div className="p-2 border-t">
                      <div className="text-xs font-medium text-gray-500 mb-2">Recent Searches</div>
                      {recentSearches.map((search, index) => (
                        <button
                          key={index}
                          className="w-full text-left px-3 py-2 hover:bg-gray-100 rounded text-sm"
                          onClick={() => handleSuggestionClick(search)}
                        >
                          <Search className="inline h-3 w-3 mr-2 text-gray-400" />
                          {search}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </form>
          </div>

          {/* Actions */}
          <div className="flex items-center space-x-2">
            {/* Wishlist */}
            <Link href="/wishlist">
              <Button variant="ghost" size="icon" className="relative">
                <Heart className="h-5 w-5" />
                {wishlistCount > 0 && (
                  <Badge className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs">
                    {wishlistCount}
                  </Badge>
                )}
                <span className="sr-only">Wishlist ({wishlistCount})</span>
              </Button>
            </Link>

            {/* Cart with Animation */}
            <Link href="/cart">
              <Button
                variant="ghost"
                size="icon"
                className={`relative transition-all duration-300 ${
                  cartBounce ? "animate-bounce scale-110" : ""
                } ${recentlyAddedItem ? "bg-green-50 hover:bg-green-100" : ""}`}
              >
                <ShoppingCart
                  className={`h-5 w-5 transition-colors duration-300 ${recentlyAddedItem ? "text-green-600" : ""}`}
                />
                {cartCount > 0 && (
                  <Badge
                    className={`absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs transition-all duration-300 ${
                      recentlyAddedItem ? "bg-green-500 scale-125" : ""
                    }`}
                  >
                    {cartCount}
                  </Badge>
                )}
                <span className="sr-only">Cart ({cartCount})</span>

                {recentlyAddedItem && (
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full animate-ping"></div>
                )}
              </Button>
            </Link>

            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <User className="h-5 w-5" />
                  <span className="sr-only">User menu</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                {isAuthenticated ? (
                  <>
                    <div className="px-2 py-1.5">
                      <p className="text-sm font-medium">{user?.first_name} {user?.last_name}</p>
                      <p className="text-xs text-gray-500">{user?.email}</p>
                    </div>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href="/account">
                        <Settings className="mr-2 h-4 w-4" />
                        Account Settings
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/account?tab=orders">
                        <Package className="mr-2 h-4 w-4" />
                        Order History
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={logout}>
                      <LogOut className="mr-2 h-4 w-4" />
                      Sign Out
                    </DropdownMenuItem>
                  </>
                ) : (
                  <>
                    <DropdownMenuItem asChild>
                      <Link href="/auth/login">
                        <LogIn className="mr-2 h-4 w-4" />
                        Sign In
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/auth/register">
                        <UserPlus className="mr-2 h-4 w-4" />
                        Create Account
                      </Link>
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Enhanced Mobile Menu */}
            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-80 p-0">
                <div className="flex flex-col h-full">
                  {/* Header */}
                  <SheetHeader className="p-6 pb-4 border-b bg-gradient-to-r from-blue-600 to-blue-700 text-white">
                    <div className="flex items-center justify-between">
                      <SheetTitle className="text-white text-lg font-bold">Menu</SheetTitle>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={closeMobileMenu}
                        className="text-white hover:bg-white/20"
                      >
                        <X className="h-5 w-5" />
                      </Button>
                    </div>
                  </SheetHeader>

                  {/* Content */}
                  <div className="flex-1 overflow-y-auto">
                    {/* Authentication Section */}
                    <div className="p-6 border-b bg-gray-50">
                      {isAuthenticated ? (
                        <div className="space-y-4">
                          <div className="flex items-center gap-3">
                            <div className="h-12 w-12 rounded-full bg-blue-600 flex items-center justify-center">
                              <User className="h-6 w-6 text-white" />
                            </div>
                            <div>
                              <p className="font-semibold text-gray-900">{user?.first_name} {user?.last_name}</p>
                              <p className="text-sm text-gray-600">{user?.email}</p>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <Link href="/account" onClick={closeMobileMenu}>
                              <Button variant="outline" size="sm" className="w-full bg-transparent">
                                <Settings className="h-4 w-4 mr-2" />
                                Account
                              </Button>
                            </Link>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                logout()
                                closeMobileMenu()
                              }}
                            >
                              <LogOut className="h-4 w-4 mr-2" />
                              Sign Out
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <p className="text-gray-700 font-medium mb-3">Welcome to TGC Lore Inc.</p>
                          <div className="space-y-2">
                            <Link href="/auth/login" onClick={closeMobileMenu}>
                              <Button className="w-full bg-blue-600 hover:bg-blue-700">
                                <LogIn className="h-4 w-4 mr-2" />
                                Sign In
                              </Button>
                            </Link>
                            <Link href="/auth/register" onClick={closeMobileMenu}>
                              <Button variant="outline" className="w-full bg-transparent">
                                <UserPlus className="h-4 w-4 mr-2" />
                                Create Account
                              </Button>
                            </Link>
                          </div>

                        </div>
                      )}
                    </div>

                    {/* Quick Actions */}
                    <div className="p-6 border-b">
                      <h3 className="font-semibold text-gray-900 mb-4">Quick Actions</h3>
                      <div className="grid grid-cols-2 gap-3">
                        <Link href="/cart" onClick={closeMobileMenu}>
                          <Button variant="outline" size="sm" className="w-full relative bg-transparent">
                            <ShoppingCart className="h-4 w-4 mr-2" />
                            Cart
                            {cartCount > 0 && (
                              <Badge className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs">
                                {cartCount}
                              </Badge>
                            )}
                          </Button>
                        </Link>
                        <Link href="/wishlist" onClick={closeMobileMenu}>
                          <Button variant="outline" size="sm" className="w-full relative bg-transparent">
                            <Heart className="h-4 w-4 mr-2" />
                            Wishlist
                            {wishlistCount > 0 && (
                              <Badge className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs">
                                {wishlistCount}
                              </Badge>
                            )}
                          </Button>
                        </Link>
                      </div>
                    </div>

                    {/* Categories */}
                    <div className="p-6">
                      <h3 className="font-semibold text-gray-900 mb-4">Shop Categories</h3>
                      <div className="space-y-2">
                        <Link
                          href="/products"
                          onClick={closeMobileMenu}
                          className="block py-3 px-4 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors font-medium"
                        >
                          All Products
                        </Link>
                        {categories.map((category) => (
                          <Link
                            key={category}
                            href={`/products?category=${encodeURIComponent(category)}`}
                            onClick={closeMobileMenu}
                            className="block py-3 px-4 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                          >
                            {category}
                          </Link>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="p-6 border-t bg-gray-50">
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Phone className="h-4 w-4" />
                        <a href="tel:+13036683245" className="text-sm text-gray-600">+1 (303) 668-3245</a>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Mail className="h-4 w-4" />
                        <a href="mailto:cs@tcglore.com" className="text-sm text-gray-600">cs@tcglore.com</a>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Truck className="h-4 w-4" />
                        <span>Free shipping on orders $75+</span>
                      </div>
                    </div>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>

        {/* Mobile Search - Always visible on mobile */}
        <div className="md:hidden border-t bg-gray-50">
          <div className="container mx-auto px-4 py-3">
            <form onSubmit={handleSearchSubmit} className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search for cards, sets, or products..."
                className="pl-10 pr-4"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </form>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="hidden md:block border-t bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="flex items-center space-x-8 py-3">
            <Link href="/products" className="text-sm font-medium hover:text-blue-600 transition-colors">
              All Products
            </Link>
            {categories.slice(0, 6).map((category) => (
              <Link
                key={category}
                href={`/products?category=${encodeURIComponent(category)}`}
                className="text-sm hover:text-blue-600 transition-colors whitespace-nowrap"
              >
                {category}
              </Link>
            ))}
            <DropdownMenu>
              <DropdownMenuTrigger className="text-sm hover:text-blue-600 transition-colors">More</DropdownMenuTrigger>
              <DropdownMenuContent>
                {categories.slice(6).map((category) => (
                  <DropdownMenuItem key={category} asChild>
                    <Link href={`/products?category=${encodeURIComponent(category)}`}>{category}</Link>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </nav>
    </header>
  )
}
