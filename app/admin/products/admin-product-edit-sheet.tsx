"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { useToast } from "@/hooks/use-toast"
import { updateAdminProductAction } from "./actions"

interface ProductEditSheetProps {
  product: any
  isOpen: boolean
  onOpenChange: (open: boolean) => void
}

export function AdminProductEditSheet({ product, isOpen, onOpenChange }: ProductEditSheetProps) {
  const router = useRouter()
  const { toast } = useToast()
  
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState<any>({
    name: "",
    image_url: "",
    upc: "",
    price: "",
    original_price: "",
    stock_quantity: "",
    description: "",
    category: "",
    is_active: true,
    is_featured: false,
    is_pre_order: false,
    release_date: "",
  })

  // Populate form correctly on edit trigger
  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name || "",
        image_url: product.image_url || "",
        upc: product.upc || "",
        price: product.price || "0",
        original_price: product.original_price || "",
        stock_quantity: product.stock_quantity || "0",
        description: product.description || "",
        category: product.category || "",
        is_active: product.is_active ?? true,
        is_featured: product.is_featured ?? false,
        is_pre_order: product.is_pre_order ?? false,
        release_date: product.release_date ? new Date(product.release_date).toISOString().split('T')[0] : "",
      })
    }
  }, [product])

  const handleChange = (field: string, value: any) => {
    setFormData((prev: any) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const payload = {
      ...formData,
      id: product.id,
      price: parseFloat(formData.price) || 0,
      original_price: formData.original_price ? parseFloat(formData.original_price) : null,
      stock_quantity: parseInt(formData.stock_quantity, 10) || 0,
    }

    const result = await updateAdminProductAction(payload)

    setLoading(false)

    if (result.success) {
      toast({
        title: "Product Updated",
        description: `${formData.name} has been successfully updated.`,
      })
      onOpenChange(false)
      router.refresh()
    } else {
      toast({
        title: "Error",
        description: result.error || "Failed to update product.",
        variant: "destructive",
      })
    }
  }

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Edit Product</SheetTitle>
          <SheetDescription>
            Make changes to the product details here. Click save when you're done.
          </SheetDescription>
        </SheetHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6 mt-6">
          <div className="space-y-2">
            <Label htmlFor="name">Product Name *</Label>
            <Input 
              id="name" 
              required 
              value={formData.name} 
              onChange={(e) => handleChange("name", e.target.value)} 
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="image_url">Image URL</Label>
            <Input 
              id="image_url" 
              type="url"
              value={formData.image_url} 
              onChange={(e) => handleChange("image_url", e.target.value)} 
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="upc">UPC / Barcode</Label>
              <Input 
                id="upc" 
                value={formData.upc} 
                onChange={(e) => handleChange("upc", e.target.value)} 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">Category *</Label>
              <Input 
                id="category" 
                required
                value={formData.category} 
                onChange={(e) => handleChange("category", e.target.value)} 
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="price">Price ($) *</Label>
              <Input 
                id="price" 
                type="number" 
                step="0.01" 
                required
                value={formData.price} 
                onChange={(e) => handleChange("price", e.target.value)} 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="original_price">Compare Price ($)</Label>
              <Input 
                id="original_price" 
                type="number" 
                step="0.01" 
                value={formData.original_price} 
                onChange={(e) => handleChange("original_price", e.target.value)} 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="stock_quantity">Stock *</Label>
              <Input 
                id="stock_quantity" 
                type="number"
                required
                value={formData.stock_quantity} 
                onChange={(e) => handleChange("stock_quantity", e.target.value)} 
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea 
              id="description" 
              rows={4}
              value={formData.description} 
              onChange={(e) => handleChange("description", e.target.value)} 
            />
          </div>

          <div className="space-y-4 pt-2 pb-2 border-t border-b">
            <h4 className="text-sm font-medium">Status Elements</h4>
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="is_active" 
                checked={formData.is_active} 
                onCheckedChange={(checked) => handleChange("is_active", checked)}
              />
              <Label htmlFor="is_active" className="cursor-pointer">Active (Visible on store)</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="is_featured" 
                checked={formData.is_featured} 
                onCheckedChange={(checked) => handleChange("is_featured", checked)}
              />
              <Label htmlFor="is_featured" className="cursor-pointer">Featured (Homepage visibility)</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="is_pre_order" 
                checked={formData.is_pre_order} 
                onCheckedChange={(checked) => handleChange("is_pre_order", checked)}
              />
              <Label htmlFor="is_pre_order" className="cursor-pointer">Pre-Order Status</Label>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="release_date">Release Date</Label>
            <Input 
              id="release_date" 
              type="date"
              value={formData.release_date} 
              onChange={(e) => handleChange("release_date", e.target.value)} 
            />
            <p className="text-xs text-gray-500">Only relevant for pre-orders</p>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  )
}
