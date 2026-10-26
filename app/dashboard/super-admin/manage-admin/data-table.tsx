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
  mode: "view" | "edit"
  onToggleMode: (mode: "view" | "edit") => void
  onRowClick?: (row: TData) => void
}

const statusFilterItems = [
  { value: "ALL", label: "ALL STATUSES" },
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
  mode,
  onToggleMode,
  onRowClick,
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

  // Current active filter values
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
      {/* Table Toolbar - Fully responsive */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        {/* Search & Dropdown Filters */}
        <div className="flex flex-1 flex-col sm:flex-row sm:items-center gap-2">
          {/* Global Search */}
          <div className="w-full sm:w-64">
            <Input
              placeholder="FILTER BY NAME OR EMAIL..."
              value={globalFilter ?? ""}
              onChange={(e) => setGlobalFilter(e.target.value)}
              className="h-9 rounded-none border-border text-xs font-mono uppercase px-3 shadow-none w-full"
            />
          </div>

          {/* Filter Dropdowns */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            {/* Status Filter */}
            <Select
              value={currentStatusFilter}
              onValueChange={(val) => {
                table.getColumn("status")?.setFilterValue(val === "ALL" ? undefined : val)
              }}
              items={statusFilterItems}
            >
              <SelectTrigger className="h-9 flex-1 sm:w-[135px] rounded-none border-border text-xs font-mono uppercase shadow-none">
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
              <SelectTrigger className="h-9 flex-1 sm:w-[125px] rounded-none border-border text-xs font-mono uppercase shadow-none">
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
          {/* Mode Segmented Controls */}
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

      {/* Table Container - Tight, Proportional Columns on PC, Scrollable on Mobile */}
      <div className="rounded-none border border-border bg-card shadow-none overflow-x-auto w-full min-w-0">
        <Table className="w-full min-w-[720px] border-collapse table-auto">
          <TableHeader className="bg-muted/30 border-b border-border">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="border-b border-border hover:bg-transparent">
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead
                      key={header.id}
                      className={cn(
                        "h-10 px-3 text-xs font-bold uppercase tracking-wider text-muted-foreground align-middle whitespace-nowrap",
                        header.column.id === "name" && "w-[200px]",
                        header.column.id === "email" && "w-[230px]",
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
                  <TableCell className="py-3 px-3 w-[200px]">
                    <div className="space-y-1">
                      <Skeleton className="h-4 w-28 rounded-none" />
                      <Skeleton className="h-2.5 w-16 rounded-none" />
                    </div>
                  </TableCell>
                  <TableCell className="py-3 px-3 w-[230px]">
                    <Skeleton className="h-3.5 w-36 rounded-none" />
                  </TableCell>
                  <TableCell className="py-3 px-3 w-[130px]">
                    <Skeleton className="h-3.5 w-24 rounded-none" />
                  </TableCell>
                  <TableCell className="py-3 px-3 w-[110px]">
                    <Skeleton className="h-5 w-20 rounded-none" />
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
                        "py-3 px-3 text-sm align-middle whitespace-nowrap",
                        cell.column.id === "name" && "w-[200px]",
                        cell.column.id === "email" && "w-[230px]",
                        cell.column.id === "phone" && "w-[130px]",
                        cell.column.id === "status" && "w-[110px]",
                        cell.column.id === "ban" && "w-[90px]",
                        cell.column.id === "actions" && "w-[130px] text-right pr-3"
                      )}
                      onClick={(e) => {
                        if (cell.column.id === "actions") {
                          e.stopPropagation()
                        }
                      }}
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-32 text-center text-muted-foreground"
                >
                  <div className="flex flex-col items-center justify-center gap-1.5 py-4">
                    <p className="text-xs font-mono font-bold uppercase tracking-wider text-foreground">
                      No Administrators Found
                    </p>
                    <p className="text-xs text-muted-foreground font-mono">
                      {hasActiveFilters
                        ? "Clear filters or search term to view all records."
                        : "No administrator records exist in the system."}
                    </p>
                    {hasActiveFilters && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleResetFilters}
                        className="mt-2 h-7 rounded-none border-border font-mono text-xs uppercase shadow-none"
                      >
                        Reset Filters
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination Controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-1 py-1 text-xs font-mono text-muted-foreground">
        {/* Rows count & Page size */}
        <div className="flex items-center gap-3">
          <span>
            {startRowIndex}–{endRowIndex} OF {filteredRows} RECORDS
          </span>

          <div className="flex items-center gap-1.5">
            <span className="hidden sm:inline">PER PAGE:</span>
            <Select
              value={String(pageSize)}
              onValueChange={(val) => {
                table.setPageSize(Number(val))
              }}
              items={pageSizeItems}
            >
              <SelectTrigger className="h-7 w-[82px] rounded-none border-border text-xs font-mono uppercase shadow-none">
                <SelectValue placeholder={`${pageSize}`} />
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
        </div>

        {/* Page navigation */}
        <div className="flex items-center gap-2">
          <span>
            PAGE {pageIndex + 1} OF {Math.max(1, pageCount)}
          </span>

          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon-sm"
              className="size-7 rounded-none border-border shadow-none"
              onClick={() => table.setPageIndex(0)}
              disabled={!table.getCanPreviousPage()}
              title="First page"
            >
              <ChevronsLeft className="size-3.5" />
            </Button>
            <Button
              variant="outline"
              size="icon-sm"
              className="size-7 rounded-none border-border shadow-none"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              title="Previous page"
            >
              <ChevronLeft className="size-3.5" />
            </Button>
            <Button
              variant="outline"
              size="icon-sm"
              className="size-7 rounded-none border-border shadow-none"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              title="Next page"
            >
              <ChevronRight className="size-3.5" />
            </Button>
            <Button
              variant="outline"
              size="icon-sm"
              className="size-7 rounded-none border-border shadow-none"
              onClick={() => table.setPageIndex(pageCount - 1)}
              disabled={!table.getCanNextPage()}
              title="Last page"
            >
              <ChevronsRight className="size-3.5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
