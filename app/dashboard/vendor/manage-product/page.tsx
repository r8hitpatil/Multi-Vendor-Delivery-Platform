"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { getProducts } from "@/app/api/vendor/action"
import { requireVendor } from "@/app/api/auth/action"
import { Status } from "@/app/generated/prisma/client"
import { ProductItem, getColumns } from "./columns"
import { DataTable } from "./data-table"
import { ProductViewSheet } from "./product-view-sheet"
import { ProductEditSheet } from "./product-edit-sheet"
import { ProductDeleteDialog } from "./product-delete-dialog"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { buttonVariants } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import PageLoading from "../loading"
import { cn } from "cn"

export default function ManageProductPage() {
  const [products, setProducts] = useState<ProductItem[]>([])
  const [status, setStatus] = useState<Status>()
  const [hasStore, setHasStore] = useState(false)
  const [isBanned, setIsBanned] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")

  // View / Edit mode switcher & sheets
  const [mode, setMode] = useState<"view" | "edit">("view")
  const [viewProduct, setViewProduct] = useState<ProductItem | null>(null)
  const [isViewOpen, setIsViewOpen] = useState(false)
  const [editProduct, setEditProduct] = useState<ProductItem | null>(null)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [delProduct, setDelProduct] = useState<ProductItem | null>(null)
  const [isDelOpen, setIsDelOpen] = useState(false)

  async function loadProducts() {
    try {
      const res = await getProducts()
      if (res.success && res.data) {
        setProducts(res.data as unknown as ProductItem[])
      } else if (!res.success) {
        setProducts([])
        if (res.message && res.message !== "Product not found in your store.") {
          setError(res.message)
        }
      }
    } catch (err: any) {
      setError(err?.message || "Failed to load products")
    }
  }

  useEffect(() => {
    const checkAuthAndLoad = async () => {
      try {
        const res = await requireVendor()
        setStatus(res.status)
        setHasStore(Boolean(res.storeId))
        setIsBanned(Boolean(res.ban))
        if (res.storeId) {
          await loadProducts()
        }
      } catch (err: any) {
        setError(err.message || "Failed to verify vendor authorization")
      } finally {
        setIsLoading(false)
      }
    }
    checkAuthAndLoad()
  }, [])

  const handleView = (product: ProductItem) => {
    setViewProduct(product)
    setIsViewOpen(true)
  }

  const handleEdit = (product: ProductItem) => {
    setEditProduct(product)
    setIsEditOpen(true)
  }

  const handleDelete = (product: ProductItem) => {
    setDelProduct(product)
    setIsDelOpen(true)
  }

  const handleRowClick = (product: ProductItem) => {
    if (mode === "edit") {
      handleEdit(product)
    } else {
      handleView(product)
    }
  }

  const columns = useMemo(
    () =>
      getColumns({
        onEdit: handleEdit,
        onView: handleView,
        onDelete: handleDelete,
        mode,
      }),
    [mode]
  )

  const stats = useMemo(() => {
    const total = products.length
    const inStock = products.filter((p) => p.quantity > 5).length
    const lowStock = products.filter((p) => p.quantity > 0 && p.quantity <= 5).length
    const discounted = products.filter(
      (p) => p.discountedPrice !== null && p.discountedPrice !== undefined
    ).length

    return { total, inStock, lowStock, discounted }
  }, [products])

  if (isLoading) return <PageLoading />

  if (isBanned) {
    return (
      <div className="flex w-full justify-center p-4 md:p-8 max-w-lg mx-auto">
        <Card className="w-full text-center rounded-none border border-border shadow-none">
          <CardHeader className="space-y-2">
            <span className="inline-block rounded-none border border-foreground bg-foreground text-background text-[10px] font-mono uppercase font-bold tracking-wider px-2 py-0.5 mx-auto">
              SUSPENDED
            </span>
            <CardTitle className="text-lg font-bold uppercase tracking-tight">
              Account Suspended
            </CardTitle>
            <CardDescription className="text-xs font-mono text-muted-foreground">
              Your vendor account is currently restricted. Please contact the company administrator for authorization.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  if (status !== "ACCEPTED") {
    return (
      <div className="flex w-full justify-center p-4 md:p-8 max-w-lg mx-auto">
        <Card className="w-full text-center rounded-none border border-border shadow-none">
          <CardHeader className="space-y-2">
            <span className="inline-block rounded-none border border-foreground/30 text-foreground text-[10px] font-mono uppercase font-bold tracking-wider px-2 py-0.5 mx-auto">
              {status === "PENDING" ? "PENDING REVIEW" : "ACCESS DENIED"}
            </span>
            <CardTitle className="text-lg font-bold uppercase tracking-tight">
              Approval Required
            </CardTitle>
            <CardDescription className="text-xs font-mono text-muted-foreground">
              Your vendor partner application must be approved by the company administrator before managing inventory.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  if (!hasStore) {
    return (
      <div className="flex w-full justify-center p-4 md:p-8 max-w-lg mx-auto">
        <Card className="w-full text-center rounded-none border border-border shadow-none">
          <CardHeader className="space-y-2">
            <CardTitle className="text-lg font-bold uppercase tracking-tight">
              No Store Profile Found
            </CardTitle>
            <CardDescription className="text-xs font-mono text-muted-foreground">
              You must configure and create your storefront before managing catalog products.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-2">
            <Link
              href="/dashboard/vendor"
              className={cn(
                buttonVariants({ variant: "default" }),
                "w-full rounded-none text-xs font-mono uppercase tracking-wider font-semibold"
              )}
            >
              Go to Home &amp; Create Store
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="w-full space-y-5 max-w-5xl mx-auto min-w-0">
      {/* Page Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-border pb-4">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-foreground uppercase">
              Manage Products
            </h1>
            <Badge
              variant="outline"
              className="rounded-none text-[11px] font-mono uppercase tracking-wider border-foreground/30 px-1.5 py-0.5 shrink-0"
            >
              Vendor Store
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Review catalog inventory, stock units, and pricing configurations.
          </p>
        </div>

        <div>
          <Link
            href="/dashboard/vendor/create-product"
            className={cn(
              buttonVariants({ variant: "default" }),
              "h-9 px-4 rounded-none text-xs font-mono uppercase tracking-wider font-semibold shadow-none whitespace-nowrap"
            )}
          >
            Add Product
          </Link>
        </div>
      </div>

      {/* Error Notice */}
      {error && (
        <div className="rounded-none border border-foreground/30 bg-muted/20 p-3 text-xs font-mono text-foreground uppercase">
          {error}
        </div>
      )}

      {/* Top Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-4">
        <Card className="rounded-none border border-border shadow-none bg-card">
          <CardContent className="p-4 space-y-1">
            <p className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Total Products
            </p>
            <p className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground font-mono">
              {isLoading ? "—" : stats.total}
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-none border border-border shadow-none bg-card">
          <CardContent className="p-4 space-y-1">
            <p className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-muted-foreground">
              In Stock
            </p>
            <p className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground font-mono">
              {isLoading ? "—" : stats.inStock}
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-none border border-border shadow-none bg-card">
          <CardContent className="p-4 space-y-1">
            <p className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Low Stock
            </p>
            <p className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground font-mono">
              {isLoading ? "—" : stats.lowStock}
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-none border border-border shadow-none bg-card">
          <CardContent className="p-4 space-y-1">
            <p className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-muted-foreground">
              On Discount
            </p>
            <p className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground font-mono">
              {isLoading ? "—" : stats.discounted}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Data Table */}
      <DataTable
        columns={columns}
        data={products}
        isLoading={isLoading}
        onRefresh={loadProducts}
        mode={mode}
        onToggleMode={setMode}
        onRowClick={handleRowClick}
      />

      {/* View-Only Product Details Sheet */}
      <ProductViewSheet
        product={viewProduct}
        open={isViewOpen}
        onOpenChange={setIsViewOpen}
        onEdit={(prod) => {
          setIsViewOpen(false)
          handleEdit(prod)
        }}
      />

      {/* Editable Product Details Sheet */}
      <ProductEditSheet
        product={editProduct}
        open={isEditOpen}
        onOpenChange={setIsEditOpen}
        onSuccess={loadProducts}
      />

      {/* Delete Product Confirmation Dialog */}
      <ProductDeleteDialog
        product={delProduct}
        open={isDelOpen}
        onOpenChange={setIsDelOpen}
        onSuccess={loadProducts}
      />
    </div>
  )
}