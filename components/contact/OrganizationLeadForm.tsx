"use client"

import { MenvoDots } from "@/components/ui/menvo-loader"
import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useTranslations, useLocale } from "next-intl"
import { CheckCircle2 } from "lucide-react"
import { Link } from "@/i18n/routing"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { organizationLeadSchema, OrganizationLeadInput } from "@/lib/schemas/organization-lead"

export function OrganizationLeadForm() {
  const t = useTranslations("contact.organizationForm")
  const locale = useLocale()
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle")
  const [errorMsg, setErrorMsg] = useState("")

  const form = useForm<OrganizationLeadInput>({
    resolver: zodResolver(organizationLeadSchema),
    defaultValues: {
      org_name: "",
      org_type: "company",
      contact_name: "",
      contact_email: "",
      contact_phone: "",
      people_estimate: "1-20",
      message: "",
      website: "",
      locale: locale as any,
    }
  })

  async function onSubmit(data: OrganizationLeadInput) {
    setStatus("submitting")
    setErrorMsg("")
    try {
      const res = await fetch("/api/contact/organization", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      })

      if (res.status === 429) {
        setStatus("error")
        setErrorMsg(t("rateLimitError"))
        return
      }

      if (!res.ok) {
        throw new Error("Failed to submit")
      }

      setStatus("success")
    } catch (err) {
      console.error(err)
      setStatus("error")
      setErrorMsg(t("genericError"))
    }
  }

  if (status === "success") {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center space-y-4">
        <CheckCircle2 className="w-16 h-16 text-green-500" />
        <h3 className="text-2xl font-bold">{t("successTitle")}</h3>
        <p className="text-muted-foreground">{t("successMessage")}</p>
      </div>
    )
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      <input type="text" className="hidden" tabIndex={-1} autoComplete="off" aria-hidden="true" {...form.register("website")} />

      {status === "error" && (
        <div className="p-4 bg-destructive/10 text-destructive rounded-md text-sm">
          {errorMsg}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="org_name">{t("fields.orgName")}</Label>
          <Input id="org_name" {...form.register("org_name")} />
          {form.formState.errors.org_name && <p className="text-sm text-destructive">{t("errors.orgName")}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="org_type">{t("fields.orgType")}</Label>
          <Select onValueChange={(v: any) => form.setValue("org_type", v)} defaultValue={form.getValues("org_type")}>
            <SelectTrigger id="org_type">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ngo">{t("types.ngo")}</SelectItem>
              <SelectItem value="company">{t("types.company")}</SelectItem>
              <SelectItem value="school">{t("types.school")}</SelectItem>
              <SelectItem value="event">{t("types.event")}</SelectItem>
              <SelectItem value="other">{t("types.other")}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="contact_name">{t("fields.contactName")}</Label>
          <Input id="contact_name" {...form.register("contact_name")} />
          {form.formState.errors.contact_name && <p className="text-sm text-destructive">{t("errors.contactName")}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="contact_email">{t("fields.contactEmail")}</Label>
          <Input id="contact_email" type="email" {...form.register("contact_email")} />
          {form.formState.errors.contact_email && <p className="text-sm text-destructive">{t("errors.contactEmail")}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="contact_phone">{t("fields.contactPhone")}</Label>
          <Input id="contact_phone" type="tel" {...form.register("contact_phone")} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="people_estimate">{t("fields.peopleEstimate")}</Label>
          <Select onValueChange={(v: any) => form.setValue("people_estimate", v)} defaultValue={form.getValues("people_estimate")}>
            <SelectTrigger id="people_estimate">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1-20">1 - 20 {t("people")}</SelectItem>
              <SelectItem value="21-100">21 - 100 {t("people")}</SelectItem>
              <SelectItem value="101-500">101 - 500 {t("people")}</SelectItem>
              <SelectItem value="500+">500+ {t("people")}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="message">{t("fields.message")}</Label>
        <Textarea id="message" {...form.register("message")} className="min-h-[100px]" />
      </div>

      <Button type="submit" className="w-full" disabled={status === "submitting"}>
        {status === "submitting" ? <MenvoDots className="mr-2" /> : null}
        {t("submitButton")}
      </Button>

      <p className="text-xs text-center text-muted-foreground mt-4">
        {t("privacyNote")}{" "}
        <Link href="/privacy" className="underline hover:text-foreground">
          {t("privacyLink")}
        </Link>
      </p>
    </form>
  )
}
