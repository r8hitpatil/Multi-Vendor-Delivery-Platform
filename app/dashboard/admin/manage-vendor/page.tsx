"use client"

import { getVendors, updateVendor } from "@/app/api/admin/action";
import { User } from "@/app/generated/prisma/client";
import { Status } from "@/app/generated/prisma/enums";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useEffect, useState } from "react";
import PageLoading from "../loading";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import * as z from "zod";

const formSchema = z.object({
  id: z.string().trim().min(1, "Please select a vendor"),
  status: z.nativeEnum(Status, { message: "Select a valid status" }),
  ban: z.boolean(),
});

type FormValues = z.infer<typeof formSchema>;

export default function ManageVendor() {
  const [error, setError] = useState("");
  const [vendor, setVendors] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      id: "",
      status: Status.PENDING,
      ban: false,
    },
  });

  const onVendorChange = (vendorId: string) => {
    form.setValue("id", vendorId, { shouldValidate: true });
    const selected = vendor.find((v) => v.id === vendorId);
    if (selected) {
      form.setValue("status", selected.status, { shouldValidate: true });
      form.setValue("ban", Boolean(selected.ban), { shouldValidate: true });
    }
  };

  async function onSubmit(data: FormValues) {
    setError("");
    const { id, status, ban } = data;
    const res = await updateVendor({ id, status, ban });
    if (res.success) {
      console.log("Updated vendor");
      setVendors((prev) =>
        prev.map((v) => (v.id === id ? { ...v, status, ban } : v))
      );
    } else {
      setError(res.message);
    }
  }

  useEffect(() => {
    const fetchVendors = async () => {
      try {
        const res = await getVendors();
        if (res.success && res.data) {
          setVendors(res.data);
        } else if (!res.success && res.message !== "No vendors found") {
          setError(res.message);
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };
    fetchVendors();
  }, []);

  const vendorItems = vendor.map((item) => ({
    value: item.id,
    label: item.name,
  }));

  const statusItems = [
    { value: Status.ACCEPTED, label: Status.ACCEPTED },
    { value: Status.REJECTED, label: Status.REJECTED },
    { value: Status.PENDING, label: Status.PENDING },
  ];

  if (isLoading) return <PageLoading />;

  return (
    <div className="flex w-full justify-center p-4 md:p-8">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Manage vendor</CardTitle>
          <CardDescription>Manage vendor accounts</CardDescription>
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
                name="ban"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field
                    orientation="horizontal"
                    data-invalid={fieldState.invalid}
                    className="items-center"
                  >
                    <Checkbox
                      id="form-vendor-ban"
                      aria-invalid={fieldState.invalid}
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                    <FieldLabel
                      htmlFor="form-vendor-ban"
                      className="cursor-pointer font-normal"
                    >
                      Ban
                    </FieldLabel>
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />

              <Controller
                name="id"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="form-vendor-id">
                      Select Vendor
                    </FieldLabel>
                    <Select
                      name={field.name}
                      value={field.value}
                      onValueChange={(val) => {
                        if (val) onVendorChange(val);
                      }}
                      items={vendorItems}
                    >
                      <SelectTrigger
                        id="form-vendor-id"
                        aria-invalid={fieldState.invalid}
                        className="w-full"
                      >
                        <SelectValue placeholder="--select option--" />
                      </SelectTrigger>
                      <SelectContent>
                        {vendor && vendor.length > 0 ? (
                          vendor.map((item) => (
                            <SelectItem key={item.id} value={item.id}>
                              {item.name}
                            </SelectItem>
                          ))
                        ) : (
                          <SelectItem value="" disabled>
                            No vendors available
                          </SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />

              <Controller
                name="status"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="form-vendor-status">
                      Select Status
                    </FieldLabel>
                    <Select
                      name={field.name}
                      value={field.value}
                      onValueChange={field.onChange}
                      items={statusItems}
                    >
                      <SelectTrigger
                        id="form-vendor-status"
                        aria-invalid={fieldState.invalid}
                        className="w-full"
                      >
                        <SelectValue placeholder="--select option--" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={Status.ACCEPTED}>
                          {Status.ACCEPTED}
                        </SelectItem>
                        <SelectItem value={Status.REJECTED}>
                          {Status.REJECTED}
                        </SelectItem>
                        <SelectItem value={Status.PENDING}>
                          {Status.PENDING}
                        </SelectItem>
                      </SelectContent>
                    </Select>
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
              {form.formState.isSubmitting ? "Updating..." : "Update Vendor"}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}