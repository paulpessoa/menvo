"use client"

import dynamic from "next/dynamic"

export const DeferredHeroActions = dynamic(() => import("@/components/home/HeroActions").then((mod) => mod.HeroActions), {
  ssr: false,
  loading: () => (
    <div className="flex flex-col gap-3 w-full max-w-sm mx-auto lg:flex-row lg:max-w-none lg:mx-0">
      <div className="h-12 w-full lg:w-[150px] bg-muted/50 animate-pulse rounded-md"></div>
      <div className="h-12 w-full lg:w-[180px] bg-muted/50 animate-pulse rounded-md"></div>
    </div>
  )
})
