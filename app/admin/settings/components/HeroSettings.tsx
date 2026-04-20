import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ImagePlus, X } from "lucide-react"

interface HeroSettingsProps {
  data: {
    title: string
    subtitle: string
    imageUrl: string
  }
  pendingImage: File | null
  onChange: (field: string, value: string) => void
  onFileChange: (file: File | null) => void
}

export function HeroSettings({ data, pendingImage, onChange, onFileChange }: HeroSettingsProps) {
  const previewUrl = pendingImage ? URL.createObjectURL(pendingImage) : data.imageUrl

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Hero Text Content</CardTitle>
            <CardDescription>
              Update the main headline and description shown on your homepage.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="heroTitle">Hero Title</Label>
              <Input
                id="heroTitle"
                value={data.title}
                onChange={(e) => onChange("heroTitle", e.target.value)}
                placeholder="Premium Trading Cards & Collectibles Store"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="heroSubtitle">Hero Subtitle</Label>
              <Textarea
                id="heroSubtitle"
                value={data.subtitle}
                onChange={(e) => onChange("heroSubtitle", e.target.value)}
                placeholder="Discover authentic Magic: The Gathering..."
                rows={4}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      <div>
        <Card className="h-full">
          <CardHeader>
            <CardTitle>Hero Visual</CardTitle>
            <CardDescription>
              Upload a featured image or promotional graphic for the hero section.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Label>Featured Image</Label>
              
              <div className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg p-6 bg-gray-50 transition-colors hover:bg-gray-100">
                {previewUrl ? (
                  <div className="relative w-full aspect-video rounded-md overflow-hidden bg-white border">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={previewUrl} alt="Hero Preview" className="w-full h-full object-contain" />
                    <button
                      onClick={() => onFileChange(null)}
                      className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 shadow-md hover:bg-red-600 transition-colors"
                      aria-label="Remove image"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <div className="text-center">
                    <ImagePlus className="mx-auto h-12 w-12 text-gray-400" />
                    <div className="mt-4 flex text-sm text-gray-600 justify-center">
                      <label
                        htmlFor="hero-image-upload"
                        className="relative cursor-pointer rounded-md bg-white font-semibold text-blue-600 focus-within:outline-none focus-within:ring-2 focus-within:ring-blue-600 focus-within:ring-offset-2 hover:text-blue-500 px-2 py-1 shadow-sm border border-gray-200"
                      >
                        <span>Upload a file</span>
                        <input
                          id="hero-image-upload"
                          name="hero-image-upload"
                          type="file"
                          accept="image/*"
                          className="sr-only"
                          onChange={(e) => {
                            if (e.target.files && e.target.files[0]) {
                              onFileChange(e.target.files[0])
                            }
                          }}
                        />
                      </label>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">PNG, JPG, WEBP up to 5MB</p>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
