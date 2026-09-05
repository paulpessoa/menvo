import { LucideIcon } from "lucide-react"

export interface NavigationLink {
  type?: 'link'
  name: string
  href: string
  icon?: LucideIcon
  color?: string
}

export interface NavigationSeparator {
  type: 'separator'
}

export type UserNavigationItem = NavigationLink | NavigationSeparator
