"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Calendar, User, CheckCircle, XCircle, Eye } from "lucide-react"
import { useAuth } from "@/hooks/useAuth"
import { VerificationService } from "@/services/verifications"

export default function VerificationsPage() {
  const { user } = useAuth()
  const [verifications, setVerifications] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedVerification, setSelectedVerification] = useState(null)

  useEffect(() => {
    loadVerifications()
  }, [])

  const loadVerifications = async () => {
    try {
      if (user?.id) {
        const data = await VerificationService.getPendingVerifications(user.id)
        setVerifications(data)
      }
    } catch (error) {
      console.error("Error loading verifications:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async (verificationId: string) => {
    try {
      await VerificationService.completeVerification({
        verificationId,
        adminId: user!.id,
        passed: true,
        notes: "Verification completed successfully",
      })
      loadVerifications()
    } catch (error) {
      console.error("Error approving verification:", error)
    }
  }

  const handleReject = async (verificationId: string, reason: string) => {
    try {
      await VerificationService.completeVerification({
        verificationId,
        adminId: user!.id,
        passed: false,
        notes: reason,
      })
      loadVerifications()
    } catch (error) {
      console.error("Error rejecting verification:", error)
    }
  }

  if (loading) {
    return <div className="container py-8">Loading verifications...</div>
  }

  return (
    <div className="container py-8 md:py-12">
      <div className="flex flex-col space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Mentor Verifications</h1>
          <p className="text-muted-foreground">Review and approve mentor applications</p>
        </div>

        <Tabs defaultValue="pending" className="w-full">
          <TabsList>
            <TabsTrigger value="pending">Pending ({verifications.length})</TabsTrigger>
            <TabsTrigger value="scheduled">Scheduled</TabsTrigger>
            <TabsTrigger value="completed">Completed</TabsTrigger>
          </TabsList>

          <TabsContent value="pending" className="space-y-4">
            {verifications.length === 0 ? (
              <Card>
                <CardContent className="flex items-center justify-center h-48">
                  <div className="text-center">
                    <CheckCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No pending verifications</p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {verifications.map((verification) => (
                  <Card key={verification.verification_id}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-4">
                          <Avatar className="h-12 w-12">
                            <AvatarImage src="/placeholder.svg" />
                            <AvatarFallback>
                              {verification.mentor_name
                                .split(" ")
                                .map((n) => n[0])
                                .join("")}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <CardTitle className="text-xl">{verification.mentor_name}</CardTitle>
                            <CardDescription>{verification.mentor_title}</CardDescription>
                            <p className="text-sm text-muted-foreground">{verification.mentor_company}</p>
                          </div>
                        </div>
                        <Badge variant="outline">{verification.verification_type}</Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          <span>Applied {new Date(verification.created_at).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <User className="h-4 w-4" />
                          <span>{verification.mentor_email}</span>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm">
                              <Eye className="h-4 w-4 mr-2" />
                              Review Details
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl">
                            <DialogHeader>
                              <DialogTitle>Verification Details</DialogTitle>
                              <DialogDescription>Review mentor application and documents</DialogDescription>
                            </DialogHeader>
                            <VerificationDetails verification={verification} />
                          </DialogContent>
                        </Dialog>

                        <Button size="sm" onClick={() => handleApprove(verification.verification_id)}>
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Approve
                        </Button>

                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="destructive" size="sm">
                              <XCircle className="h-4 w-4 mr-2" />
                              Reject
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Reject Verification</DialogTitle>
                              <DialogDescription>Please provide a reason for rejection</DialogDescription>
                            </DialogHeader>
                            <RejectForm onReject={(reason) => handleReject(verification.verification_id, reason)} />
                          </DialogContent>
                        </Dialog>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="scheduled">
            <Card>
              <CardContent className="flex items-center justify-center h-48">
                <p className="text-muted-foreground">Scheduled verifications will appear here</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="completed">
            <Card>
              <CardContent className="flex items-center justify-center h-48">
                <p className="text-muted-foreground">Completed verifications will appear here</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

function VerificationDetails({ verification }) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label className="text-sm font-medium">Name</Label>
          <p className="text-sm">{verification.mentor_name}</p>
        </div>
        <div>
          <Label className="text-sm font-medium">Email</Label>
          <p className="text-sm">{verification.mentor_email}</p>
        </div>
        <div>
          <Label className="text-sm font-medium">Title</Label>
          <p className="text-sm">{verification.mentor_title}</p>
        </div>
        <div>
          <Label className="text-sm font-medium">Company</Label>
          <p className="text-sm">{verification.mentor_company}</p>
        </div>
      </div>

      <div>
        <Label className="text-sm font-medium">Documents</Label>
        <div className="mt-2 space-y-2">
          <div className="flex items-center space-x-2">
            <Checkbox id="resume" defaultChecked />
            <Label htmlFor="resume" className="text-sm">
              Resume/CV
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox id="linkedin" defaultChecked />
            <Label htmlFor="linkedin" className="text-sm">
              LinkedIn Profile
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox id="portfolio" />
            <Label htmlFor="portfolio" className="text-sm">
              Portfolio (Optional)
            </Label>
          </div>
        </div>
      </div>
    </div>
  )
}

function RejectForm({ onReject }) {
  const [reason, setReason] = useState("")

  const handleSubmit = (e) => {
    e.preventDefault()
    if (reason.trim()) {
      onReject(reason)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="reason">Reason for rejection</Label>
        <Textarea
          id="reason"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Please provide a detailed reason for rejection..."
          required
        />
      </div>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline">
          Cancel
        </Button>
        <Button type="submit" variant="destructive">
          Reject Application
        </Button>
      </div>
    </form>
  )
}
