"use client"

import React, { useState } from "react"
import Image, { ImageProps } from "next/image"

interface ImageWithFallbackProps extends ImageProps {
  fallbackSrc?: string
}

export function ImageWithFallback({
  src,
  fallbackSrc = "/placeholder.png",
  alt,
  ...rest
}: ImageWithFallbackProps) {
  const [error, setError] = useState(false)

  // Reset error state when the primary source changes
  React.useEffect(() => {
    setError(false)
  }, [src])

  const currentSrc = error ? fallbackSrc : src

  return (
    <Image
      {...rest}
      src={currentSrc}
      alt={alt || "Image"}
      unoptimized={error ? true : rest.unoptimized}
      onError={(e) => {
        // Bypass next/image caching bugs by natively targeting the DOM element
        e.currentTarget.src = fallbackSrc
        e.currentTarget.srcset = ""
        setError(true)
      }}
    />
  )
}
