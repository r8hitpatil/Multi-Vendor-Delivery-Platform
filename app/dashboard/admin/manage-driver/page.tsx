"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { getDrivers } from "@/app/api/admin/action"
import { Driver, getColumns } from "./columns"
import { DataTable } from "./data-table"
import { DriverViewSheet } from "./driver-view-sheet"
import { DriverEditSheet } from "./driver-edit-sheet"
import { Card, CardContent } from "@/components/ui/card"
import { buttonVariants } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "cn"

export default function ManageDriverPage() {
  const [drivers, setDrivers] = useState<Driver[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")

  // View / Edit mode and selected driver states
  const [mode, setMode] = useState<"view" | "edit">("view")
  const [viewDriver, setViewDriver] = useState<Driver | null>(null)
  const [isViewOpen, setIsViewOpen] = useState(false)
  const [editDriver, setEditDriver] = useState<Driver | null>(null)
  const [isEditOpen, setIsEditOpen] = useState(false)

  const loadDrivers = async () => {
    setIsLoading(true)
    setError("")
    try {
      const res = await getDrivers()
      if (res.success && res.data) {
        setDrivers(res.data as unknown as Driver[])
      } else {
        setDrivers([])
        if (res.message && res.message !== "Driver details not available") {
          setError(res.message)
        }
      }
    } catch (err: any) {
      setError(err?.message || "Failed to load drivers")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadDrivers()
  }, [])

  const handleView = (driver: Driver) => {
    setViewDriver(driver)
    setIsViewOpen(true)
  }

  const handleEdit = (driver: Driver) => {
    setEditDriver(driver)
    setIsEditOpen(true)
  }

  const handleRowClick = (driver: Driver) => {
    if (mode === "edit") {
      handleEdit(driver)
    } else {
      handleView(driver)
    }
  }

  const columns = useMemo(
    () =>
      getColumns({
        onEdit: handleEdit,
        onView: handleView,
        mode,
      }),
    [mode]
  )

  const stats = useMemo(() => {
    const total = drivers.length
    const active = drivers.filter((d) => !d.ban).length
    const banned = drivers.filter((d) => d.ban).length

    return { total, active, banned }
  }, [drivers])

  return (
    <div className="w-full space-y-5 max-w-5xl mx-auto min-w-0">
      {/* Page Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-border pb-4">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-foreground uppercase">
              Manage Drivers
            </h1>
            <Badge
              variant="outline"
              className="rounded-none text-[11px] font-mono uppercase tracking-wider border-foreground/30 px-1.5 py-0.5 shrink-0"
            >
              Company Admin
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground">
            View driver roster, credentials, and manage account delivery access.
          </p>
        </div>

        <div>
          <Link
            href="/dashboard/admin/create-driver"
            className={cn(
              buttonVariants({ variant: "default" }),
              "h-9 px-4 rounded-none text-xs font-mono uppercase tracking-wider font-semibold shadow-none whitespace-nowrap"
            )}
          >
            Create Driver
          </Link>
        </div>
      </div>

      {/* Global Error Notice if any */}
      {error && (
        <div className="rounded-none border border-foreground/30 bg-muted/20 p-3 text-xs font-mono text-foreground uppercase">
          {error}
        </div>
      )}

      {/* Top Metric Cards */}
      <div className="grid grid-cols-3 gap-2.5 sm:gap-4">
        <Card className="rounded-none border border-border shadow-none bg-card">
          <CardContent className="p-4 space-y-1">
            <p className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Total Drivers
            </p>
            <p className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground font-mono">
              {isLoading ? "—" : stats.total}
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-none border border-border shadow-none bg-card">
          <CardContent className="p-4 space-y-1">
            <p className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Active Drivers
            </p>
            <p className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground font-mono">
              {isLoading ? "—" : stats.active}
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-none border border-border shadow-none bg-card">
          <CardContent className="p-4 space-y-1">
            <p className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Banned Drivers
            </p>
            <p className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground font-mono">
              {isLoading ? "—" : stats.banned}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Data Table */}
      <DataTable
        columns={columns}
        data={drivers}
        isLoading={isLoading}
        onRefresh={loadDrivers}
        mode={mode}
        onToggleMode={setMode}
        onRowClick={handleRowClick}
      />

      {/* View-Only Driver Details Sheet */}
      <DriverViewSheet
        driver={viewDriver}
        open={isViewOpen}
        onOpenChange={setIsViewOpen}
        onEdit={(driver) => {
          setIsViewOpen(false)
          handleEdit(driver)
        }}
      />

      {/* Editable Driver Access Sheet */}
      <DriverEditSheet
        driver={editDriver}
        open={isEditOpen}
        onOpenChange={setIsEditOpen}
        onSuccess={loadDrivers}
      />
    </div>
  )
}