"use client"

import { useState } from "react"
import { Driver } from "./columns"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetFooter,
  SheetClose,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Copy, Check } from "lucide-react"

interface DriverViewSheetProps {
  driver: Driver | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onEdit: (driver: Driver) => void
}

export function DriverViewSheet({
  driver,
  open,
  onOpenChange,
  onEdit,
}: DriverViewSheetProps) {
  const [copiedField, setCopiedField] = useState<string | null>(null)

  if (!driver) return null

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text)
    setCopiedField(field)
    setTimeout(() => setCopiedField(null), 2000)
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-md p-6 flex flex-col justify-between overflow-y-auto rounded-none border-l border-border bg-background"
      >
        <div className="space-y-6">
          <SheetHeader className="text-left space-y-1 p-0">
            <div className="flex items-center gap-2">
              <span className="rounded-none border border-foreground/30 px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider text-foreground">
                VIEW ONLY
              </span>
              {driver.ban ? (
                <span className="rounded-none border border-foreground bg-foreground text-background px-2 py-0.5 text-[10px] font-mono uppercase font-bold tracking-wider">
                  BANNED
                </span>
              ) : (
                <span className="rounded-none border border-foreground/30 px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider text-foreground">
                  ACTIVE
                </span>
              )}
            </div>
            <SheetTitle className="text-xl font-bold tracking-tight uppercase">
              Driver Record
            </SheetTitle>
            <SheetDescription className="text-xs font-mono">
              System metadata for delivery driver account.
            </SheetDescription>
          </SheetHeader>

          {/* Profile Overview Banner */}
          <div className="rounded-none border border-border bg-muted/20 p-4 space-y-1">
            <p className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
              Driver Name
            </p>
            <h3 className="font-bold text-foreground text-lg uppercase tracking-tight">
              {driver.name}
            </h3>
            <p className="text-xs text-muted-foreground font-mono">{driver.email}</p>
          </div>

          <Separator className="rounded-none" />

          {/* Metadata list */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Driver Information
            </h4>

            <div className="rounded-none border border-border divide-y divide-border bg-card">
              {/* ID */}
              <div className="flex items-center justify-between p-3 text-xs font-mono">
                <span className="text-muted-foreground uppercase">ID</span>
                <div className="flex items-center gap-1.5">
                  <span className="text-foreground max-w-[160px] truncate">
                    {driver.id}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    className="size-6 rounded-none text-muted-foreground hover:text-foreground"
                    onClick={() => copyToClipboard(driver.id, "id")}
                    title="Copy ID"
                  >
                    {copiedField === "id" ? (
                      <Check className="size-3" />
                    ) : (
                      <Copy className="size-3" />
                    )}
                  </Button>
                </div>
              </div>

              {/* Email */}
              <div className="flex items-center justify-between p-3 text-xs font-mono">
                <span className="text-muted-foreground uppercase">EMAIL</span>
                <div className="flex items-center gap-1.5">
                  <span className="text-foreground max-w-[170px] truncate">
                    {driver.email}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    className="size-6 rounded-none text-muted-foreground hover:text-foreground"
                    onClick={() => copyToClipboard(driver.email, "email")}
                    title="Copy Email"
                  >
                    {copiedField === "email" ? (
                      <Check className="size-3" />
                    ) : (
                      <Copy className="size-3" />
                    )}
                  </Button>
                </div>
              </div>

              {/* Phone */}
              <div className="flex items-center justify-between p-3 text-xs font-mono">
                <span className="text-muted-foreground uppercase">PHONE</span>
                <div className="flex items-center gap-1.5">
                  <span className="text-foreground">{driver.phone || "—"}</span>
                  {driver.phone && (
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      className="size-6 rounded-none text-muted-foreground hover:text-foreground"
                      onClick={() => copyToClipboard(driver.phone, "phone")}
                      title="Copy Phone"
                    >
                      {copiedField === "phone" ? (
                        <Check className="size-3" />
                      ) : (
                        <Copy className="size-3" />
                      )}
                    </Button>
                  )}
                </div>
              </div>

              {/* Aadhar */}
              <div className="flex items-center justify-between p-3 text-xs font-mono">
                <span className="text-muted-foreground uppercase">AADHAR</span>
                <span className="text-foreground">{driver.aadhar || "—"}</span>
              </div>

              {/* PAN */}
              <div className="flex items-center justify-between p-3 text-xs font-mono">
                <span className="text-muted-foreground uppercase">PAN</span>
                <span className="text-foreground uppercase">{driver.pan || "—"}</span>
              </div>

              {/* Access State */}
              <div className="flex items-center justify-between p-3 text-xs font-mono">
                <span className="text-muted-foreground uppercase">ACCESS</span>
                <span
                  className={
                    driver.ban
                      ? "border border-foreground bg-foreground text-background px-1.5 py-0.5 font-bold uppercase"
                      : "border border-foreground/30 px-1.5 py-0.5 uppercase"
                  }
                >
                  {driver.ban ? "BANNED" : "ACTIVE"}
                </span>
              </div>
            </div>
          </div>
        </div>

        <SheetFooter className="p-0 pt-6 gap-2 sm:gap-2 flex-row sm:justify-between items-center border-t border-border">
          <SheetClose render={<Button variant="outline" className="flex-1 rounded-none border-border text-xs font-mono uppercase" />}>
            CLOSE
          </SheetClose>
          <Button
            className="flex-1 rounded-none text-xs font-mono uppercase font-semibold"
            onClick={() => {
              onOpenChange(false)
              onEdit(driver)
            }}
          >
            EDIT DRIVER
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
