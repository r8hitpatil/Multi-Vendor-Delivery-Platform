"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Button } from "@/components/ui/button"
import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react"
import { cn } from "cn"

export type ProductItem = {
  id: string
  name: string
  quantity: number
  price: number
  discountedPrice: number | null
  storeId: string
}

interface GetColumnsOptions {
  onEdit: (product: ProductItem) => void
  onView: (product: ProductItem) => void
  onDelete: (product: ProductItem) => void
  mode?: "view" | "edit"
}

export function getColumns({
  onEdit,
  onView,
  onDelete,
  mode = "view",
}: GetColumnsOptions): ColumnDef<ProductItem>[] {
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
            <span>PRODUCT</span>
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
        const product = row.original
        return (
          <div className="flex flex-col py-0.5 space-y-0.5">
            <span className="font-semibold text-foreground text-sm uppercase tracking-tight truncate max-w-[200px]">
              {product.name}
            </span>
            <span className="text-xs text-muted-foreground font-mono">
              ID: {product.id.substring(0, 8)}
            </span>
          </div>
        )
      },
    },
    {
      accessorKey: "quantity",
      header: ({ column }) => {
        const isSorted = column.getIsSorted()
        return (
          <Button
            variant="ghost"
            size="sm"
            className="-ml-2 h-8 px-2 text-xs font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground hover:bg-transparent rounded-none"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            <span>STOCK</span>
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
        const qty = row.getValue("quantity") as number
        return (
          <div className="font-mono text-xs sm:text-sm text-foreground tabular-nums">
            {qty} <span className="text-muted-foreground text-[11px]">UNITS</span>
          </div>
        )
      },
    },
    {
      accessorKey: "price",
      header: ({ column }) => {
        const isSorted = column.getIsSorted()
        return (
          <Button
            variant="ghost"
            size="sm"
            className="-ml-2 h-8 px-2 text-xs font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground hover:bg-transparent rounded-none"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            <span>PRICE</span>
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
        const price = row.getValue("price") as number
        const discounted = row.original.discountedPrice

        return (
          <div className="flex flex-col font-mono text-xs sm:text-sm">
            {discounted ? (
              <div className="flex items-baseline gap-1.5">
                <span className="font-semibold text-foreground">₹{discounted}</span>
                <span className="line-through text-muted-foreground text-[11px]">
                  ₹{price}
                </span>
              </div>
            ) : (
              <span className="font-semibold text-foreground">₹{price}</span>
            )}
          </div>
        )
      },
    },
    {
      id: "availability",
      header: () => (
        <span className="inline-flex h-8 items-center px-0 text-xs font-bold uppercase tracking-wider text-muted-foreground">
          STATUS
        </span>
      ),
      cell: ({ row }) => {
        const qty = row.original.quantity

        if (qty <= 0) {
          return (
            <span className="inline-flex items-center rounded-none border border-foreground bg-foreground text-background px-2 py-0.5 text-xs font-mono font-bold uppercase tracking-wide">
              OUT OF STOCK
            </span>
          )
        }

        if (qty <= 5) {
          return (
            <span className="inline-flex items-center rounded-none border border-dashed border-muted-foreground/50 px-2 py-0.5 text-xs font-mono font-medium text-muted-foreground uppercase tracking-wide">
              LOW STOCK
            </span>
          )
        }

        return (
          <span className="inline-flex items-center rounded-none border border-foreground/30 px-2 py-0.5 text-xs font-mono font-medium text-foreground uppercase tracking-wide">
            IN STOCK
          </span>
        )
      },
      filterFn: (row, _id, value) => {
        if (!value || value === "ALL") return true
        const qty = row.original.quantity
        if (value === "IN_STOCK") return qty > 5
        if (value === "LOW_STOCK") return qty > 0 && qty <= 5
        if (value === "OUT_OF_STOCK") return qty <= 0
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
        const product = row.original

        return (
          <div className="flex items-center justify-end gap-1.5 pr-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2.5 rounded-none text-xs font-mono uppercase text-muted-foreground hover:text-foreground hover:bg-muted"
              onClick={() => onView(product)}
            >
              View
            </Button>

            <Button
              variant={mode === "edit" ? "default" : "outline"}
              size="sm"
              className="h-7 px-2.5 rounded-none text-xs font-mono uppercase font-semibold border-foreground/30"
              onClick={() => onEdit(product)}
            >
              Edit
            </Button>

            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 rounded-none text-xs font-mono uppercase text-muted-foreground hover:text-foreground hover:bg-muted"
              onClick={() => onDelete(product)}
              title="Delete Product"
            >
              Delete
            </Button>
          </div>
        )
      },
    },
  ]
}
