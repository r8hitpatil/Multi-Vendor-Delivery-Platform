"use client"

import { createVendor, getAdmins } from "@/app/api/admin/action";
import { getCompany } from "@/app/api/super-admin/action";
import { createVendorSchema } from "@/app/(auth)/schema";
import { Company, User } from "@/app/generated/prisma/client";
import PageLoading from "@/components/page-loading";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Field,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import * as z from "zod";
import Link from "next/link";
import { cn } from "cn";

type FormValues = z.infer<typeof createVendorSchema>;

export default function VendorSignupPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [company, setCompany] = useState<Company[]>([]);
  const [admins, setAdmins] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const form = useForm<FormValues>({
    resolver: zodResolver(createVendorSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      phone: "",
      aadhar: "",
      pan: "",
      companyId: "",
      adminId: "",
    },
  });

  async function getAllAdmins(companyId: string) {
    if (!companyId) {
      setAdmins([]);
      return;
    }
    const res = await getAdmins(companyId);
    if (res.success && res.data) {
      setAdmins(res.data);
    } else {
      setAdmins([]);
      setError(res.message);
    }
  }

  const handleCompanyChange = async (companyId: string) => {
    form.setValue("companyId", companyId, { shouldValidate: true });
    form.setValue("adminId", "", { shouldValidate: true });
    setAdmins([]);
    await getAllAdmins(companyId);
  };

  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        const res = await getCompany();
        if (res.success && res.data) {
          setCompany(res.data);
        } else {
          setError(res.message);
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };
    fetchCompanies();
  }, []);

  async function onSubmit(data: FormValues) {
    setError(null);
    const res = await createVendor(data);

    if (res.success) {
      return router.push("/");
    } else {
      setError(res.message);
    }
  }

  const companyItems = company.map((c) => ({
    value: c.id,
    label: c.companyName,
  }));

  const adminItems = admins.map((a) => ({
    value: a.id,
    label: a.name,
  }));

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <PageLoading />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full items-center justify-center p-4 md:p-8">
      <Card className="w-full max-w-2xl shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-xl">Vendor Registration</CardTitle>
          <CardDescription>
            Enter your details to create a vendor account
          </CardDescription>
          <CardAction>
            <Link
              href="/login"
              className={cn(buttonVariants({ variant: "link" }), "p-0 h-auto text-xs")}
            >
              Already registered? Sign In
            </Link>
          </CardAction>
        </CardHeader>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            {error && (
              <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">
                {error}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3">
              <Controller
                name="name"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="vendor-name">Name</FieldLabel>
                    <Input
                      {...field}
                      id="vendor-name"
                      type="text"
                      aria-invalid={fieldState.invalid}
                      placeholder="Full Name"
                      autoComplete="name"
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />

              <Controller
                name="email"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="vendor-email">Email</FieldLabel>
                    <Input
                      {...field}
                      id="vendor-email"
                      type="email"
                      aria-invalid={fieldState.invalid}
                      placeholder="name@example.com"
                      autoComplete="email"
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />

              <Controller
                name="phone"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="vendor-phone">Phone</FieldLabel>
                    <Input
                      {...field}
                      id="vendor-phone"
                      type="tel"
                      inputMode="numeric"
                      maxLength={10}
                      aria-invalid={fieldState.invalid}
                      placeholder="10-digit phone number"
                      autoComplete="tel"
                      onChange={(e) => {
                        const digits = e.target.value.replace(/\D/g, "").slice(0, 10);
                        field.onChange(digits);
                      }}
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />

              <Controller
                name="password"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="vendor-password">Password</FieldLabel>
                    <Input
                      {...field}
                      id="vendor-password"
                      type="password"
                      aria-invalid={fieldState.invalid}
                      placeholder="••••••••"
                      autoComplete="new-password"
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />

              <Controller
                name="companyId"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="vendor-company">Company</FieldLabel>
                    <Select
                      name={field.name}
                      value={field.value}
                      onValueChange={(val) => {
                        if (val) handleCompanyChange(val);
                      }}
                      items={companyItems}
                    >
                      <SelectTrigger
                        id="vendor-company"
                        aria-invalid={fieldState.invalid}
                        className="w-full"
                      >
                        <SelectValue placeholder="Select Company" />
                      </SelectTrigger>
                      <SelectContent>
                        {company && company.length > 0 ? (
                          company.map((c) => (
                            <SelectItem key={c.id} value={c.id}>
                              {c.companyName}
                            </SelectItem>
                          ))
                        ) : (
                          <SelectItem value="" disabled>
                            No companies available
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
                name="adminId"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="vendor-admin">Admin</FieldLabel>
                    <Select
                      name={field.name}
                      value={field.value}
                      onValueChange={(val) => {
                        if (val) form.setValue("adminId", val, { shouldValidate: true });
                      }}
                      items={adminItems}
                    >
                      <SelectTrigger
                        id="vendor-admin"
                        aria-invalid={fieldState.invalid}
                        className="w-full"
                        disabled={!form.watch("companyId") || admins.length === 0}
                      >
                        <SelectValue
                          placeholder={
                            !form.watch("companyId")
                              ? "Select company first"
                              : admins.length === 0
                              ? "No admins for company"
                              : "Select Admin"
                          }
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {admins && admins.length > 0 ? (
                          admins.map((a) => (
                            <SelectItem key={a.id} value={a.id}>
                              {a.name}
                            </SelectItem>
                          ))
                        ) : (
                          <SelectItem value="" disabled>
                            No admins available
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
                name="aadhar"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="vendor-aadhar">Aadhar</FieldLabel>
                    <Input
                      {...field}
                      id="vendor-aadhar"
                      type="text"
                      inputMode="numeric"
                      maxLength={12}
                      aria-invalid={fieldState.invalid}
                      placeholder="12-digit Aadhar number"
                      onChange={(e) => {
                        const digits = e.target.value.replace(/\D/g, "").slice(0, 12);
                        field.onChange(digits);
                      }}
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />

              <Controller
                name="pan"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="vendor-pan">PAN</FieldLabel>
                    <Input
                      {...field}
                      id="vendor-pan"
                      type="text"
                      inputMode="numeric"
                      maxLength={10}
                      aria-invalid={fieldState.invalid}
                      placeholder="10-digit PAN number"
                      onChange={(e) => {
                        const digits = e.target.value.replace(/\D/g, "").slice(0, 10);
                        field.onChange(digits);
                      }}
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
            </div>

            <Button
              type="submit"
              className="w-full mt-4"
              disabled={form.formState.isSubmitting}
            >
              {form.formState.isSubmitting
                ? "Creating Vendor Account..."
                : "Register as Vendor"}
            </Button>
          </CardContent>
        </form>
      </Card>
    </div>
  );
}