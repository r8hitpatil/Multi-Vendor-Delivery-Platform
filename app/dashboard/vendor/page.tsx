"use client"

import { requireVendor } from "@/app/api/auth/action";
import { createStore } from "@/app/api/vendor/action";
import { createStoreSchema } from "@/app/api/vendor/schema";
import { Status } from "@/app/generated/prisma/enums";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { useEffect, useState } from "react";
import PageLoading from "./loading";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import * as z from "zod";

type FormValues = z.infer<typeof createStoreSchema>;

export default function VendorPage() {
  const [error, setError] = useState("");
  const [status, setStatus] = useState<Status>();
  const [hasStore, setHasStore] = useState(true);
  const [isLoading, setIsLoading] = useState(true);

  const form = useForm<FormValues>({
    resolver: zodResolver(createStoreSchema),
    defaultValues: {
      storeName: "",
      storeAddress: "",
      lat: "",
      long: "",
    },
  });

  async function onSubmit(data: FormValues) {
    setError("");
    const res = await createStore(data);

    if (res.success) {
      setHasStore(true);
      window.location.reload();
    } else {
      setError(res.message);
    }
  }

  useEffect(() => {
    const a = async () => {
      try {
        const res = await requireVendor();
        setStatus(res.status);
        setHasStore(Boolean(res.storeId));
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };
    a();
  }, []);

  if (isLoading) return <PageLoading />;

  if (status === "PENDING") {
    return (
      <div className="flex w-full justify-center p-4 md:p-8">
        <Card className="w-full max-w-sm">
          <CardHeader>
            <CardTitle>Approval Pending</CardTitle>
            <CardDescription>
              Pending for approval....
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (status === "REJECTED") {
    return (
      <div className="flex w-full justify-center p-4 md:p-8">
        <Card className="w-full max-w-sm">
          <CardHeader>
            <CardTitle>Account Rejected</CardTitle>
            <CardDescription>
              Reject your approval....
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (hasStore) {
    return (
      <div className="flex w-full justify-center p-4 md:p-8">
        <Card className="w-full max-w-sm">
          <CardHeader>
            <CardTitle>Store Exists</CardTitle>
            <CardDescription>
              You already have a store.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex w-full justify-center p-4 md:p-8">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Create store</CardTitle>
          <CardDescription>Enter your store details</CardDescription>
        </CardHeader>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent>
            {error && (
              <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive mb-4">
                {error}
              </div>
            )}
            <FieldGroup className="flex flex-col gap-4">
              <Controller
                name="storeName"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="store-name">Store name</FieldLabel>
                    <Input
                      {...field}
                      id="store-name"
                      type="text"
                      aria-invalid={fieldState.invalid}
                      placeholder="Name"
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />

              <Controller
                name="storeAddress"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="store-address">Address</FieldLabel>
                    <Input
                      {...field}
                      id="store-address"
                      type="text"
                      aria-invalid={fieldState.invalid}
                      placeholder="Address"
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />

              <Controller
                name="lat"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="store-lat">Latitude</FieldLabel>
                    <Input
                      {...field}
                      id="store-lat"
                      type="text"
                      aria-invalid={fieldState.invalid}
                      placeholder="lat"
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />

              <Controller
                name="long"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="store-long">Longitude</FieldLabel>
                    <Input
                      {...field}
                      id="store-long"
                      type="text"
                      aria-invalid={fieldState.invalid}
                      placeholder="long"
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
              {form.formState.isSubmitting ? "Creating Store..." : "Create Store"}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}