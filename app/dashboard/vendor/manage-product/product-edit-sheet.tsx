"use client"

import { useEffect, useState } from "react"
import { ProductItem } from "./columns"
import { updateProduct } from "@/app/api/vendor/action"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Loader2 } from "lucide-react"
import { zodResolver } from "@hookform/resolvers/zod"
import { Controller, useForm } from "react-hook-form"
import * as z from "zod"

interface ProductEditSheetProps {
  product: ProductItem | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

const formSchema = z
  .object({
    name: z.string().trim().min(2, "Product name must be at least 2 characters long"),
    quantity: z
      .string()
      .trim()
      .min(1, "Quantity is required")
      .refine((val) => !isNaN(Number(val)) && Number(val) >= 0, {
        message: "Quantity must be 0 or more",
      }),
    price: z
      .string()
      .trim()
      .min(1, "Price is required")
      .refine((val) => !isNaN(Number(val)) && Number(val) >= 1, {
        message: "Price must be at least 1",
      }),
    discountedPrice: z
      .string()
      .trim()
      .optional()
      .refine((val) => !val || (!isNaN(Number(val)) && Number(val) >= 0), {
        message: "Discounted price must be 0 or more",
      }),
  })
  .refine(
    (data) => {
      if (data.discountedPrice && data.discountedPrice.trim() !== "") {
        const disc = Number(data.discountedPrice)
        const orig = Number(data.price)
        return disc < orig
      }
      return true
    },
    {
      message: "Discounted price must be less than original price",
      path: ["discountedPrice"],
    }
  )

type FormValues = z.infer<typeof formSchema>

export function ProductEditSheet({
  product,
  open,
  onOpenChange,
  onSuccess,
}: ProductEditSheetProps) {
  const [error, setError] = useState("")
  const [successMsg, setSuccessMsg] = useState("")

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      quantity: "1",
      price: "",
      discountedPrice: "",
    },
  })

  useEffect(() => {
    if (product) {
      form.reset({
        name: product.name,
        quantity: String(product.quantity),
        price: String(product.price),
        discountedPrice:
          product.discountedPrice !== null && product.discountedPrice !== undefined
            ? String(product.discountedPrice)
            : "",
      })
      setError("")
      setSuccessMsg("")
    }
  }, [product, form])

  async function onSubmit(values: FormValues) {
    if (!product) return
    setError("")
    setSuccessMsg("")

    try {
      const res = await updateProduct({
        id: product.id,
        name: values.name,
        quantity: Number(values.quantity),
        price: Number(values.price),
        discountedPrice:
          values.discountedPrice && values.discountedPrice.trim() !== ""
            ? Number(values.discountedPrice)
            : undefined,
      })

      if (res.success) {
        setSuccessMsg("PRODUCT UPDATED SUCCESSFULLY.")
        onSuccess()
        setTimeout(() => {
          onOpenChange(false)
          setSuccessMsg("")
        }, 800)
      } else {
        setError(res.message || "Failed to update product")
      }
    } catch (err: any) {
      setError(err?.message || "An unexpected error occurred")
    }
  }

  if (!product) return null

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-md p-6 flex flex-col justify-between overflow-y-auto rounded-none border-l border-border bg-background"
      >
        <div className="space-y-6">
          <SheetHeader className="text-left space-y-1 p-0">
            <div className="flex items-center gap-2">
              <span className="rounded-none border border-foreground bg-foreground text-background text-[10px] font-mono uppercase font-bold tracking-wider px-2 py-0.5">
                EDIT PRODUCT
              </span>
              <span className="text-xs text-muted-foreground font-mono">
                ID: {product.id.substring(0, 8)}
              </span>
            </div>
            <SheetTitle className="text-xl font-bold tracking-tight uppercase">
              Modify Item
            </SheetTitle>
            <SheetDescription className="text-xs font-mono">
              Update pricing, inventory stock, and title in your store catalog.
            </SheetDescription>
          </SheetHeader>

          {error && (
            <div className="rounded-none border border-foreground/40 bg-muted/20 p-3 text-xs font-mono text-foreground uppercase">
              {error}
            </div>
          )}

          {successMsg && (
            <div className="rounded-none border border-foreground bg-foreground text-background p-3 text-xs font-mono uppercase font-bold">
              {successMsg}
            </div>
          )}

          <form
            id="edit-product-form"
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4"
          >
            {/* Product Name */}
            <div className="space-y-1.5">
              <label
                htmlFor="edit-product-name"
                className="text-xs font-mono uppercase font-bold text-foreground block"
              >
                Product Name
              </label>
              <Controller
                name="name"
                control={form.control}
                render={({ field }) => (
                  <Input
                    {...field}
                    id="edit-product-name"
                    placeholder="E.G. ORGANIC APPLES"
                    className="h-9 rounded-none border-border text-xs font-mono uppercase shadow-none"
                  />
                )}
              />
              {form.formState.errors.name && (
                <p className="text-[11px] font-mono text-foreground font-semibold">
                  {form.formState.errors.name.message}
                </p>
              )}
            </div>

            {/* Quantity */}
            <div className="space-y-1.5">
              <label
                htmlFor="edit-product-qty"
                className="text-xs font-mono uppercase font-bold text-foreground block"
              >
                Stock Quantity (Units)
              </label>
              <Controller
                name="quantity"
                control={form.control}
                render={({ field }) => (
                  <Input
                    {...field}
                    id="edit-product-qty"
                    type="number"
                    min="0"
                    placeholder="10"
                    className="h-9 rounded-none border-border text-xs font-mono shadow-none"
                  />
                )}
              />
              {form.formState.errors.quantity && (
                <p className="text-[11px] font-mono text-foreground font-semibold">
                  {form.formState.errors.quantity.message}
                </p>
              )}
            </div>

            {/* Price */}
            <div className="space-y-1.5">
              <label
                htmlFor="edit-product-price"
                className="text-xs font-mono uppercase font-bold text-foreground block"
              >
                Regular Price (₹)
              </label>
              <Controller
                name="price"
                control={form.control}
                render={({ field }) => (
                  <Input
                    {...field}
                    id="edit-product-price"
                    type="number"
                    min="1"
                    placeholder="100"
                    className="h-9 rounded-none border-border text-xs font-mono shadow-none"
                  />
                )}
              />
              {form.formState.errors.price && (
                <p className="text-[11px] font-mono text-foreground font-semibold">
                  {form.formState.errors.price.message}
                </p>
              )}
            </div>

            {/* Discounted Price */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="edit-product-discount"
                  className="text-xs font-mono uppercase font-bold text-foreground block"
                >
                  Discounted Price (₹)
                </label>
                <span className="text-[10px] font-mono uppercase text-muted-foreground">
                  Optional
                </span>
              </div>
              <Controller
                name="discountedPrice"
                control={form.control}
                render={({ field }) => (
                  <Input
                    {...field}
                    id="edit-product-discount"
                    type="number"
                    min="0"
                    placeholder="Leave empty if none"
                    className="h-9 rounded-none border-border text-xs font-mono shadow-none"
                  />
                )}
              />
              {form.formState.errors.discountedPrice && (
                <p className="text-[11px] font-mono text-foreground font-semibold">
                  {form.formState.errors.discountedPrice.message}
                </p>
              )}
              <p className="text-[11px] text-muted-foreground font-mono">
                Must be strictly less than regular price.
              </p>
            </div>
          </form>
        </div>

        <SheetFooter className="p-0 pt-6 gap-2 sm:gap-2 flex-row sm:justify-between items-center border-t border-border">
          <Button
            type="button"
            variant="outline"
            className="flex-1 rounded-none border-border text-xs font-mono uppercase"
            onClick={() => {
              if (product) {
                form.reset({
                  name: product.name,
                  quantity: String(product.quantity),
                  price: String(product.price),
                  discountedPrice:
                    product.discountedPrice !== null && product.discountedPrice !== undefined
                      ? String(product.discountedPrice)
                      : "",
                })
              }
            }}
            disabled={form.formState.isSubmitting}
          >
            RESET
          </Button>

          <Button
            type="submit"
            form="edit-product-form"
            className="flex-1 rounded-none text-xs font-mono uppercase font-semibold"
            disabled={form.formState.isSubmitting}
          >
            {form.formState.isSubmitting ? (
              <>
                <Loader2 className="size-3.5 animate-spin mr-1" />
                SAVING...
              </>
            ) : (
              "SAVE CHANGES"
            )}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
