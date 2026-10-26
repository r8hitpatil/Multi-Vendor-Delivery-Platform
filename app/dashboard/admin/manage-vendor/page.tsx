"use client"

import { useEffect, useMemo, useState } from "react"
import { getVendors } from "@/app/api/admin/action"
import { Status } from "@/app/generated/prisma/enums"
import { Vendor, getColumns } from "./columns"
import { DataTable } from "./data-table"
import { VendorViewSheet } from "./vendor-view-sheet"
import { VendorEditSheet } from "./vendor-edit-sheet"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export default function ManageVendorPage() {
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")

  // View / Edit mode and selected vendor states
  const [mode, setMode] = useState<"view" | "edit">("view")
  const [viewVendor, setViewVendor] = useState<Vendor | null>(null)
  const [isViewOpen, setIsViewOpen] = useState(false)
  const [editVendor, setEditVendor] = useState<Vendor | null>(null)
  const [isEditOpen, setIsEditOpen] = useState(false)

  const loadVendors = async () => {
    setIsLoading(true)
    setError("")
    try {
      const res = await getVendors()
      if (res.success && res.data) {
        setVendors(res.data as unknown as Vendor[])
      } else {
        setVendors([])
        if (res.message && res.message !== "No vendors found") {
          setError(res.message)
        }
      }
    } catch (err: any) {
      setError(err?.message || "Failed to load vendors")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadVendors()
  }, [])

  const handleView = (vendor: Vendor) => {
    setViewVendor(vendor)
    setIsViewOpen(true)
  }

  const handleEdit = (vendor: Vendor) => {
    setEditVendor(vendor)
    setIsEditOpen(true)
  }

  const handleRowClick = (vendor: Vendor) => {
    if (mode === "edit") {
      handleEdit(vendor)
    } else {
      handleView(vendor)
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
    const total = vendors.length
    const accepted = vendors.filter((v) => v.status === Status.ACCEPTED).length
    const pending = vendors.filter((v) => v.status === Status.PENDING).length
    const banned = vendors.filter((v) => v.ban).length

    return { total, accepted, pending, banned }
  }, [vendors])

  return (
    <div className="w-full space-y-5 max-w-5xl mx-auto min-w-0">
      {/* Page Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-border pb-4">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-foreground uppercase">
              Manage Vendors
            </h1>
            <Badge
              variant="outline"
              className="rounded-none text-[11px] font-mono uppercase tracking-wider border-foreground/30 px-1.5 py-0.5 shrink-0"
            >
              Company Admin
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Review vendor applications, store access, and operational statuses.
          </p>
        </div>
      </div>

      {/* Global Error Notice if any */}
      {error && (
        <div className="rounded-none border border-foreground/30 bg-muted/20 p-3 text-xs font-mono text-foreground uppercase">
          {error}
        </div>
      )}

      {/* Top Metric Cards (Black & White, No Rounded Corners, No decorative icons) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-4">
        <Card className="rounded-none border border-border shadow-none bg-card">
          <CardContent className="p-4 space-y-1">
            <p className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Total Vendors
            </p>
            <p className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground font-mono">
              {isLoading ? "—" : stats.total}
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-none border border-border shadow-none bg-card">
          <CardContent className="p-4 space-y-1">
            <p className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Accepted Vendors
            </p>
            <p className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground font-mono">
              {isLoading ? "—" : stats.accepted}
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-none border border-border shadow-none bg-card">
          <CardContent className="p-4 space-y-1">
            <p className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Pending Review
            </p>
            <p className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground font-mono">
              {isLoading ? "—" : stats.pending}
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-none border border-border shadow-none bg-card">
          <CardContent className="p-4 space-y-1">
            <p className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Banned Accounts
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
        data={vendors}
        isLoading={isLoading}
        onRefresh={loadVendors}
        mode={mode}
        onToggleMode={setMode}
        onRowClick={handleRowClick}
      />

      {/* View-Only Vendor Details Sheet */}
      <VendorViewSheet
        vendor={viewVendor}
        open={isViewOpen}
        onOpenChange={setIsViewOpen}
        onEdit={(vendor) => {
          setIsViewOpen(false)
          handleEdit(vendor)
        }}
      />

      {/* Editable Vendor Status & Ban Sheet */}
      <VendorEditSheet
        vendor={editVendor}
        open={isEditOpen}
        onOpenChange={setIsEditOpen}
        onSuccess={loadVendors}
      />
    </div>
  )
}