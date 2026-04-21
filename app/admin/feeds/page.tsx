"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Rss,
  Plus,
  Trash2,
  Copy,
  Check,
  Loader2,
  ExternalLink,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"

// ============================================================
// Types
// ============================================================

interface FeedConfiguration {
  id: string
  name: string
  category_slug: string | null
  product_type: string | null
  stock_status: string
  exclude_preorders: boolean
  min_price: number | null
  max_price: number | null
  is_active: boolean
  created_at: string
}

// ============================================================
// Component
// ============================================================

export default function FeedsPage() {
  const { toast } = useToast()
  const [feeds, setFeeds] = useState<FeedConfiguration[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  // Form state
  const [formName, setFormName] = useState("")
  const [formCategory, setFormCategory] = useState<string>("")
  const [formProductType, setFormProductType] = useState<string>("")
  const [formStockStatus, setFormStockStatus] = useState<string>("in_stock")
  const [formExcludePreorders, setFormExcludePreorders] = useState(false)
  const [formMinPrice, setFormMinPrice] = useState("")
  const [formMaxPrice, setFormMaxPrice] = useState("")

  // ── Data Fetching ─────────────────────────────────────────────
  const fetchFeeds = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/feeds")
      if (res.ok) {
        const data = await res.json()
        setFeeds(data.feeds || [])
      }
    } catch (error) {
      console.error("Failed to fetch feeds:", error)
      toast({ title: "Error", description: "Failed to load feeds", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => {
    fetchFeeds()
  }, [fetchFeeds])

  // ── Create Feed ───────────────────────────────────────────────
  const handleCreate = async () => {
    if (!formName.trim()) {
      toast({ title: "Validation Error", description: "Feed name is required", variant: "destructive" })
      return
    }

    setCreating(true)
    try {
      const res = await fetch("/api/admin/feeds", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formName.trim(),
          category_slug: formCategory || null,
          product_type: formProductType || null,
          stock_status: formStockStatus,
          exclude_preorders: formExcludePreorders,
          min_price: formMinPrice ? Number(formMinPrice) : null,
          max_price: formMaxPrice ? Number(formMaxPrice) : null,
        }),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || "Failed to create feed")
      }

      toast({ title: "Feed Created", description: `"${formName}" feed has been created successfully.` })

      // Reset form
      setFormName("")
      setFormCategory("")
      setFormProductType("")
      setFormStockStatus("in_stock")
      setFormExcludePreorders(false)
      setFormMinPrice("")
      setFormMaxPrice("")

      // Refresh list
      await fetchFeeds()
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" })
    } finally {
      setCreating(false)
    }
  }

  // ── Delete Feed ───────────────────────────────────────────────
  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete feed "${name}"? This cannot be undone.`)) return

    try {
      const res = await fetch(`/api/admin/feeds/${id}`, { method: "DELETE" })
      if (!res.ok && res.status !== 204) {
        throw new Error("Failed to delete feed")
      }
      toast({ title: "Feed Deleted", description: `"${name}" has been removed.` })
      await fetchFeeds()
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" })
    }
  }

  // ── Copy Feed URL ─────────────────────────────────────────────
  const copyFeedUrl = async (id: string) => {
    const url = `${window.location.origin}/api/feeds/${id}`
    try {
      await navigator.clipboard.writeText(url)
      setCopiedId(id)
      toast({ title: "URL Copied", description: "Feed URL copied to clipboard." })
      setTimeout(() => setCopiedId(null), 2000)
    } catch {
      // Fallback for non-secure contexts
      prompt("Copy this URL:", url)
    }
  }

  // ── Build Feed URL for display ────────────────────────────────
  const getFeedUrl = (id: string) => {
    if (typeof window !== "undefined") {
      return `${window.location.origin}/api/feeds/${id}`
    }
    return `/api/feeds/${id}`
  }

  // ── Render filter badges ──────────────────────────────────────
  const renderFilterBadges = (feed: FeedConfiguration) => {
    const badges: { label: string; variant: "default" | "secondary" | "outline" }[] = []

    if (feed.category_slug) {
      badges.push({ label: `Category: ${feed.category_slug}`, variant: "default" })
    }
    if (feed.product_type) {
      badges.push({ label: `Type: ${feed.product_type === "single" ? "Singles" : "Sealed"}`, variant: "secondary" })
    }
    if (feed.stock_status !== "all") {
      badges.push({
        label: `Stock: ${feed.stock_status === "in_stock" ? "In Stock" : "Out of Stock"}`,
        variant: "outline",
      })
    }
    if (feed.exclude_preorders) {
      badges.push({ label: "No Pre-Orders", variant: "outline" })
    }
    if (feed.min_price != null) {
      badges.push({ label: `Min: $${feed.min_price}`, variant: "outline" })
    }
    if (feed.max_price != null) {
      badges.push({ label: `Max: $${feed.max_price}`, variant: "outline" })
    }

    if (badges.length === 0) {
      return <Badge variant="secondary">All Products</Badge>
    }

    return (
      <div className="flex flex-wrap gap-1">
        {badges.map((b, i) => (
          <Badge key={i} variant={b.variant} className="text-xs">
            {b.label}
          </Badge>
        ))}
      </div>
    )
  }

  // ── Loading State ─────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <Rss className="h-6 w-6 text-orange-500" />
          GMC Feed Manager
        </h1>
        <p className="mt-1 text-gray-600 dark:text-gray-400">
          Create and manage Google Merchant Center product feeds with targeted filters.
        </p>
      </div>

      {/* Create Feed Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Create New Feed
          </CardTitle>
          <CardDescription>
            Define filter rules to generate a targeted XML feed for Google Shopping campaigns.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Feed Name */}
            <div className="space-y-2 lg:col-span-3">
              <Label htmlFor="feed-name">Feed Name *</Label>
              <Input
                id="feed-name"
                placeholder='e.g., "High Value Pokemon" or "All Sealed Products"'
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                maxLength={100}
              />
            </div>

            {/* Category */}
            <div className="space-y-2">
              <Label htmlFor="feed-category">Category</Label>
              <Select value={formCategory} onValueChange={setFormCategory}>
                <SelectTrigger id="feed-category">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="pokemon-tcg">Pokemon TCG</SelectItem>
                  <SelectItem value="magic-the-gathering">Magic: The Gathering</SelectItem>
                  <SelectItem value="yu-gi-oh">Yu-Gi-Oh!</SelectItem>
                  <SelectItem value="disney-lorcana">Disney Lorcana</SelectItem>
                  <SelectItem value="one-piece-card-game">One Piece Card Game</SelectItem>
                  <SelectItem value="dragon-ball-super">Dragon Ball Super</SelectItem>
                  <SelectItem value="union-arena">Union Arena</SelectItem>
                  <SelectItem value="star-wars-unlimited">Star Wars: Unlimited</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Product Type */}
            <div className="space-y-2">
              <Label htmlFor="feed-product-type">Product Type</Label>
              <Select value={formProductType} onValueChange={setFormProductType}>
                <SelectTrigger id="feed-product-type">
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="sealed">Sealed Products</SelectItem>
                  <SelectItem value="single">Cards / Singles</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Stock Status */}
            <div className="space-y-2">
              <Label htmlFor="feed-stock-status">Stock Status</Label>
              <Select value={formStockStatus} onValueChange={setFormStockStatus}>
                <SelectTrigger id="feed-stock-status">
                  <SelectValue placeholder="In Stock Only" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="in_stock">In Stock Only</SelectItem>
                  <SelectItem value="out_of_stock">Out of Stock Only</SelectItem>
                  <SelectItem value="all">All (In Stock + OOS)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Min Price */}
            <div className="space-y-2">
              <Label htmlFor="feed-min-price">Minimum Price ($)</Label>
              <Input
                id="feed-min-price"
                type="number"
                min="0"
                step="0.01"
                placeholder="No minimum"
                value={formMinPrice}
                onChange={(e) => setFormMinPrice(e.target.value)}
              />
            </div>

            {/* Max Price */}
            <div className="space-y-2">
              <Label htmlFor="feed-max-price">Maximum Price ($)</Label>
              <Input
                id="feed-max-price"
                type="number"
                min="0"
                step="0.01"
                placeholder="No maximum"
                value={formMaxPrice}
                onChange={(e) => setFormMaxPrice(e.target.value)}
              />
            </div>

            {/* Exclude Pre-Orders */}
            <div className="flex items-center gap-3 pt-6">
              <Checkbox
                id="feed-exclude-preorders"
                checked={formExcludePreorders}
                onCheckedChange={(checked) => setFormExcludePreorders(checked === true)}
              />
              <Label htmlFor="feed-exclude-preorders" className="cursor-pointer">
                Exclude Pre-Orders
              </Label>
            </div>
          </div>

          <div className="mt-6 flex justify-end">
            <Button
              onClick={handleCreate}
              disabled={creating || !formName.trim()}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {creating ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating...</>
              ) : (
                <><Plus className="mr-2 h-4 w-4" /> Create Feed</>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Feeds List */}
      <Card>
        <CardHeader>
          <CardTitle>Generated Feeds ({feeds.length})</CardTitle>
          <CardDescription>
            Copy the feed URL and paste it into Google Merchant Center &rarr; Products &rarr; Feeds &rarr; Add Feed.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {feeds.length === 0 ? (
            <div className="text-center py-12">
              <Rss className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No feeds created yet.</p>
              <p className="text-sm text-gray-400 mt-1">
                Use the form above to create your first Google Merchant Center feed.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Filters</TableHead>
                    <TableHead>Feed URL</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {feeds.map((feed) => (
                    <TableRow key={feed.id}>
                      <TableCell className="font-medium">{feed.name}</TableCell>
                      <TableCell>{renderFilterBadges(feed)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <code className="text-xs bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded max-w-[250px] truncate block">
                            {getFeedUrl(feed.id)}
                          </code>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyFeedUrl(feed.id)}
                            className="shrink-0"
                          >
                            {copiedId === feed.id ? (
                              <Check className="h-4 w-4 text-green-500" />
                            ) : (
                              <Copy className="h-4 w-4" />
                            )}
                          </Button>
                          <a
                            href={getFeedUrl(feed.id)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="shrink-0"
                          >
                            <Button variant="ghost" size="sm">
                              <ExternalLink className="h-4 w-4" />
                            </Button>
                          </a>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-gray-500">
                        {new Date(feed.created_at).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(feed.id, feed.name)}
                          className="text-red-500 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
