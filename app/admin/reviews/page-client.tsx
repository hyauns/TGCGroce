"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Search, CheckCircle, Trash2, Upload, AlertCircle, Star } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"

export function ReviewsDataTable({
  initialReviews,
  totalCount,
  currentPage,
  itemsPerPage,
  searchQuery,
}: {
  initialReviews: any[]
  totalCount: number
  currentPage: number
  itemsPerPage: number
  searchQuery: string
}) {
  const router = useRouter()
  const [query, setQuery] = useState(searchQuery)
  const [reviews, setReviews] = useState(initialReviews)
  const [isImportOpen, setIsImportOpen] = useState(false)
  const [importFile, setImportFile] = useState<File | null>(null)
  const [isImporting, setIsImporting] = useState(false)
  const [importResult, setImportResult] = useState<{success?: boolean, message?: string} | null>(null)

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    const url = new URL(window.location.href)
    if (query) url.searchParams.set("q", query)
    else url.searchParams.delete("q")
    url.searchParams.set("page", "1")
    router.push(url.pathname + url.search)
  }

  const handleApprove = async (id: string, currentStatus: boolean) => {
    try {
      const res = await fetch(`/api/admin/reviews/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_approved: !currentStatus })
      })
      if (res.ok) {
        setReviews(reviews.map(r => r.id === id ? { ...r, is_approved: !currentStatus } : r))
        router.refresh()
      } else {
        alert("Failed to update status")
      }
    } catch (e) {
      alert("An error occurred")
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to completely delete this review?")) return
    try {
      const res = await fetch(`/api/admin/reviews/${id}`, {
        method: 'DELETE',
      })
      if (res.ok) {
        setReviews(reviews.filter(r => r.id !== id))
        router.refresh()
      } else {
        alert("Failed to delete review")
      }
    } catch (e) {
      alert("An error occurred")
    }
  }

  const parseAndImportFile = async () => {
    if (!importFile) return
    setIsImporting(true)
    setImportResult(null)

    try {
      const text = await importFile.text()
      let payload
      try {
        payload = JSON.parse(text)
      } catch (e) {
        throw new Error("File must be a valid JSON array.")
      }

      if (!Array.isArray(payload)) {
        throw new Error("JSON must be an array of review objects.")
      }

      const res = await fetch('/api/admin/reviews/import', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(payload)
      })

      const data = await res.json()
      if (res.ok) {
        setImportResult({ success: true, message: data.message })
        setTimeout(() => {
          setIsImportOpen(false)
          router.refresh()
        }, 2000)
      } else {
        setImportResult({ success: false, message: data.error || "Failed to import" })
      }
    } catch (e: any) {
      setImportResult({ success: false, message: e.message })
    } finally {
      setIsImporting(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <form onSubmit={handleSearch} className="flex gap-2 max-w-sm w-full">
          <Input
            placeholder="Search reviews..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <Button type="submit">
            <Search className="h-4 w-4 mr-2" /> Search
          </Button>
        </form>

        <Dialog open={isImportOpen} onOpenChange={setIsImportOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" className="shrink-0 bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-100">
              <Upload className="h-4 w-4 mr-2" /> Bulk Import
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Import Historical Reviews</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="review-file">Upload JSON File</Label>
                <Input 
                  id="review-file" 
                  type="file" 
                  accept=".json"
                  onChange={(e) => setImportFile(e.target.files?.[0] || null)}
                />
                <p className="text-xs text-gray-500">
                  Expects an array of objects containing <code className="bg-gray-100 px-1 rounded">product_slug</code>, <code className="bg-gray-100 px-1 rounded">rating</code>, <code className="bg-gray-100 px-1 rounded">title</code>, <code className="bg-gray-100 px-1 rounded">review_text</code>, <code className="bg-gray-100 px-1 rounded">customer_name</code>, and <code className="bg-gray-100 px-1 rounded">date</code>.
                </p>
              </div>

              {importResult && (
                <div className={`p-3 rounded text-sm flex gap-2 items-center ${importResult.success ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                  {importResult.success ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                  {importResult.message}
                </div>
              )}

              <Button 
                onClick={parseAndImportFile} 
                disabled={!importFile || isImporting}
                className="w-full"
              >
                {isImporting ? "Importing..." : "Process Import"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-md border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Status</TableHead>
              <TableHead>Product</TableHead>
              <TableHead className="w-[300px]">Review Content</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {reviews.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-6 text-gray-500">
                  No reviews found.
                </TableCell>
              </TableRow>
            ) : (
              reviews.map((r) => (
                <TableRow key={r.id}>
                  <TableCell>
                    {r.is_approved ? (
                      <Badge className="bg-green-100 text-green-800 border-0">Approved</Badge>
                    ) : (
                      <Badge variant="outline" className="bg-yellow-50 text-yellow-800 border-yellow-200">Pending</Badge>
                    )}
                  </TableCell>
                  <TableCell className="font-medium text-blue-600 hover:underline">
                    <a href={`/products/${r.product_slug}`} target="_blank" rel="noreferrer">
                      {r.product_name}
                    </a>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center text-yellow-500 mb-1">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className={`h-3 w-3 ${i < r.rating ? 'fill-current' : 'text-gray-300 fill-gray-300'}`} />
                      ))}
                    </div>
                    <strong>{r.title}</strong>
                    <p className="text-sm text-gray-600 line-clamp-2 mt-1">{r.review_text}</p>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm font-medium">{r.reviewer_name}</div>
                    {r.is_verified_purchase && <span className="text-xs text-green-600">Verified</span>}
                  </TableCell>
                  <TableCell className="text-sm text-gray-500">
                    {new Date(r.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button 
                      variant={r.is_approved ? "outline" : "default"} 
                      size="sm"
                      onClick={() => handleApprove(r.id, r.is_approved)}
                    >
                      {r.is_approved ? "Hide" : "Approve"}
                    </Button>
                    <Button 
                      variant="destructive" 
                      size="sm"
                      onClick={() => handleDelete(r.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {totalCount > itemsPerPage && (
        <div className="flex justify-between items-center bg-white dark:bg-gray-800 p-4 border border-gray-200 dark:border-gray-700 rounded-md">
          <p className="text-sm text-gray-500">
            Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, totalCount)} of {totalCount}
          </p>
          <div className="space-x-2">
            <Button
              variant="outline"
              disabled={currentPage === 1}
              onClick={() => {
                const url = new URL(window.location.href)
                url.searchParams.set("page", (currentPage - 1).toString())
                router.push(url.pathname + url.search)
              }}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              disabled={currentPage * itemsPerPage >= totalCount}
              onClick={() => {
                const url = new URL(window.location.href)
                url.searchParams.set("page", (currentPage + 1).toString())
                router.push(url.pathname + url.search)
              }}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
