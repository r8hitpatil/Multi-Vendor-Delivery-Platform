"use client"

import { Product } from "@/app/generated/prisma/client";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { updateProduct } from "@/app/api/vendor/action";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import * as z from "zod";

type Props = {
  product: Product | null;
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
};

const formSchema = z
  .object({
    name: z.string().trim().min(2, "Product name must be at least 2 characters long"),
    quantity: z
      .string()
      .trim()
      .min(1, "Quantity is required")
      .refine((val) => !isNaN(Number(val)) && Number(val) >= 1, {
        message: "Quantity must be at least 1",
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
        const disc = Number(data.discountedPrice);
        const orig = Number(data.price);
        return disc < orig;
      }
      return true;
    },
    {
      message: "Discounted price must be less than original price",
      path: ["discountedPrice"],
    }
  );

type FormValues = z.infer<typeof formSchema>;

export default function EditProductDrawer({
  product,
  open,
  onClose,
  onSuccess,
}: Props) {
  const [error, setError] = useState("");

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      quantity: "1",
      price: "",
      discountedPrice: "",
    },
  });

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
      });
      setError("");
    }
  }, [product, form]);

  if (!product) return null;

  async function onSubmit(data: FormValues) {
    if (!product) return;
    setError("");

    const res = await updateProduct({
      id: product.id,
      name: data.name,
      quantity: Number(data.quantity),
      price: Number(data.price),
      discountedPrice:
        data.discountedPrice && data.discountedPrice.trim() !== ""
          ? Number(data.discountedPrice)
          : undefined,
    });

    if (res.success) {
      console.log("Product updated");
      onSuccess();
      onClose();
    } else {
      setError(res.message);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="p-6 sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Product</DialogTitle>
          <DialogDescription>
            Update details for &quot;{product.name}&quot;
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {error && (
            <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">
              {error}
            </div>
          )}
          <FieldGroup className="flex flex-col gap-4">
            <Controller
              name="name"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="edit-name">Product name</FieldLabel>
                  <Input
                    {...field}
                    id="edit-name"
                    type="text"
                    aria-invalid={fieldState.invalid}
                    placeholder="Product name"
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />

            <Controller
              name="quantity"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="edit-quantity">Quantity</FieldLabel>
                  <Input
                    {...field}
                    id="edit-quantity"
                    type="number"
                    min={1}
                    aria-invalid={fieldState.invalid}
                    placeholder="Quantity"
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />

            <Controller
              name="price"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="edit-price">Price</FieldLabel>
                  <Input
                    {...field}
                    id="edit-price"
                    type="number"
                    min={1}
                    aria-invalid={fieldState.invalid}
                    placeholder="Price"
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />

            <Controller
              name="discountedPrice"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="edit-discountedPrice">
                    Discounted Price <span className="text-muted-foreground font-normal">(Optional)</span>
                  </FieldLabel>
                  <Input
                    {...field}
                    id="edit-discountedPrice"
                    type="number"
                    min={0}
                    aria-invalid={fieldState.invalid}
                    placeholder="Discounted price"
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
          </FieldGroup>

          <Button
            type="submit"
            className="w-full"
            disabled={form.formState.isSubmitting}
          >
            {form.formState.isSubmitting ? "Updating..." : "Update Product"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}