"use client"

import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { useEffect, useState } from "react";
import { createNewProduct } from "@/app/api/vendor/action";
import { requireVendor } from "@/app/api/auth/action";
import { Status } from "@/app/generated/prisma/enums";
import Link from "next/link";
import PageLoading from "../loading";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import * as z from "zod";
import { cn } from "cn";

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
      .refine(
        (val) => !val || (!isNaN(Number(val)) && Number(val) >= 0),
        {
          message: "Discounted price must be 0 or more",
        }
      ),
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

export default function CreateProduct() {
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [status, setStatus] = useState<Status>();
  const [hasStore, setHasStore] = useState(false);
  const [isBanned, setIsBanned] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      quantity: "1",
      price: "",
      discountedPrice: "",
    },
  });

  async function onSubmit(data: FormValues) {
    setError("");
    setSuccess("");
    const res = await createNewProduct({
      name: data.name,
      quantity: Number(data.quantity),
      price: Number(data.price),
      discountedPrice:
        data.discountedPrice && data.discountedPrice.trim() !== ""
          ? Number(data.discountedPrice)
          : undefined,
    });

    if (res.success) {
      setSuccess("Product created successfully!");
      form.reset({
        name: "",
        quantity: "1",
        price: "",
        discountedPrice: "",
      });
    } else {
      setError(res.message);
    }
  }

  useEffect(() => {
    if (!success) return;
    const timer = setTimeout(() => {
      setSuccess("");
    }, 3500);
    return () => clearTimeout(timer);
  }, [success]);

  useEffect(() => {
    const checkVendor = async () => {
      try {
        const res = await requireVendor();
        setStatus(res.status);
        setHasStore(Boolean(res.storeId));
        setIsBanned(Boolean(res.ban));
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };
    checkVendor();
  }, []);

  if (isLoading) return <PageLoading />;

  if (isBanned) {
    return (
      <div className="flex w-full justify-center p-4 md:p-8">
        <Card className="w-full max-w-sm text-center">
          <CardHeader>
            <CardTitle className="text-destructive">Account Suspended</CardTitle>
            <CardDescription>
              Your vendor account is currently banned. Please contact administrator.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (status !== "ACCEPTED") {
    return (
      <div className="flex w-full justify-center p-4 md:p-8">
        <Card className="w-full max-w-sm text-center">
          <CardHeader>
            <CardTitle>Approval Required</CardTitle>
            <CardDescription>
              Your vendor account must be approved before you can create products.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (!hasStore) {
    return (
      <div className="flex w-full justify-center p-4 md:p-8">
        <Card className="w-full max-w-sm text-center">
          <CardHeader>
            <CardTitle>No Store Found</CardTitle>
            <CardDescription>
              You need to create a store before you can add products to it.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-2">
            <Link
              href="/dashboard/vendor"
              className={cn(buttonVariants({ variant: "default" }), "w-full")}
            >
              Go to Home &amp; Create Store
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex w-full justify-center p-4 md:p-8">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Create Product</CardTitle>
          <CardDescription>Enter your product details</CardDescription>
        </CardHeader>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent>
            {error && (
              <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive mb-4">
                {error}
              </div>
            )}
            {success && (
              <div className="rounded-md bg-emerald-500/15 p-3 text-sm font-medium text-emerald-600 dark:text-emerald-400 mb-4">
                {success}
              </div>
            )}
            <FieldGroup className="flex flex-col gap-4">
              <Controller
                name="name"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="product-name">Product name</FieldLabel>
                    <Input
                      {...field}
                      id="product-name"
                      type="text"
                      aria-invalid={fieldState.invalid}
                      placeholder="e.g. Fresh Apples"
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
                    <FieldLabel htmlFor="product-quantity">Quantity</FieldLabel>
                    <Input
                      {...field}
                      id="product-quantity"
                      type="number"
                      min={1}
                      aria-invalid={fieldState.invalid}
                      placeholder="e.g. 10"
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
                    <FieldLabel htmlFor="product-price">Price</FieldLabel>
                    <Input
                      {...field}
                      id="product-price"
                      type="number"
                      min={1}
                      aria-invalid={fieldState.invalid}
                      placeholder="e.g. 100"
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
                    <FieldLabel htmlFor="product-discountedPrice">
                      Discounted Price <span className="text-muted-foreground font-normal">(Optional)</span>
                    </FieldLabel>
                    <Input
                      {...field}
                      id="product-discountedPrice"
                      type="number"
                      min={0}
                      aria-invalid={fieldState.invalid}
                      placeholder="e.g. 80"
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
            </FieldGroup>
          </CardContent>
          <div className="p-4 pt-2">
            <Button
              type="submit"
              className="w-full"
              disabled={form.formState.isSubmitting}
            >
              {form.formState.isSubmitting ? "Creating Product..." : "Create Product"}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}