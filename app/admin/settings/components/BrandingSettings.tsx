import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { ImagePlus, X } from "lucide-react"

interface BrandingSettingsProps {
  data: {
    logoUrl: string
    faviconUrl: string
  }
  pendingLogo: File | null
  pendingFavicon: File | null
  onFileChange: (field: "logo" | "favicon", file: File | null) => void
}

export function BrandingSettings({ data, pendingLogo, pendingFavicon, onFileChange }: BrandingSettingsProps) {
  const previewLogoUrl = pendingLogo ? URL.createObjectURL(pendingLogo) : data.logoUrl
  const previewFaviconUrl = pendingFavicon ? URL.createObjectURL(pendingFavicon) : data.faviconUrl

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Site Logo</CardTitle>
          <CardDescription>
            The primary logo used in the site header and other branding areas.
            Recommended format: Transparent PNG, rectangluar.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg p-6 bg-gray-50 transition-colors hover:bg-gray-100">
            {previewLogoUrl ? (
              <div className="relative w-full max-w-[200px] aspect-[3/1] rounded-md overflow-hidden bg-white/10 flex items-center justify-center p-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={previewLogoUrl} alt="Logo Preview" className="max-w-full max-h-full object-contain drop-shadow-md" />
                <button
                  onClick={() => onFileChange("logo", null)}
                  className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 shadow-md hover:bg-red-600 transition-colors"
                  aria-label="Remove logo"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <div className="text-center">
                <ImagePlus className="mx-auto h-10 w-10 text-gray-400" />
                <div className="mt-4 flex text-sm text-gray-600 justify-center">
                  <label
                    htmlFor="logo-upload"
                    className="relative cursor-pointer rounded-md bg-white font-semibold text-blue-600 focus-within:outline-none hover:text-blue-500 px-2 py-1 shadow-sm border border-gray-200"
                  >
                    <span>Upload Logo</span>
                    <input
                      id="logo-upload"
                      type="file"
                      accept="image/*"
                      className="sr-only"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          onFileChange("logo", e.target.files[0])
                        }
                      }}
                    />
                  </label>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Favicon</CardTitle>
          <CardDescription>
            The icon shown in browser tabs. Must be a square image (e.g. 32x32).
            Format: ICO, PNG, or SVG.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg p-6 bg-gray-50 transition-colors hover:bg-gray-100">
            {previewFaviconUrl ? (
              <div className="relative w-16 h-16 rounded-md overflow-hidden bg-white border flex items-center justify-center p-1">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={previewFaviconUrl} alt="Favicon Preview" className="max-w-full max-h-full object-contain" />
                <button
                  onClick={() => onFileChange("favicon", null)}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-md hover:bg-red-600 transition-colors"
                  aria-label="Remove favicon"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ) : (
              <div className="text-center">
                <ImagePlus className="mx-auto h-10 w-10 text-gray-400" />
                <div className="mt-4 flex text-sm text-gray-600 justify-center">
                  <label
                    htmlFor="favicon-upload"
                    className="relative cursor-pointer rounded-md bg-white font-semibold text-blue-600 focus-within:outline-none hover:text-blue-500 px-2 py-1 shadow-sm border border-gray-200"
                  >
                    <span>Upload Favicon</span>
                    <input
                      id="favicon-upload"
                      type="file"
                      accept="image/*"
                      className="sr-only"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          onFileChange("favicon", e.target.files[0])
                        }
                      }}
                    />
                  </label>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
