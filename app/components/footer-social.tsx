"use client"
import { useState, useEffect } from "react"
import Link from "next/link"
import { Facebook, Twitter, Instagram, Youtube } from "@/app/components/social-icons"

// Create a simple Pinterest icon since Lucide doesn't have it natively or it might not be exported
function PinterestIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="12" y1="12" x2="12" y2="22" />
      <path d="M12 12c-3.3 0-6-3.3-6-6s2.7-6 6-6 6 3.3 6 6-2.7 6-6 6z" />
      <path d="M12 12c0 2.2 1.8 4 4 4" />
    </svg>
  )
}

export function FooterSocial() {
  const [links, setLinks] = useState({
    facebook: "",
    twitter: "",
    instagram: "",
    youtube: "",
    pinterest: "",
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/admin/settings")
      .then((res) => res.json())
      .then((data) => {
        setLinks({
          facebook: data.socialFacebook || "",
          twitter: data.socialTwitter || "",
          instagram: data.socialInstagram || "",
          youtube: data.socialYoutube || "",
          pinterest: data.socialPinterest || "",
        })
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return <div className="h-5"></div>
  }

  return (
    <div className="flex space-x-4 mt-2">
      {links.facebook && (
        <Link href={links.facebook} target="_blank" rel="noopener noreferrer" className="text-black hover:text-[rgb(37,99,235)] transition-colors">
          <Facebook className="w-5 h-5" />
          <span className="sr-only">Facebook</span>
        </Link>
      )}
      {links.twitter && (
        <Link href={links.twitter} target="_blank" rel="noopener noreferrer" className="text-black hover:text-[rgb(37,99,235)] transition-colors">
          <Twitter className="w-5 h-5" />
          <span className="sr-only">Twitter</span>
        </Link>
      )}
      {links.instagram && (
        <Link href={links.instagram} target="_blank" rel="noopener noreferrer" className="text-black hover:text-[rgb(37,99,235)] transition-colors">
          <Instagram className="w-5 h-5" />
          <span className="sr-only">Instagram</span>
        </Link>
      )}
      {links.youtube && (
        <Link href={links.youtube} target="_blank" rel="noopener noreferrer" className="text-black hover:text-[rgb(37,99,235)] transition-colors">
          <Youtube className="w-5 h-5" />
          <span className="sr-only">Youtube</span>
        </Link>
      )}
      {links.pinterest && (
        <Link href={links.pinterest} target="_blank" rel="noopener noreferrer" className="text-black hover:text-[rgb(37,99,235)] transition-colors">
          <PinterestIcon className="w-5 h-5" />
          <span className="sr-only">Pinterest</span>
        </Link>
      )}
    </div>
  )
}
