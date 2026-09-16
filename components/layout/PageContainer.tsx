import { cn } from "@/lib/utils"

type PageContainerSize = "default" | "medium" | "form" | "narrow"

const sizeClass: Record<PageContainerSize, string> = {
  default: "",
  medium: "max-w-5xl",
  form: "max-w-4xl",
  narrow: "max-w-3xl",
}

interface PageContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: PageContainerSize
}

export function PageContainer({
  size = "default",
  className,
  children,
  ...props
}: PageContainerProps) {
  return (
    <div className={cn("container py-8", sizeClass[size], className)} {...props}>
      {children}
    </div>
  )
}
