"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Users, UserCheck, Calendar, MessageSquare, AlertTriangle, Clock, CheckCircle } from 'lucide-react'
import { useAuth } from "@/hooks/useAuth"
import { useRouter } from "next/navigation"
import Link from 'next/link'
import { UsersIcon, CheckCircle2Icon } from 'lucide-react'
import ProtectedRoute from '@/components/auth/ProtectedRoute'

export default function AdminDashboard() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalMentors: 0,
    pendingVerifications: 0,
    activeSessions: 0,
    totalSessions: 0,
    avgRating: 0,
  })

  useEffect(() => {
    // Redirect if not admin
    if (!loading && (!user || user.user_metadata?.role !== "admin")) {
      router.push("/")
    }
  }, [user, loading, router])

  useEffect(() => {
    // Load admin stats
    loadAdminStats()
  }, [])

  const loadAdminStats = async () => {
    // TODO: Implement actual API calls
    setStats({
      totalUsers: 1250,
      totalMentors: 180,
      pendingVerifications: 12,
      activeSessions: 45,
      totalSessions: 2340,
      avgRating: 4.7,
    })
  }

  if (loading) {
    return <div className="container py-8">Loading...</div>
  }

  if (!user || user.user_metadata?.role !== "admin") {
    return null
  }

  return (
    <ProtectedRoute requiredRoles={['admin']}>
      <div className="container mx-auto px-4 py-8 md:py-12">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-50 mb-8 text-center">Painel Administrativo</h1>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Gerenciar Usuários</CardTitle>
              <UsersIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <CardDescription className="mb-4">
                Visualize e edite perfis de usuários, atribua funções e gerencie acessos.
              </CardDescription>
              <Link href="/admin/users" passHref>
                <Button className="w-full">Ir para Gerenciamento de Usuários</Button>
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Verificações de Mentor</CardTitle>
              <CheckCircle2Icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <CardDescription className="mb-4">
                Revise e aprove perfis de mentores pendentes de verificação.
              </CardDescription>
              <Link href="/admin/verifications" passHref>
                <Button className="w-full">Ir para Verificações</Button>
              </Link>
            </CardContent>
          </Card>

          {/* Stats Overview */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Usuários</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalUsers}</div>
              <p className="text-xs text-muted-foreground">+12% from last month</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Mentors</CardTitle>
              <UserCheck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalMentors}</div>
              <p className="text-xs text-muted-foreground">+8% from last month</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Verifications</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.pendingVerifications}</div>
              <p className="text-xs text-muted-foreground">Requires attention</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Sessions</CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalSessions}</div>
              <p className="text-xs text-muted-foreground">Avg rating: {stats.avgRating}</p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common administrative tasks</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button className="h-20 flex flex-col gap-2" onClick={() => router.push("/admin/verifications")}>
              <AlertTriangle className="h-6 w-6" />
              <span>Review Verifications</span>
              <Badge variant="destructive">{stats.pendingVerifications}</Badge>
            </Button>

            <Button variant="outline" className="h-20 flex flex-col gap-2" onClick={() => router.push("/admin/users")}>
              <Users className="h-6 w-6" />
              <span>Manage Users</span>
            </Button>

            <Button
              variant="outline"
              className="h-20 flex flex-col gap-2"
              onClick={() => router.push("/admin/sessions")}
            >
              <Calendar className="h-6 w-6" />
              <span>View Sessions</span>
            </Button>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Tabs defaultValue="verifications" className="w-full">
          <TabsList>
            <TabsTrigger value="verifications">Recent Verifications</TabsTrigger>
            <TabsTrigger value="users">New Users</TabsTrigger>
            <TabsTrigger value="sessions">Recent Sessions</TabsTrigger>
          </TabsList>

          <TabsContent value="verifications" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Pending Mentor Verifications</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <h4 className="font-medium">John Doe</h4>
                        <p className="text-sm text-muted-foreground">Senior Developer at Tech Corp</p>
                        <p className="text-xs text-muted-foreground">Submitted 2 days ago</p>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline">
                          Review
                        </Button>
                        <Button size="sm">Approve</Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="users" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Recently Registered Users</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <h4 className="font-medium">User {i}</h4>
                        <p className="text-sm text-muted-foreground">user{i}@example.com</p>
                        <p className="text-xs text-muted-foreground">Joined today</p>
                      </div>
                      <Badge variant="outline">Mentee</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="sessions" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Recent Mentorship Sessions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <h4 className="font-medium">Session with Mentor {i}</h4>
                        <p className="text-sm text-muted-foreground">Mentee: Student {i}</p>
                        <p className="text-xs text-muted-foreground">Completed 1 hour ago</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">Completed</Badge>
                        <div className="flex">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <CheckCircle key={star} className="h-4 w-4 text-yellow-400" />
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </ProtectedRoute>
  )
}
