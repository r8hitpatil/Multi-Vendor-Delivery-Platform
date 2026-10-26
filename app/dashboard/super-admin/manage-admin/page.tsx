"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { dropAdmins } from "@/app/api/super-admin/action"
import { Status } from "@/app/generated/prisma/enums"
import { Admin, getColumns } from "./columns"
import { DataTable } from "./data-table"
import { AdminViewSheet } from "./admin-view-sheet"
import { AdminEditSheet } from "./admin-edit-sheet"
import { Card, CardContent } from "@/components/ui/card"
import { buttonVariants } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "cn"

export default function ManageAdminPage() {
  const [admins, setAdmins] = useState<Admin[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")

  // View / Edit mode and selected admin states
  const [mode, setMode] = useState<"view" | "edit">("view")
  const [viewAdmin, setViewAdmin] = useState<Admin | null>(null)
  const [isViewOpen, setIsViewOpen] = useState(false)
  const [editAdmin, setEditAdmin] = useState<Admin | null>(null)
  const [isEditOpen, setIsEditOpen] = useState(false)

  // Fetch all admins
  const loadAdmins = async () => {
    setIsLoading(true)
    setError("")
    try {
      const res = await dropAdmins()
      if (res.success && res.data) {
        setAdmins(res.data as unknown as Admin[])
      } else {
        setAdmins([])
        if (res.message && res.message !== "No admins found") {
          setError(res.message)
        }
      }
    } catch (err: any) {
      setError(err?.message || "Failed to load administrators")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadAdmins()
  }, [])

  const handleView = (admin: Admin) => {
    setViewAdmin(admin)
    setIsViewOpen(true)
  }

  const handleEdit = (admin: Admin) => {
    setEditAdmin(admin)
    setIsEditOpen(true)
  }

  const handleRowClick = (admin: Admin) => {
    if (mode === "edit") {
      handleEdit(admin)
    } else {
      handleView(admin)
    }
  }

  // Column definitions with action handlers
  const columns = useMemo(
    () =>
      getColumns({
        onEdit: handleEdit,
        onView: handleView,
        mode,
      }),
    [mode]
  )

  // Metrics computation for stats cards
  const stats = useMemo(() => {
    const total = admins.length
    const accepted = admins.filter((a) => a.status === Status.ACCEPTED && !a.ban).length
    const pending = admins.filter((a) => a.status === Status.PENDING).length
    const banned = admins.filter((a) => a.ban).length

    return { total, accepted, pending, banned }
  }, [admins])

  return (
    <div className="w-full space-y-5 max-w-5xl mx-auto min-w-0">
      {/* Page Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-border pb-4">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-foreground uppercase">
              Manage Administrators
            </h1>
            <Badge
              variant="outline"
              className="rounded-none text-[11px] font-mono uppercase tracking-wider border-foreground/30 px-1.5 py-0.5 shrink-0"
            >
              Super Admin
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Explore, filter, and manage platform administrator profiles, approval statuses, and account access.
          </p>
        </div>

        <div>
          <Link
            href="/dashboard/super-admin/create-admin"
            className={cn(
              buttonVariants({ variant: "default" }),
              "h-9 px-4 rounded-none text-xs font-mono uppercase tracking-wider font-semibold shadow-none whitespace-nowrap"
            )}
          >
            Create Admin
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
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
        <Card className="rounded-none border border-border shadow-none bg-card">
          <CardContent className="p-4 space-y-1">
            <p className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Total Admins
            </p>
            <p className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground font-mono">
              {isLoading ? "—" : stats.total}
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-none border border-border shadow-none bg-card">
          <CardContent className="p-4 space-y-1">
            <p className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Active Admins
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

      {/* Main Shadcn Data Table Container */}
      <DataTable
        columns={columns}
        data={admins}
        isLoading={isLoading}
        onRefresh={loadAdmins}
        mode={mode}
        onToggleMode={setMode}
        onRowClick={handleRowClick}
      />

      {/* View-Only Admin Details Slide-Over Sheet */}
      <AdminViewSheet
        admin={viewAdmin}
        open={isViewOpen}
        onOpenChange={setIsViewOpen}
        onEdit={(admin) => {
          setIsViewOpen(false)
          handleEdit(admin)
        }}
      />

      {/* Editable Admin Account Slide-Over Sheet */}
      <AdminEditSheet
        admin={editAdmin}
        open={isEditOpen}
        onOpenChange={setIsEditOpen}
        onSuccess={loadAdmins}
      />
    </div>
  )
}