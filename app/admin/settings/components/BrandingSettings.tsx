import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { ImagePlus, X, Facebook, Instagram, Twitter, Youtube } from "lucide-react"

interface BrandingSettingsProps {
  data: {
    logoUrl: string
    faviconUrl: string
    socialFacebook: string
    socialInstagram: string
    socialPinterest: string
    socialTwitter: string
    socialYoutube: string
  }
  pendingLogo: File | null
  pendingFavicon: File | null
  onFileChange: (field: "logo" | "favicon", file: File | null) => void
  onChange: (field: string, value: string) => void
}

export function BrandingSettings({ data, pendingLogo, pendingFavicon, onFileChange, onChange }: BrandingSettingsProps) {
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
      
      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle>Social Media Profiles</CardTitle>
          <CardDescription>
            Add links to your social pages. Icons will automatically appear in the footer.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="socialFacebook" className="flex items-center gap-2"><Facebook className="w-4 h-4 text-blue-600" /> Facebook URL</Label>
            <Input id="socialFacebook" value={data.socialFacebook} onChange={(e) => onChange("socialFacebook", e.target.value)} placeholder="https://facebook.com/tgclore" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="socialInstagram" className="flex items-center gap-2"><Instagram className="w-4 h-4 text-pink-600" /> Instagram URL</Label>
            <Input id="socialInstagram" value={data.socialInstagram} onChange={(e) => onChange("socialInstagram", e.target.value)} placeholder="https://instagram.com/tgclore" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="socialTwitter" className="flex items-center gap-2"><Twitter className="w-4 h-4 text-sky-500" /> Twitter URL</Label>
            <Input id="socialTwitter" value={data.socialTwitter} onChange={(e) => onChange("socialTwitter", e.target.value)} placeholder="https://twitter.com/tgclore" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="socialYoutube" className="flex items-center gap-2"><Youtube className="w-4 h-4 text-red-600" /> YouTube URL</Label>
            <Input id="socialYoutube" value={data.socialYoutube} onChange={(e) => onChange("socialYoutube", e.target.value)} placeholder="https://youtube.com/@tgclore" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="socialPinterest">Pinterest URL</Label>
            <Input id="socialPinterest" value={data.socialPinterest} onChange={(e) => onChange("socialPinterest", e.target.value)} placeholder="https://pinterest.com/tgclore" />
          </div>
        </CardContent>
      </Card>

    </div>
  )
}
