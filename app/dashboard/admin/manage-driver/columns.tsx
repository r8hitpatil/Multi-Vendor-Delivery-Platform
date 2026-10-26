"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Button } from "@/components/ui/button"
import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react"
import { cn } from "cn"

export type Driver = {
  id: string
  name: string
  email: string
  phone: string
  ban: boolean
  aadhar?: string | null
  pan?: string | null
  companyId?: string | null
  createdAt?: string | Date
}

interface GetColumnsOptions {
  onEdit: (driver: Driver) => void
  onView: (driver: Driver) => void
  mode?: "view" | "edit"
}

export function getColumns({ onEdit, onView, mode = "view" }: GetColumnsOptions): ColumnDef<Driver>[] {
  return [
    {
      accessorKey: "name",
      header: ({ column }) => {
        const isSorted = column.getIsSorted()
        return (
          <Button
            variant="ghost"
            size="sm"
            className="-ml-2 h-8 px-2 text-xs font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground hover:bg-transparent rounded-none"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            <span>DRIVER</span>
            {isSorted === "asc" ? (
              <ArrowUp className="ml-1.5 size-3" />
            ) : isSorted === "desc" ? (
              <ArrowDown className="ml-1.5 size-3" />
            ) : (
              <ArrowUpDown className="ml-1.5 size-3 opacity-40" />
            )}
          </Button>
        )
      },
      cell: ({ row }) => {
        const driver = row.original
        return (
          <div className="flex flex-col py-0.5 space-y-0.5">
            <span className="font-semibold text-foreground text-sm uppercase tracking-tight truncate max-w-[180px]">
              {driver.name}
            </span>
            <span className="text-xs text-muted-foreground font-mono">
              ID: {driver.id.substring(0, 8)}
            </span>
          </div>
        )
      },
    },
    {
      accessorKey: "email",
      header: ({ column }) => {
        const isSorted = column.getIsSorted()
        return (
          <Button
            variant="ghost"
            size="sm"
            className="-ml-2 h-8 px-2 text-xs font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground hover:bg-transparent rounded-none"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            <span>EMAIL</span>
            {isSorted === "asc" ? (
              <ArrowUp className="ml-1.5 size-3" />
            ) : isSorted === "desc" ? (
              <ArrowDown className="ml-1.5 size-3" />
            ) : (
              <ArrowUpDown className="ml-1.5 size-3 opacity-40" />
            )}
          </Button>
        )
      },
      cell: ({ row }) => {
        return (
          <div className="text-xs sm:text-sm text-foreground font-mono truncate max-w-[210px]">
            {row.getValue("email")}
          </div>
        )
      },
    },
    {
      accessorKey: "phone",
      header: () => (
        <span className="inline-flex h-8 items-center px-0 text-xs font-bold uppercase tracking-wider text-muted-foreground">
          PHONE
        </span>
      ),
      cell: ({ row }) => {
        const phone = row.getValue("phone") as string
        return (
          <div className="font-mono text-xs sm:text-sm text-muted-foreground tabular-nums">
            {phone || "—"}
          </div>
        )
      },
    },
    {
      accessorKey: "ban",
      header: () => (
        <span className="inline-flex h-8 items-center px-0 text-xs font-bold uppercase tracking-wider text-muted-foreground">
          ACCESS
        </span>
      ),
      cell: ({ row }) => {
        const isBanned = row.getValue("ban") as boolean

        return (
          <span
            className={cn(
              "inline-flex items-center rounded-none px-2 py-0.5 text-xs font-mono font-medium uppercase tracking-wide",
              isBanned
                ? "border border-foreground bg-foreground text-background font-bold"
                : "border border-foreground/30 text-foreground"
            )}
          >
            {isBanned ? "BANNED" : "ACTIVE"}
          </span>
        )
      },
      filterFn: (row, id, value) => {
        if (!value || value === "ALL") return true
        if (value === "BANNED") return row.getValue(id) === true
        if (value === "ACTIVE") return row.getValue(id) === false
        return true
      },
    },
    {
      id: "actions",
      header: () => (
        <span className="inline-flex h-8 w-full items-center justify-end pr-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
          ACTIONS
        </span>
      ),
      cell: ({ row }) => {
        const driver = row.original

        return (
          <div className="flex items-center justify-end gap-1.5 pr-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2.5 rounded-none text-xs font-mono uppercase text-muted-foreground hover:text-foreground hover:bg-muted"
              onClick={() => onView(driver)}
            >
              View
            </Button>

            <Button
              variant={mode === "edit" ? "default" : "outline"}
              size="sm"
              className="h-7 px-2.5 rounded-none text-xs font-mono uppercase font-semibold border-foreground/30"
              onClick={() => onEdit(driver)}
            >
              Edit
            </Button>
          </div>
        )
      },
    },
  ]
}
