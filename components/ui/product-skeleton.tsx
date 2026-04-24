import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export function ProductCardSkeleton() {
  return (
    <Card className="flex flex-col h-full overflow-hidden">
      <CardHeader className="p-0 flex-shrink-0">
        <Skeleton className="w-full aspect-square rounded-t-lg rounded-b-none" />
      </CardHeader>
      <CardContent className="p-5 flex-grow flex flex-col space-y-4">
        {/* Category */}
        <Skeleton className="h-3 w-1/3" />
        
        {/* Title (2 lines) */}
        <div className="space-y-2">
          <Skeleton className="h-5 w-full" />
          <Skeleton className="h-5 w-4/5" />
        </div>
        
        {/* Spacer */}
        <div className="flex-grow" />
        
        {/* Price */}
        <div className="flex items-center gap-2">
          <Skeleton className="h-6 w-1/4" />
        </div>
        
        {/* Button */}
        <div className="pt-4 border-t">
          <Skeleton className="h-10 w-full" />
        </div>
      </CardContent>
    </Card>
  )
}

export function ProductGridSkeleton({ count = 8, className = "" }: { count?: number, className?: string }) {
  return (
    <div className={`grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 ${className}`}>
      {Array.from({ length: count }).map((_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  )
}
