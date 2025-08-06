"use client"

import { Skeleton } from "@/components/ui/skeleton"
import { Loader2 } from 'lucide-react'

export default function MentorsLoading() {
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="text-center mb-8">
        <Skeleton className="h-10 w-96 mx-auto mb-4" />
        <Skeleton className="h-6 w-full max-w-xl mx-auto" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Filters Skeleton */}
        <div className="lg:col-span-1">
          <Card className="p-6">
            <Skeleton className="h-6 w-32 mb-4" />
            <Skeleton className="h-10 w-full mb-4" />
            <Skeleton className="h-4 w-24 mb-2" />
            <Skeleton className="h-8 w-full mb-4" />
            <Skeleton className="h-4 w-24 mb-2" />
            <Skeleton className="h-8 w-full mb-4" />
            <Skeleton className="h-4 w-24 mb-2" />
            <Skeleton className="h-8 w-full mb-4" />
            <Skeleton className="h-10 w-full" />
          </Card>
        </div>

        {/* Mentor List Skeleton */}
        <div className="lg:col-span-3">
          <div className="flex justify-between items-center mb-6">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-10 w-32" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(9)].map((_, i) => (
              <Card key={i} className="p-6">
                <div className="flex flex-col items-center text-center">
                  <Skeleton className="h-24 w-24 rounded-full mb-4" />
                  <Skeleton className="h-6 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-1/2 mb-4" />
                  <div className="flex flex-wrap justify-center gap-2 mb-4">
                    <Skeleton className="h-6 w-16" />
                    <Skeleton className="h-6 w-20" />
                    <Skeleton className="h-6 w-12" />
                  </div>
                  <Skeleton className="h-10 w-full" />
                </div>
              </Card>
            ))}
          </div>
          <div className="flex justify-center mt-8">
            <Skeleton className="h-10 w-48" />
          </div>
        </div>
      </div>

      {/* Full Page Loader */}
      <div className="fixed inset-0 flex justify-center items-center bg-white bg-opacity-75 z-50">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="text-lg text-muted-foreground">Carregando mentores...</p>
      </div>
    </div>
  )
}
