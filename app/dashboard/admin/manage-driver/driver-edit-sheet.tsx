"use client"

import { useEffect, useState } from "react"
import { Driver } from "./columns"
import { manageDriver } from "@/app/api/admin/action"
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
import { Loader2 } from "lucide-react"

interface DriverEditSheetProps {
  driver: Driver | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function DriverEditSheet({
  driver,
  open,
  onOpenChange,
  onSuccess,
}: DriverEditSheetProps) {
  const [ban, setBan] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState("")
  const [successMsg, setSuccessMsg] = useState("")

  useEffect(() => {
    if (driver) {
      setBan(Boolean(driver.ban))
      setError("")
      setSuccessMsg("")
    }
  }, [driver])

  async function handleSave() {
    if (!driver) return
    setIsSubmitting(true)
    setError("")
    setSuccessMsg("")

    try {
      const res = await manageDriver({
        id: driver.id,
        ban,
      })

      if (res.success) {
        setSuccessMsg("DRIVER UPDATED SUCCESSFULLY.")
        onSuccess()
        setTimeout(() => {
          onOpenChange(false)
          setSuccessMsg("")
        }, 800)
      } else {
        setError(res.message || "Failed to update driver access")
      }
    } catch (err: any) {
      setError(err?.message || "An unexpected error occurred")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!driver) return null

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
                EDIT ACCESS
              </span>
              <span className="text-xs text-muted-foreground font-mono">
                ID: {driver.id.substring(0, 8)}
              </span>
            </div>
            <SheetTitle className="text-xl font-bold tracking-tight uppercase">
              Manage Driver
            </SheetTitle>
            <SheetDescription className="text-xs font-mono">
              Modify driver platform access and account authorization.
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
            {/* Driver Overview */}
            <div className="rounded-none border border-border p-3.5 bg-muted/20 space-y-1">
              <p className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
                Driver Name
              </p>
              <p className="font-semibold text-foreground text-sm uppercase">
                {driver.name}
              </p>
              <p className="text-xs text-muted-foreground font-mono">
                {driver.email} • {driver.phone || "No Phone"}
              </p>
            </div>

            {/* Ban Checkbox */}
            <div className="flex items-start gap-3 rounded-none border border-border p-4 bg-card">
              <Checkbox
                id="edit-driver-ban"
                checked={ban}
                onCheckedChange={(checked) => setBan(Boolean(checked))}
                className="mt-0.5 rounded-none"
              />
              <div className="flex flex-col gap-0.5">
                <label
                  htmlFor="edit-driver-ban"
                  className="text-xs font-mono uppercase font-bold text-foreground cursor-pointer"
                >
                  Ban driver account
                </label>
                <p className="text-[11px] text-muted-foreground font-mono">
                  When enabled, this delivery driver will be restricted from accepting orders.
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
            onClick={() => setBan(Boolean(driver?.ban))}
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
