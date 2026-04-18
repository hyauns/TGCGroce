import React from "react"

interface FormattedDescriptionProps {
  text?: string | null
  className?: string
}

export function FormattedDescription({ text, className = "text-gray-700" }: FormattedDescriptionProps) {
  if (!text) return null

  // 1. Pre-process text to normalize bullet points and line breaks.
  // Many TCG descriptions cram bullets inline like "Includes: • 1 pack • 2 cards".
  // This regex inserts a newline before any bullet character '•' so they can be parsed correctly.
  const normalizedText = text
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/\s*•\s*/g, "\n• ")
    .trim()

  // 2. Split into blocks/paragraphs by double newlines.
  const blocks = normalizedText.split(/\n\n+/).filter(Boolean)

  return (
    <div className={`formatted-description space-y-4 ${className}`}>
      {blocks.map((block, blockIndex) => {
        const lines = block.split(/\n/).map((l) => l.trim()).filter(Boolean)

        // Check if this block contains any list items
        const isListBlock = lines.some((line) => /^[•\-*]\s+/.test(line))

        if (isListBlock) {
          const elements: React.ReactNode[] = []
          let currentList: string[] = []

          // Helper to flush current list items to the elements array
          const flushList = () => {
            if (currentList.length > 0) {
              elements.push(
                <ul key={`ul-${elements.length}`} className="list-disc list-outside ml-5 space-y-1 my-2">
                  {currentList.map((item, i) => (
                    <li key={`li-${i}`} className="leading-relaxed">
                      {item}
                    </li>
                  ))}
                </ul>
              )
              currentList = []
            }
          }

          lines.forEach((line) => {
            const listMatch = line.match(/^[•\-*]\s+(.*)/)
            if (listMatch) {
              // It's a list item
              currentList.push(listMatch[1])
            } else {
              // Not a list item
              flushList()
              if (line) {
                elements.push(
                  <p key={`p-${elements.length}`} className="leading-relaxed">
                    {line}
                  </p>
                )
              }
            }
          })

          flushList() // clear any remaining

          return <div key={blockIndex}>{elements}</div>
        }

        // If no lists are in this block, render as a standard paragraph
        return (
          <p key={blockIndex} className="leading-relaxed">
            {block}
          </p>
        )
      })}
    </div>
  )
}
