"use client"

import { useState } from "react"
import { ProductItem } from "./columns"
import { deleteProduct } from "@/app/api/vendor/action"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"

interface ProductDeleteDialogProps {
  product: ProductItem | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function ProductDeleteDialog({
  product,
  open,
  onOpenChange,
  onSuccess,
}: ProductDeleteDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState("")

  if (!product) return null

  async function handleDelete() {
    if (!product) return
    setIsDeleting(true)
    setError("")

    try {
      const res = await deleteProduct(product.id)
      if (res.success) {
        onSuccess()
        onOpenChange(false)
      } else {
        setError(res.message || "Failed to delete product")
      }
    } catch (err: any) {
      setError(err?.message || "An unexpected error occurred")
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md rounded-none border border-border bg-background p-6">
        <DialogHeader className="space-y-1.5 text-left">
          <div className="flex items-center gap-2">
            <span className="rounded-none border border-foreground bg-foreground text-background px-2 py-0.5 text-[10px] font-mono uppercase font-bold tracking-wider">
              CONFIRM DELETION
            </span>
          </div>
          <DialogTitle className="text-lg font-bold tracking-tight uppercase">
            Delete Catalog Item
          </DialogTitle>
          <DialogDescription className="text-xs font-mono text-muted-foreground">
            Are you sure you want to permanently delete &quot;{product.name}&quot; from your store catalog? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div className="rounded-none border border-foreground/40 bg-muted/20 p-3 text-xs font-mono text-foreground uppercase">
            {error}
          </div>
        )}

        <div className="rounded-none border border-border p-3 bg-muted/10 space-y-1 font-mono text-xs">
          <div className="flex justify-between">
            <span className="text-muted-foreground uppercase">PRODUCT ID:</span>
            <span className="text-foreground">{product.id.substring(0, 12)}...</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground uppercase">STOCK QUANTITY:</span>
            <span className="text-foreground">{product.quantity} UNITS</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground uppercase">PRICE:</span>
            <span className="text-foreground">₹{product.price}</span>
          </div>
        </div>

        <DialogFooter className="flex-row gap-2 sm:justify-end pt-2 border-t border-border">
          <Button
            type="button"
            variant="outline"
            className="flex-1 sm:flex-initial rounded-none border-border text-xs font-mono uppercase"
            onClick={() => onOpenChange(false)}
            disabled={isDeleting}
          >
            CANCEL
          </Button>
          <Button
            type="button"
            className="flex-1 sm:flex-initial rounded-none text-xs font-mono uppercase font-semibold bg-foreground text-background hover:bg-foreground/90"
            onClick={handleDelete}
            disabled={isDeleting}
          >
            {isDeleting ? (
              <>
                <Loader2 className="size-3.5 animate-spin mr-1" />
                DELETING...
              </>
            ) : (
              "DELETE ITEM"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
