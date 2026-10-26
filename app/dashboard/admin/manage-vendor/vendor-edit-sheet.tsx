"use client"

import { useEffect, useState } from "react"
import { Vendor } from "./columns"
import { updateVendor } from "@/app/api/admin/action"
import { Status } from "@/app/generated/prisma/enums"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet"
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

interface VendorEditSheetProps {
  vendor: Vendor | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

const statusOptions = [
  { value: Status.ACCEPTED, label: Status.ACCEPTED },
  { value: Status.PENDING, label: Status.PENDING },
  { value: Status.REJECTED, label: Status.REJECTED },
]

export function VendorEditSheet({
  vendor,
  open,
  onOpenChange,
  onSuccess,
}: VendorEditSheetProps) {
  const [status, setStatus] = useState<Status>(Status.PENDING)
  const [ban, setBan] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState("")
  const [successMsg, setSuccessMsg] = useState("")

  useEffect(() => {
    if (vendor) {
      setStatus(vendor.status || Status.PENDING)
      setBan(Boolean(vendor.ban))
      setError("")
      setSuccessMsg("")
    }
  }, [vendor])

  async function handleSave() {
    if (!vendor) return
    setIsSubmitting(true)
    setError("")
    setSuccessMsg("")

    try {
      const res = await updateVendor({
        id: vendor.id,
        status,
        ban,
      })

      if (res.success) {
        setSuccessMsg("VENDOR UPDATED SUCCESSFULLY.")
        onSuccess()
        setTimeout(() => {
          onOpenChange(false)
          setSuccessMsg("")
        }, 800)
      } else {
        setError(res.message || "Failed to update vendor")
      }
    } catch (err: any) {
      setError(err?.message || "An unexpected error occurred")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!vendor) return null

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
                EDIT VENDOR
              </span>
              <span className="text-xs text-muted-foreground font-mono">
                ID: {vendor.id.substring(0, 8)}
              </span>
            </div>
            <SheetTitle className="text-xl font-bold tracking-tight uppercase">
              Manage Vendor
            </SheetTitle>
            <SheetDescription className="text-xs font-mono">
              Update approval status and account authorization for vendor.
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

          <div className="space-y-4">
            {/* Vendor Overview */}
            <div className="rounded-none border border-border p-3.5 bg-muted/20 space-y-1">
              <p className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
                Vendor Name
              </p>
              <p className="font-semibold text-foreground text-sm uppercase">
                {vendor.name}
              </p>
              <p className="text-xs text-muted-foreground font-mono">
                {vendor.email} • {vendor.phone || "No Phone"}
              </p>
            </div>

            {/* Status Select */}
            <div className="space-y-2 rounded-none border border-border p-4 bg-card">
              <label
                htmlFor="edit-vendor-status"
                className="text-xs font-mono uppercase font-bold text-foreground block"
              >
                Approval Status
              </label>
              <Select
                value={status}
                onValueChange={(val) => val && setStatus(val as Status)}
                items={statusOptions}
              >
                <SelectTrigger
                  id="edit-vendor-status"
                  className="w-full rounded-none border-border text-xs font-mono uppercase shadow-none h-9"
                >
                  <SelectValue placeholder="SELECT STATUS" />
                </SelectTrigger>
                <SelectContent className="rounded-none border-border">
                  {statusOptions.map((opt) => (
                    <SelectItem
                      key={opt.value}
                      value={opt.value}
                      className="text-xs font-mono uppercase rounded-none py-1.5"
                    >
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-[11px] text-muted-foreground font-mono">
                Determines whether the vendor can list products and operate in the marketplace.
              </p>
            </div>

            {/* Ban Checkbox */}
            <div className="flex items-start gap-3 rounded-none border border-border p-4 bg-card">
              <Checkbox
                id="edit-vendor-ban"
                checked={ban}
                onCheckedChange={(checked) => setBan(Boolean(checked))}
                className="mt-0.5 rounded-none"
              />
              <div className="flex flex-col gap-0.5">
                <label
                  htmlFor="edit-vendor-ban"
                  className="text-xs font-mono uppercase font-bold text-foreground cursor-pointer"
                >
                  Ban vendor account
                </label>
                <p className="text-[11px] text-muted-foreground font-mono">
                  When enabled, all vendor listings are locked and operations suspended.
                </p>
              </div>
            </div>
          </div>
        </div>

        <SheetFooter className="p-0 pt-6 gap-2 sm:gap-2 flex-row sm:justify-between items-center border-t border-border">
          <Button
            type="button"
            variant="outline"
            className="flex-1 rounded-none border-border text-xs font-mono uppercase"
            onClick={() => {
              if (vendor) {
                setStatus(vendor.status || Status.PENDING)
                setBan(Boolean(vendor.ban))
              }
            }}
            disabled={isSubmitting}
          >
            RESET
          </Button>

          <Button
            type="button"
            className="flex-1 rounded-none text-xs font-mono uppercase font-semibold"
            disabled={isSubmitting}
            onClick={handleSave}
          >
            {isSubmitting ? (
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
