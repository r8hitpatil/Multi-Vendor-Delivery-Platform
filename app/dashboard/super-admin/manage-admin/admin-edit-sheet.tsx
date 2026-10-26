"use client"

import { useEffect, useState } from "react"
import { Admin } from "./columns"
import { manageAdmin } from "@/app/api/super-admin/action"
import { Status } from "@/app/generated/prisma/enums"
import { zodResolver } from "@hookform/resolvers/zod"
import { Controller, useForm } from "react-hook-form"
import * as z from "zod"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet"
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Loader2 } from "lucide-react"

const formSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Name must be at least 2 characters long"),
  phone: z
    .string()
    .trim()
    .min(10, "Phone number must be at least 10 characters long"),
  email: z
    .string()
    .trim()
    .email("Invalid email address"),
  status: z
    .nativeEnum(Status, { message: "Please select a valid status" }),
  ban: z
    .boolean(),
})

type FormValues = z.infer<typeof formSchema>

interface AdminEditSheetProps {
  admin: Admin | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

const statusItems = [
  { value: Status.PENDING, label: "PENDING - Awaiting approval" },
  { value: Status.ACCEPTED, label: "ACCEPTED - Verified admin" },
  { value: Status.REJECTED, label: "REJECTED - Access denied" },
]

export function AdminEditSheet({
  admin,
  open,
  onOpenChange,
  onSuccess,
}: AdminEditSheetProps) {
  const [error, setError] = useState("")
  const [successMsg, setSuccessMsg] = useState("")

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      phone: "",
      email: "",
      status: Status.PENDING,
      ban: false,
    },
  })

  // Synchronize form when admin changes
  useEffect(() => {
    if (admin) {
      form.reset({
        name: admin.name ?? "",
        phone: admin.phone ?? "",
        email: admin.email ?? "",
        status: admin.status ?? Status.PENDING,
        ban: admin.ban ?? false,
      })
      setError("")
      setSuccessMsg("")
    }
  }, [admin, form])

  async function onSubmit(data: FormValues) {
    setError("")
    setSuccessMsg("")

    try {
      const res = await manageAdmin({
        name: data.name,
        phone: data.phone,
        email: data.email,
        ban: data.ban,
        status: data.status,
      })

      if (res.success) {
        setSuccessMsg("ADMIN UPDATED SUCCESSFULLY.")
        onSuccess()
        setTimeout(() => {
          onOpenChange(false)
          setSuccessMsg("")
        }, 800)
      } else {
        setError(res.message || "Failed to update admin account")
      }
    } catch (err: any) {
      setError(err?.message || "An unexpected error occurred")
    }
  }

  if (!admin) return null

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-md p-6 flex flex-col justify-between overflow-y-auto rounded-none border-l border-border bg-background"
      >
        <div className="space-y-6">
          <SheetHeader className="text-left space-y-1 p-0">
            <div className="flex items-center gap-2">
              <span className="rounded-none border border-foreground bg-foreground text-background text-[10px] font-mono uppercase font-bold tracking-wider px-2 py-0.5">
                EDIT MODE
              </span>
              <span className="text-xs text-muted-foreground font-mono">
                ID: {admin.id.substring(0, 8)}
              </span>
            </div>
            <SheetTitle className="text-xl font-bold tracking-tight uppercase">
              Edit Administrator
            </SheetTitle>
            <SheetDescription className="text-xs font-mono">
              Modify credentials, verification status, and access rights.
            </SheetDescription>
          </SheetHeader>

          {error && (
            <div className="rounded-none border border-foreground/40 bg-muted/20 p-3 text-xs font-mono text-foreground uppercase">
              {error}
            </div>
          )}

          {successMsg && (
            <div className="rounded-none border border-foreground bg-foreground text-background p-3 text-xs font-mono uppercase font-bold">
              {successMsg}
            </div>
          )}

          <form id="edit-admin-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FieldGroup className="flex flex-col gap-4">
              {/* Name */}
              <Controller
                name="name"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="edit-admin-name" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Full Name
                    </FieldLabel>
                    <Input
                      {...field}
                      id="edit-admin-name"
                      type="text"
                      placeholder="NAME"
                      autoComplete="name"
                      aria-invalid={fieldState.invalid}
                      className="rounded-none border-border text-xs font-mono uppercase"
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />

              {/* Email */}
              <Controller
                name="email"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="edit-admin-email" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Email Address
                    </FieldLabel>
                    <Input
                      {...field}
                      id="edit-admin-email"
                      type="email"
                      readOnly
                      className="rounded-none border-border bg-muted/40 cursor-not-allowed font-mono text-xs text-muted-foreground"
                      aria-invalid={fieldState.invalid}
                    />
                    <p className="text-[11px] text-muted-foreground font-mono mt-0.5">
                      Account email identifies this administrator and is locked for security.
                    </p>
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />

              {/* Phone */}
              <Controller
                name="phone"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="edit-admin-phone" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Phone Number
                    </FieldLabel>
                    <Input
                      {...field}
                      id="edit-admin-phone"
                      type="tel"
                      placeholder="PHONE"
                      autoComplete="tel"
                      aria-invalid={fieldState.invalid}
                      className="rounded-none border-border text-xs font-mono"
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />

              {/* Status Select */}
              <Controller
                name="status"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="edit-admin-status" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Account Status
                    </FieldLabel>
                    <Select
                      name={field.name}
                      value={field.value}
                      onValueChange={field.onChange}
                      items={statusItems}
                    >
                      <SelectTrigger
                        id="edit-admin-status"
                        className="w-full rounded-none border-border text-xs font-mono uppercase"
                        aria-invalid={fieldState.invalid}
                      >
                        <SelectValue placeholder="SELECT STATUS" />
                      </SelectTrigger>
                      <SelectContent className="rounded-none border-border">
                        {statusItems.map((item) => (
                          <SelectItem key={item.value} value={item.value} className="rounded-none text-xs font-mono uppercase">
                            {item.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />

              {/* Ban Checkbox */}
              <Controller
                name="ban"
                control={form.control}
                render={({ field, fieldState }) => (
                  <div className="flex items-start gap-3 rounded-none border border-border p-3.5 bg-muted/20">
                    <Checkbox
                      id="edit-admin-ban"
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      aria-invalid={fieldState.invalid}
                      className="mt-0.5 rounded-none"
                    />
                    <div className="flex flex-col gap-0.5">
                      <label
                        htmlFor="edit-admin-ban"
                        className="text-xs font-mono uppercase font-bold text-foreground cursor-pointer"
                      >
                        Ban administrator account
                      </label>
                      <p className="text-[11px] text-muted-foreground font-mono">
                        When checked, this admin is restricted from accessing the admin portal.
                      </p>
                    </div>
                  </div>
                )}
              />
            </FieldGroup>
          </form>
        </div>

        <SheetFooter className="p-0 pt-6 gap-2 sm:gap-2 flex-row sm:justify-between items-center border-t border-border">
          <Button
            type="button"
            variant="outline"
            className="flex-1 rounded-none border-border text-xs font-mono uppercase"
            onClick={() => form.reset()}
            disabled={form.formState.isSubmitting}
          >
            RESET
          </Button>

          <Button
            type="submit"
            form="edit-admin-form"
            className="flex-1 rounded-none text-xs font-mono uppercase font-semibold"
            disabled={form.formState.isSubmitting}
          >
            {form.formState.isSubmitting ? (
              <>
                <Loader2 className="size-3.5 animate-spin mr-1" />
                SAVING...
              </>
            ) : (
              "SAVE CHANGES"
            )}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
