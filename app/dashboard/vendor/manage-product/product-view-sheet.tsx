"use client"

import { useState } from "react"
import { ProductItem } from "./columns"
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

interface ProductViewSheetProps {
  product: ProductItem | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onEdit: (product: ProductItem) => void
}

export function ProductViewSheet({
  product,
  open,
  onOpenChange,
  onEdit,
}: ProductViewSheetProps) {
  const [copiedField, setCopiedField] = useState<string | null>(null)

  if (!product) return null

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text)
    setCopiedField(field)
    setTimeout(() => setCopiedField(null), 2000)
  }

  const isOutOfStock = product.quantity <= 0
  const isLowStock = product.quantity > 0 && product.quantity <= 5
  const discountPercent =
    product.discountedPrice && product.price > 0
      ? Math.round(((product.price - product.discountedPrice) / product.price) * 100)
      : null

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
              <span
                className={
                  isOutOfStock
                    ? "rounded-none border border-foreground bg-foreground text-background px-2 py-0.5 text-[10px] font-mono uppercase font-bold tracking-wider"
                    : isLowStock
                    ? "rounded-none border border-dashed border-muted-foreground/50 px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider text-muted-foreground"
                    : "rounded-none border border-foreground/30 px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider text-foreground"
                }
              >
                {isOutOfStock ? "OUT OF STOCK" : isLowStock ? "LOW STOCK" : "IN STOCK"}
              </span>
            </div>
            <SheetTitle className="text-xl font-bold tracking-tight uppercase">
              Product Record
            </SheetTitle>
            <SheetDescription className="text-xs font-mono">
              Metadata and inventory details for store catalog item.
            </SheetDescription>
          </SheetHeader>

          {/* Product Overview Banner */}
          <div className="rounded-none border border-border bg-muted/20 p-4 space-y-1">
            <p className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
              Product Item
            </p>
            <h3 className="font-bold text-foreground text-lg uppercase tracking-tight">
              {product.name}
            </h3>
            <div className="flex items-baseline gap-2 pt-1 font-mono">
              {product.discountedPrice ? (
                <>
                  <span className="text-base font-extrabold text-foreground">
                    ₹{product.discountedPrice}
                  </span>
                  <span className="text-xs line-through text-muted-foreground">
                    ₹{product.price}
                  </span>
                  {discountPercent !== null && (
                    <span className="text-xs font-bold text-foreground">
                      ({discountPercent}% OFF)
                    </span>
                  )}
                </>
              ) : (
                <span className="text-base font-extrabold text-foreground">
                  ₹{product.price}
                </span>
              )}
            </div>
          </div>

          <Separator className="rounded-none" />

          {/* Details List */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Catalog Information
            </h4>

            <div className="rounded-none border border-border divide-y divide-border bg-card">
              {/* Product ID */}
              <div className="flex items-center justify-between p-3 text-xs font-mono">
                <span className="text-muted-foreground uppercase">PRODUCT ID</span>
                <div className="flex items-center gap-1.5">
                  <span className="text-foreground max-w-[160px] truncate">
                    {product.id}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    className="size-6 rounded-none text-muted-foreground hover:text-foreground"
                    onClick={() => copyToClipboard(product.id, "id")}
                    title="Copy Product ID"
                  >
                    {copiedField === "id" ? (
                      <Check className="size-3" />
                    ) : (
                      <Copy className="size-3" />
                    )}
                  </Button>
                </div>
              </div>

              {/* Stock Quantity */}
              <div className="flex items-center justify-between p-3 text-xs font-mono">
                <span className="text-muted-foreground uppercase">STOCK QUANTITY</span>
                <span className="text-foreground font-semibold">
                  {product.quantity} UNITS
                </span>
              </div>

              {/* Regular Price */}
              <div className="flex items-center justify-between p-3 text-xs font-mono">
                <span className="text-muted-foreground uppercase">REGULAR PRICE</span>
                <span className="text-foreground">₹{product.price}</span>
              </div>

              {/* Discounted Price */}
              <div className="flex items-center justify-between p-3 text-xs font-mono">
                <span className="text-muted-foreground uppercase">DISCOUNTED PRICE</span>
                <span className="text-foreground">
                  {product.discountedPrice ? `₹${product.discountedPrice}` : "NONE"}
                </span>
              </div>

              {/* Status */}
              <div className="flex items-center justify-between p-3 text-xs font-mono">
                <span className="text-muted-foreground uppercase">INVENTORY STATUS</span>
                <span
                  className={
                    isOutOfStock
                      ? "border border-foreground bg-foreground text-background px-1.5 py-0.5 uppercase font-bold"
                      : "border border-foreground/30 px-1.5 py-0.5 uppercase"
                  }
                >
                  {isOutOfStock ? "OUT OF STOCK" : isLowStock ? "LOW STOCK" : "IN STOCK"}
                </span>
              </div>

              {/* Store ID */}
              <div className="flex items-center justify-between p-3 text-xs font-mono">
                <span className="text-muted-foreground uppercase">STORE ID</span>
                <div className="flex items-center gap-1.5">
                  <span className="text-foreground max-w-[160px] truncate">
                    {product.storeId}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    className="size-6 rounded-none text-muted-foreground hover:text-foreground"
                    onClick={() => copyToClipboard(product.storeId, "storeId")}
                    title="Copy Store ID"
                  >
                    {copiedField === "storeId" ? (
                      <Check className="size-3" />
                    ) : (
                      <Copy className="size-3" />
                    )}
                  </Button>
                </div>
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
              onEdit(product)
            }}
          >
            EDIT PRODUCT
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
