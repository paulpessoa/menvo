"use client"

import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Menu, LogIn, UserPlus, Home, Users, Calendar, MessageSquare, Info, HandHeart, Settings, LogOut, Shield, LayoutDashboard } from 'lucide-react'
import { ModeToggle } from "@/components/mode-toggle"
import { useAuth } from "@/hooks/useAuth"
import { useToast } from "@/hooks/useToast"
import { useRouter } from "next/navigation"
import { useTranslation } from "react-i18next"
import { useUserRoles } from "@/app/context/user-roles-context"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useUserProfile } from "@/hooks/useUserProfile"

export default function Header() {
  const { t } = useTranslation()
  const { user, loading: authLoading, signOut } = useAuth()
  const { userProfile, loading: profileLoading } = useUserProfile(user?.id)
  const { isAdmin, isMentor, isMentee, isLoadingRoles } = useUserRoles()
  const { toast } = useToast()
  const router = useRouter()

  const handleLogout = async () => {
    await signOut()
    toast({
      title: t('header.logoutSuccess'),
      variant: "default",
    })
    router.push("/login")
  }

  const navItems = [
    { name: t('header.home'), href: "/", icon: Home },
    { name: t('header.findMentors'), href: "/mentors", icon: Users, show: isMentee || !user },
    { name: t('header.howItWorks'), href: "/how-it-works", icon: Info },
    { name: t('header.events'), href: "/events", icon: Calendar },
    { name: t('header.aboutUs'), href: "/about", icon: Info },
    { name: t('header.donate'), href: "/doar", icon: HandHeart },
  ]

  const userNavItems = [
    { name: t('header.dashboard'), href: "/dashboard", icon: LayoutDashboard, show: user },
    { name: t('header.profile'), href: "/profile", icon: User, show: user },
    { name: t('header.mentorship'), href: "/mentorship", icon: Calendar, show: isMentor },
    { name: t('header.messages'), href: "/messages", icon: MessageSquare, show: user },
    { name: t('header.admin'), href: "/admin", icon: Shield, show: isAdmin },
    { name: t('header.settings'), href: "/settings", icon: Settings, show: user },
  ]

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/80 backdrop-blur-lg">
      <div className="container flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <Image src="/logo.png" alt="MentorConnect Logo" width={120} height={32} priority />
          <span className="sr-only">MentorConnect</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
          {navItems.filter(item => item.show === undefined ? true : item.show).map((item) => (
            <Link key={item.name} href={item.href} className="hover:text-primary transition-colors">
              {item.name}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <ModeToggle />

          {authLoading || isLoadingRoles ? (
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          ) : user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={userProfile?.avatar_url || "/placeholder-user.jpg"} alt={userProfile?.full_name || user.email || "User"} />
                    <AvatarFallback>{userProfile?.full_name?.charAt(0) || user.email?.charAt(0) || 'U'}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{userProfile?.full_name || user.email}</p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {userProfile?.email || user.email}
                    </p>
                    {userProfile?.role && (
                      <p className="text-xs leading-none text-muted-foreground capitalize">
                        {t(`roles.${userProfile.role}`)}
                      </p>
                    )}
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {userNavItems.filter(item => item.show).map((item) => (
                  <DropdownMenuItem key={item.name} asChild>
                    <Link href={item.href}>
                      <item.icon className="mr-2 h-4 w-4" />
                      <span>{item.name}</span>
                    </Link>
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>{t('header.logout')}</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="hidden md:flex items-center gap-2">
              <Link href="/login" passHref>
                <Button variant="ghost" size="sm">
                  <LogIn className="mr-2 h-4 w-4" />
                  {t('header.login')}
                </Button>
              </Link>
              <Link href="/signup" passHref>
                <Button size="sm">
                  <UserPlus className="mr-2 h-4 w-4" />
                  {t('header.signup')}
                </Button>
              </Link>
            </div>
          )}

          {/* Mobile Navigation */}
          <Sheet>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" size="icon">
                <Menu className="h-6 w-6" />
                <span className="sr-only">Toggle navigation menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right">
              <div className="flex flex-col gap-4 py-6">
                {navItems.filter(item => item.show === undefined ? true : item.show).map((item) => (
                  <Link key={item.name} href={item.href} className="flex items-center gap-3 text-lg font-medium hover:text-primary">
                    <item.icon className="h-5 w-5" />
                    {item.name}
                  </Link>
                ))}
                <Separator />
                {userNavItems.filter(item => item.show).map((item) => (
                  <Link key={item.name} href={item.href} className="flex items-center gap-3 text-lg font-medium hover:text-primary">
                    <item.icon className="mr-2 h-5 w-5" />
                    {item.name}
                  </Link>
                ))}
                {user && (
                  <Button variant="ghost" className="flex items-center gap-3 text-lg font-medium hover:text-primary justify-start" onClick={handleLogout}>
                    <LogOut className="mr-2 h-5 w-5" />
                    {t('header.logout')}
                  </Button>
                )}
                {!user && (
                  <>
                    <Link href="/login" passHref>
                      <Button variant="ghost" className="flex items-center gap-3 text-lg font-medium hover:text-primary justify-start">
                        <LogIn className="mr-2 h-5 w-5" />
                        {t('header.login')}
                      </Button>
                    </Link>
                    <Link href="/signup" passHref>
                      <Button variant="ghost" className="flex items-center gap-3 text-lg font-medium hover:text-primary justify-start">
                        <UserPlus className="mr-2 h-5 w-5" />
                        {t('header.signup')}
                      </Button>
                    </Link>
                  </>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  )
}
