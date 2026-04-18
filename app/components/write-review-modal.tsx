"use client"

import { useState } from "react"
import { Star, X, LogIn } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/hooks/use-auth"

interface WriteReviewModalProps {
  productId: number
  productName: string
  isOpen: boolean
  onClose: () => void
  /** Called after a successful submission so the parent can refresh its review list. */
  onSubmitted?: () => void
}

export function WriteReviewModal({
  productId,
  productName,
  isOpen,
  onClose,
  onSubmitted,
}: WriteReviewModalProps) {
  const { toast } = useToast()
  const { user, loading: authLoading } = useAuth()

  const [hoveredStar, setHoveredStar] = useState(0)
  const [selectedRating, setSelectedRating] = useState(0)
  const [title, setTitle] = useState("")
  const [reviewText, setReviewText] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!isOpen) return null

  const resetForm = () => {
    setHoveredStar(0)
    setSelectedRating(0)
    setTitle("")
    setReviewText("")
    setError(null)
  }

  const handleClose = () => {
    resetForm()
    onClose()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (selectedRating === 0) {
      setError("Please select a star rating.")
      return
    }
    if (reviewText.trim().length < 10) {
      setError("Review must be at least 10 characters.")
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          product_id: productId,
          rating: selectedRating,
          title: title.trim() || null,
          review_text: reviewText.trim(),
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || "Something went wrong. Please try again.")
        return
      }

      toast({
        title: "Review Submitted!",
        description: "Thank you! Your review will appear after moderation.",
        duration: 5000,
      })

      handleClose()
      onSubmitted?.()
    } catch {
      setError("Network error. Please check your connection and try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) handleClose()
      }}
    >
      {/* Modal panel */}
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Write a Review</h2>
            <p className="text-sm text-gray-500 mt-0.5 line-clamp-1">{productName}</p>
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 rounded-full hover:bg-gray-100 transition-colors"
            aria-label="Close review modal"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-5">
          {/* Auth banner — login for verified purchase badge */}
          {!authLoading && !user && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <LogIn className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium text-blue-900">Log in for a Verified Purchase badge</p>
                    <p className="text-blue-700 mt-0.5">
                      You can still submit anonymously — but logging in confirms you bought this product.
                    </p>
                  </div>
                </div>
                <a
                  href={`/auth/login?returnUrl=${encodeURIComponent(typeof window !== "undefined" ? window.location.pathname : "")}`}
                  className="flex-shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg transition-colors whitespace-nowrap"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  Log In
                </a>
              </div>
            </div>
          )}

          {user && (
            <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-4 py-2.5">
              <Star className="w-4 h-4 fill-green-600 text-green-600 flex-shrink-0" />
              Reviewing as <strong>{user.first_name || "Verified User"} {user.last_name ? `${user.last_name.charAt(0)}.` : ""}</strong>
              {user.customer_id && " · Verified Purchase status will be checked automatically"}
            </div>
          )}

          {/* Star rating picker */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Your Rating <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-1" role="radiogroup" aria-label="Star rating">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  role="radio"
                  aria-label={`${star} star${star > 1 ? "s" : ""}`}
                  aria-checked={selectedRating === star}
                  onClick={() => setSelectedRating(star)}
                  onMouseEnter={() => setHoveredStar(star)}
                  onMouseLeave={() => setHoveredStar(0)}
                  className="p-1 transition-transform hover:scale-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded"
                >
                  <Star
                    className={`w-8 h-8 transition-colors ${
                      star <= (hoveredStar || selectedRating)
                        ? "fill-yellow-400 text-yellow-400"
                        : "text-gray-300"
                    }`}
                  />
                </button>
              ))}
              {selectedRating > 0 && (
                <span className="ml-2 self-center text-sm font-medium text-gray-600">
                  {["", "Poor", "Fair", "Good", "Very Good", "Excellent"][selectedRating]}
                </span>
              )}
            </div>
          </div>

          {/* Review title */}
          <div>
            <label htmlFor="review-title" className="block text-sm font-semibold text-gray-700 mb-1.5">
              Title <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <Input
              id="review-title"
              placeholder="Summarise your experience..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={255}
              className="w-full"
            />
          </div>

          {/* Review body */}
          <div>
            <label htmlFor="review-body" className="block text-sm font-semibold text-gray-700 mb-1.5">
              Review <span className="text-red-500">*</span>
            </label>
            <Textarea
              id="review-body"
              placeholder="Describe your experience with this product... (min. 10 characters)"
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
              rows={4}
              className="w-full resize-none"
              minLength={10}
              required
            />
            <p className={`text-xs mt-1 text-right ${reviewText.length < 10 && reviewText.length > 0 ? "text-red-500" : "text-gray-400"}`}>
              {reviewText.length} characters {reviewText.length < 10 ? `(${10 - reviewText.length} more needed)` : "✓"}
            </p>
          </div>

          {/* Inline error */}
          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-2.5">
              {error}
            </p>
          )}

          {/* Moderation notice */}
          <p className="text-xs text-gray-400">
            Reviews are submitted for moderation and will appear publicly once approved. We don't
            modify review content.
          </p>

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || selectedRating === 0}
              className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold"
            >
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Submitting...
                </span>
              ) : (
                "Submit Review"
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
