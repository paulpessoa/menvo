"use client"

import dynamic from "next/dynamic"

export const DeferredFinalCTA = dynamic(() => import("@/components/home/FinalCTA").then((mod) => mod.FinalCTA), {
  ssr: false,
  loading: () => (
    <section className="w-full py-16 md:py-20 bg-primary/10 relative overflow-hidden">
      <div className="container px-4 md:px-6 relative z-10 flex flex-col items-center justify-center space-y-6 text-center">
        <div className="h-12 w-3/4 max-w-[500px] bg-primary/20 animate-pulse rounded-md"></div>
        <div className="h-6 w-2/3 max-w-[400px] bg-primary/20 animate-pulse rounded-md"></div>
        <div className="h-14 w-[200px] bg-primary/20 animate-pulse rounded-md mt-4"></div>
      </div>
    </section>
  )
})
