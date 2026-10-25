"use client"

import { createDriver } from "@/app/api/admin/action";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import * as z from "zod";
import {
  Field,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";

const formSchema = z.object({
    name: z
        .string()
        .trim()
        .min(2, "Must be at least 2 character long"),
    phone: z
        .string()
        .trim()
        .min(10, "Must be at least 10 character long"),
    aadhar: z
        .string()
        .trim()
        .min(10, "Must be at least 10 character long"),
    pan: z
        .string()
        .trim()
        .min(10, "Must be at least 10 character long"),
    ban: z
        .boolean(),
    email: z
        .string()
        .trim()
        .email("Invalid email address"),
    password: z
        .string()
        .trim()
        .min(8, "Must be at least 8 character long"),
    addressDesc: z
        .string()
        .trim()
        .min(10, "Must be at least 10 character long"),
    pin_code: z
        .string()
        .trim()
        .min(4, "Must be at least 4 character long"),
    lat: z
        .string()
        .trim()
        .min(1, "Latitude is required"),
    long: z
        .string()
        .trim()
        .min(1, "Longitude is required"),
});

type FormValues = z.infer<typeof formSchema>;

export default function CreateDriver(){

    const [error, setError] = useState('');

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: "",
            phone: "",
            aadhar: "",
            pan: "",
            ban: false,
            email: "",
            password: "",
            addressDesc: "",
            pin_code: "",
            lat: "",
            long: "",
        },
    });

    async function onSubmit(data: FormValues){
        const { name, phone, aadhar, pan, ban, email, password, addressDesc, pin_code, lat, long } = data;
        const res = await createDriver({ 
            name,
            phone,
            aadhar,
            ban,
            pan,
            email,
            password,
            addressDesc,
            pin_code: Number(pin_code),
            lat,
            long,
        });
        if(res.success){
            setError('');
            form.reset();
            console.log('Created Driver');
        }
        else{
            setError(res.message);
        }
    }

    return (
        <div className="flex w-full justify-center p-4 md:p-6">
            <Card className="w-full max-w-2xl shadow-sm">
                <CardHeader className="pb-3">
                    <CardTitle className="text-xl">Driver signup page</CardTitle>
                    <CardDescription>
                        Enter driver details
                    </CardDescription>
                </CardHeader>
                <form onSubmit={form.handleSubmit(onSubmit)}>
                    <CardContent className="space-y-4">
                        {
                            error && (
                                <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">
                                    {error}
                                </div>
                            )
                        }
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3">
                            <Controller
                              name="name"
                              control={form.control}
                              render={({ field, fieldState }) => (
                                <Field data-invalid={fieldState.invalid}>
                                  <FieldLabel htmlFor="form-rhf-name">
                                    Name
                                  </FieldLabel>
                                  <Input
                                    {...field}
                                    id="form-rhf-name"
                                    type="text"
                                    aria-invalid={fieldState.invalid}
                                    placeholder="Name"
                                    autoComplete="name"
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
                                  <FieldLabel htmlFor="form-rhf-phone">
                                    Phone
                                  </FieldLabel>
                                  <Input
                                    {...field}
                                    id="form-rhf-phone"
                                    type="tel"
                                    aria-invalid={fieldState.invalid}
                                    placeholder="Phone"
                                    autoComplete="tel"
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
                                  <FieldLabel htmlFor="form-rhf-email">
                                    Email
                                  </FieldLabel>
                                  <Input
                                    {...field}
                                    id="form-rhf-email"
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
                              name="password"
                              control={form.control}
                              render={({ field, fieldState }) => (
                                <Field data-invalid={fieldState.invalid}>
                                  <FieldLabel htmlFor="form-rhf-password">
                                    Password
                                  </FieldLabel>
                                  <Input
                                    {...field}
                                    id="form-rhf-password"
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
                              name="aadhar"
                              control={form.control}
                              render={({ field, fieldState }) => (
                                <Field data-invalid={fieldState.invalid}>
                                  <FieldLabel htmlFor="form-rhf-aadhar">
                                    Aadhar
                                  </FieldLabel>
                                  <Input
                                    {...field}
                                    id="form-rhf-aadhar"
                                    type="text"
                                    aria-invalid={fieldState.invalid}
                                    placeholder="Aadhar"
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
                                  <FieldLabel htmlFor="form-rhf-pan">
                                    Pan
                                  </FieldLabel>
                                  <Input
                                    {...field}
                                    id="form-rhf-pan"
                                    type="text"
                                    aria-invalid={fieldState.invalid}
                                    placeholder="Pan"
                                  />
                                  {fieldState.invalid && (
                                    <FieldError errors={[fieldState.error]} />
                                  )}
                                </Field>
                              )}
                            />

                            <Controller
                              name="addressDesc"
                              control={form.control}
                              render={({ field, fieldState }) => (
                                <Field data-invalid={fieldState.invalid}>
                                  <FieldLabel htmlFor="form-rhf-addressDesc">
                                    Address
                                  </FieldLabel>
                                  <Input
                                    {...field}
                                    id="form-rhf-addressDesc"
                                    type="text"
                                    aria-invalid={fieldState.invalid}
                                    placeholder="Address"
                                    autoComplete="street-address"
                                  />
                                  {fieldState.invalid && (
                                    <FieldError errors={[fieldState.error]} />
                                  )}
                                </Field>
                              )}
                            />

                            <Controller
                              name="pin_code"
                              control={form.control}
                              render={({ field, fieldState }) => (
                                <Field data-invalid={fieldState.invalid}>
                                  <FieldLabel htmlFor="form-rhf-pin_code">
                                    Pin-code
                                  </FieldLabel>
                                  <Input
                                    {...field}
                                    id="form-rhf-pin_code"
                                    type="text"
                                    inputMode="numeric"
                                    aria-invalid={fieldState.invalid}
                                    placeholder="Pin-code"
                                    autoComplete="postal-code"
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
                                  <FieldLabel htmlFor="form-rhf-lat">
                                    Latitude
                                  </FieldLabel>
                                  <Input
                                    {...field}
                                    id="form-rhf-lat"
                                    type="text"
                                    aria-invalid={fieldState.invalid}
                                    placeholder="Lat"
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
                                  <FieldLabel htmlFor="form-rhf-long">
                                    Longitude
                                  </FieldLabel>
                                  <Input
                                    {...field}
                                    id="form-rhf-long"
                                    type="text"
                                    aria-invalid={fieldState.invalid}
                                    placeholder="Long"
                                  />
                                  {fieldState.invalid && (
                                    <FieldError errors={[fieldState.error]} />
                                  )}
                                </Field>
                              )}
                            />

                            <div className="sm:col-span-2 pt-1">
                                <Controller
                                  name="ban"
                                  control={form.control}
                                  render={({ field, fieldState }) => (
                                    <Field orientation="horizontal" data-invalid={fieldState.invalid} className="items-center">
                                      <Checkbox
                                        id="form-rhf-ban"
                                        aria-invalid={fieldState.invalid}
                                        checked={field.value}
                                        onCheckedChange={field.onChange}
                                      />
                                      <FieldLabel htmlFor="form-rhf-ban" className="cursor-pointer font-normal">
                                        Ban account
                                      </FieldLabel>
                                      {fieldState.invalid && (
                                        <FieldError errors={[fieldState.error]} />
                                      )}
                                    </Field>
                                  )}
                                />
                            </div>
                        </div>

                        <div className="flex items-center justify-between pt-2">
                            <Button type="button" variant="outline" onClick={() => form.reset()}>
                                Reset
                            </Button>
                            <Button type="submit" disabled={form.formState.isSubmitting}>
                                {form.formState.isSubmitting ? "Creating..." : "Create Driver"}
                            </Button>
                        </div>
                    </CardContent>
                </form>
            </Card>
        </div>
    );
}