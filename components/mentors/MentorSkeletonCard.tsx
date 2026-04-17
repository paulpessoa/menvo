import { Card, CardContent, CardHeader } from "@/components/ui/card"

export function MentorSkeletonCard() {
  return (
    <Card className="animate-pulse flex flex-col h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
          <div className="space-y-2">
            <div className="h-4 bg-gray-200 rounded w-32"></div>
            <div className="h-3 bg-gray-200 rounded w-24"></div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 flex-1">
        <div className="flex justify-between items-center">
            <div className="h-5 bg-gray-200 rounded w-20"></div>
            <div className="h-4 bg-gray-200 rounded w-16"></div>
        </div>
        <div className="space-y-2">
          <div className="h-3 bg-gray-200 rounded"></div>
          <div className="h-3 bg-gray-200 rounded w-3/4"></div>
        </div>
        <div className="flex gap-1">
          <div className="h-5 bg-gray-200 rounded w-16"></div>
          <div className="h-5 bg-gray-200 rounded w-16"></div>
          <div className="h-5 bg-gray-200 rounded w-16"></div>
        </div>
        <div className="mt-auto pt-4 border-t flex justify-between">
          <div className="h-4 bg-gray-200 rounded w-24"></div>
          <div className="h-4 bg-gray-200 rounded w-16"></div>
        </div>
        <div className="h-10 bg-gray-200 rounded w-full mt-4"></div>
      </CardContent>
    </Card>
  )
}
