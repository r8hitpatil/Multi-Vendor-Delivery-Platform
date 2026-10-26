"use client"

import * as React from "react"
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "cn"
import {
  RotateCw,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react"

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  isLoading?: boolean
  onRefresh?: () => void
  onRowClick?: (row: TData) => void
  mode?: "view" | "edit"
  onToggleMode?: (mode: "view" | "edit") => void
}

const statusFilterItems = [
  { value: "ALL", label: "ALL STATUS" },
  { value: "ACCEPTED", label: "ACCEPTED" },
  { value: "PENDING", label: "PENDING" },
  { value: "REJECTED", label: "REJECTED" },
]

const accessFilterItems = [
  { value: "ALL", label: "ALL ACCESS" },
  { value: "ACTIVE", label: "ACTIVE" },
  { value: "BANNED", label: "BANNED" },
]

const pageSizeItems = [
  { value: "5", label: "5 ROWS" },
  { value: "8", label: "8 ROWS" },
  { value: "15", label: "15 ROWS" },
  { value: "25", label: "25 ROWS" },
]

export function DataTable<TData, TValue>({
  columns,
  data,
  isLoading = false,
  onRefresh,
  onRowClick,
  mode = "view",
  onToggleMode,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [globalFilter, setGlobalFilter] = React.useState("")
  const [pagination, setPagination] = React.useState({
    pageIndex: 0,
    pageSize: 8,
  })

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    onPaginationChange: setPagination,
    state: {
      sorting,
      columnFilters,
      globalFilter,
      pagination,
    },
  })

  const currentStatusFilter =
    (table.getColumn("status")?.getFilterValue() as string) || "ALL"
  const currentAccessFilter =
    (table.getColumn("ban")?.getFilterValue() as string) || "ALL"

  const hasActiveFilters =
    Boolean(globalFilter) ||
    currentStatusFilter !== "ALL" ||
    currentAccessFilter !== "ALL"

  const handleResetFilters = () => {
    setGlobalFilter("")
    table.getColumn("status")?.setFilterValue("ALL")
    table.getColumn("ban")?.setFilterValue("ALL")
  }

  const totalRows = data.length
  const filteredRows = table.getFilteredRowModel().rows.length
  const pageIndex = table.getState().pagination.pageIndex
  const pageSize = table.getState().pagination.pageSize
  const pageCount = table.getPageCount()
  const startRowIndex = totalRows === 0 ? 0 : pageIndex * pageSize + 1
  const endRowIndex = Math.min((pageIndex + 1) * pageSize, filteredRows)

  return (
    <div className="space-y-4 w-full min-w-0">
      {/* Table Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {/* Search & Filters */}
        <div className="flex flex-1 flex-col sm:flex-row sm:items-center gap-2">
          {/* Global Search */}
          <div className="w-full sm:w-72">
            <Input
              placeholder="FILTER BY NAME OR EMAIL..."
              value={globalFilter ?? ""}
              onChange={(e) => setGlobalFilter(e.target.value)}
              className="h-9 rounded-none border-border text-xs font-mono uppercase px-3 shadow-none w-full"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            {/* Status Filter */}
            <Select
              value={currentStatusFilter}
              onValueChange={(val) => {
                table.getColumn("status")?.setFilterValue(val === "ALL" ? undefined : val)
              }}
              items={statusFilterItems}
            >
              <SelectTrigger className="h-9 flex-1 sm:w-[130px] rounded-none border-border text-xs font-mono uppercase shadow-none">
                <SelectValue placeholder="STATUS" />
              </SelectTrigger>
              <SelectContent className="rounded-none border-border">
                {statusFilterItems.map((item) => (
                  <SelectItem key={item.value} value={item.value} className="text-xs font-mono uppercase rounded-none py-1.5">
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Ban/Access Filter */}
            <Select
              value={currentAccessFilter}
              onValueChange={(val) => {
                table.getColumn("ban")?.setFilterValue(val === "ALL" ? undefined : val)
              }}
              items={accessFilterItems}
            >
              <SelectTrigger className="h-9 flex-1 sm:w-[130px] rounded-none border-border text-xs font-mono uppercase shadow-none">
                <SelectValue placeholder="ACCESS" />
              </SelectTrigger>
              <SelectContent className="rounded-none border-border">
                {accessFilterItems.map((item) => (
                  <SelectItem key={item.value} value={item.value} className="text-xs font-mono uppercase rounded-none py-1.5">
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Clear Filter Button */}
            {hasActiveFilters && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleResetFilters}
                className="h-9 rounded-none border-border px-2.5 text-xs font-mono uppercase text-muted-foreground hover:text-foreground shrink-0 shadow-none"
              >
                RESET
              </Button>
            )}
          </div>
        </div>

        {/* Right side: View / Edit mode switcher & Refresh */}
        <div className="flex items-center justify-between sm:justify-end gap-2">
          {onToggleMode && (
            <div className="inline-flex rounded-none border border-border bg-muted/20 p-0.5 text-xs font-mono">
              <button
                type="button"
                onClick={() => onToggleMode("view")}
                className={`rounded-none px-3 py-1 text-xs uppercase font-medium transition-colors ${
                  mode === "view"
                    ? "bg-foreground text-background font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                VIEW ONLY
              </button>
              <button
                type="button"
                onClick={() => onToggleMode("edit")}
                className={`rounded-none px-3 py-1 text-xs uppercase font-medium transition-colors ${
                  mode === "edit"
                    ? "bg-foreground text-background font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                EDITABLE
              </button>
            </div>
          )}

          {/* Refresh Button */}
          {onRefresh && (
            <Button
              variant="outline"
              size="icon-sm"
              onClick={onRefresh}
              disabled={isLoading}
              className="size-9 rounded-none border-border shrink-0 shadow-none"
              title="Refresh"
            >
              <RotateCw className={`size-3.5 ${isLoading ? "animate-spin" : ""}`} />
            </Button>
          )}
        </div>
      </div>

      {/* Table Container */}
      <div className="rounded-none border border-border bg-card shadow-none overflow-x-auto w-full min-w-0">
        <Table className="w-full min-w-[780px] border-collapse table-auto">
          <TableHeader className="bg-muted/30 border-b border-border">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="border-b border-border hover:bg-transparent">
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead
                      key={header.id}
                      className={cn(
                        "h-10 px-3 text-xs font-bold uppercase tracking-wider text-muted-foreground align-middle whitespace-nowrap",
                        header.column.id === "name" && "w-[190px]",
                        header.column.id === "email" && "w-[220px]",
                        header.column.id === "phone" && "w-[130px]",
                        header.column.id === "status" && "w-[110px]",
                        header.column.id === "ban" && "w-[90px]",
                        header.column.id === "actions" && "w-[130px] text-right pr-3"
                      )}
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 4 }).map((_, idx) => (
                <TableRow key={idx} className="border-b border-border/50">
                  <TableCell className="py-3 px-3 w-[190px]">
                    <div className="space-y-1">
                      <Skeleton className="h-4 w-28 rounded-none" />
                      <Skeleton className="h-2.5 w-16 rounded-none" />
                    </div>
                  </TableCell>
                  <TableCell className="py-3 px-3 w-[220px]">
                    <Skeleton className="h-3.5 w-36 rounded-none" />
                  </TableCell>
                  <TableCell className="py-3 px-3 w-[130px]">
                    <Skeleton className="h-3.5 w-24 rounded-none" />
                  </TableCell>
                  <TableCell className="py-3 px-3 w-[110px]">
                    <Skeleton className="h-5 w-18 rounded-none" />
                  </TableCell>
                  <TableCell className="py-3 px-3 w-[90px]">
                    <Skeleton className="h-5 w-16 rounded-none" />
                  </TableCell>
                  <TableCell className="py-3 px-3 w-[130px] text-right pr-3">
                    <Skeleton className="h-7 w-20 ml-auto rounded-none" />
                  </TableCell>
                </TableRow>
              ))
            ) : table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  className="cursor-pointer border-b border-border/60 transition-colors hover:bg-muted/20"
                  onClick={() => onRowClick && onRowClick(row.original)}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell
                      key={cell.id}
                      className={cn(
                        "py-2.5 px-3 align-middle",
                        cell.column.id === "name" && "w-[190px]",
                        cell.column.id === "email" && "w-[220px]",
                        cell.column.id === "phone" && "w-[130px]",
                        cell.column.id === "status" && "w-[110px]",
                        cell.column.id === "ban" && "w-[90px]",
                        cell.column.id === "actions" && "w-[130px] text-right pr-3"
                      )}
                      onClick={(e) => {
                        // Prevent opening row view when clicking action buttons
                        if (cell.column.id === "actions") {
                          e.stopPropagation()
                        }
                      }}
                    >
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-32 text-center text-xs font-mono uppercase text-muted-foreground"
                >
                  {hasActiveFilters
                    ? "NO VENDORS MATCH YOUR ACTIVE FILTER CRITERIA."
                    : "NO VENDORS FOUND IN ROSTER."}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination Footer */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between px-1">
        {/* Row count info */}
        <div className="text-xs font-mono text-muted-foreground uppercase">
          {totalRows > 0 ? (
            <>
              SHOWING <span className="font-semibold text-foreground">{startRowIndex}</span> TO{" "}
              <span className="font-semibold text-foreground">{endRowIndex}</span> OF{" "}
              <span className="font-semibold text-foreground">{filteredRows}</span>{" "}
              {filteredRows !== totalRows && `(FILTERED FROM ${totalRows})`}
            </>
          ) : (
            "0 VENDORS"
          )}
        </div>

        {/* Controls */}
        <div className="flex items-center gap-3 self-end sm:self-auto">
          {/* Rows per page */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-mono uppercase text-muted-foreground hidden sm:inline">
              PER PAGE:
            </span>
            <Select
              value={String(pageSize)}
              onValueChange={(val) => {
                if (val) table.setPageSize(Number(val))
              }}
              items={pageSizeItems}
            >
              <SelectTrigger className="h-8 w-[100px] rounded-none border-border text-xs font-mono uppercase shadow-none">
                <SelectValue placeholder="ROWS" />
              </SelectTrigger>
              <SelectContent className="rounded-none border-border">
                {pageSizeItems.map((item) => (
                  <SelectItem key={item.value} value={item.value} className="text-xs font-mono uppercase rounded-none py-1">
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Page Index Display */}
          <div className="text-xs font-mono uppercase text-muted-foreground">
            PAGE <span className="font-semibold text-foreground">{pageIndex + 1}</span> OF{" "}
            <span className="font-semibold text-foreground">{Math.max(1, pageCount)}</span>
          </div>

          {/* Nav Buttons */}
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon-sm"
              onClick={() => table.setPageIndex(0)}
              disabled={!table.getCanPreviousPage()}
              className="size-8 rounded-none border-border shadow-none"
              title="First Page"
            >
              <ChevronsLeft className="size-3.5" />
            </Button>
            <Button
              variant="outline"
              size="icon-sm"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              className="size-8 rounded-none border-border shadow-none"
              title="Previous Page"
            >
              <ChevronLeft className="size-3.5" />
            </Button>
            <Button
              variant="outline"
              size="icon-sm"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              className="size-8 rounded-none border-border shadow-none"
              title="Next Page"
            >
              <ChevronRight className="size-3.5" />
            </Button>
            <Button
              variant="outline"
              size="icon-sm"
              onClick={() => table.setPageIndex(pageCount - 1)}
              disabled={!table.getCanNextPage()}
              className="size-8 rounded-none border-border shadow-none"
              title="Last Page"
            >
              <ChevronsRight className="size-3.5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
