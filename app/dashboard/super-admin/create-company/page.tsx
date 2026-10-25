"use client"

import { createCompany } from "@/app/api/super-admin/action";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod"
import { Controller, useForm } from "react-hook-form"
import * as z from "zod"
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"

const formSchema = z.object({
    companyName : z
        .string()
        .trim()
        .min(2,"Must be at least 2 character long"),
    about : z
        .string()
        .trim()
        .min(10,"Must be at least 10 character long"),
    addressDesc : z
        .string()
        .trim()
        .min(10,"Must be at least 10 character long"),
    pin_code : z
        .string()
        .trim()
        .min(4,"Must be at least 4 character long"),
    lat : z
        .string()
        .min(1,"Lat is required"),
    long : z
        .string()
        .min(1,"Long is required"),
})

type FormValues = z.infer<typeof formSchema>;

export default function CreateCompany(){

    const [error,setError] = useState('');

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            companyName : "",
            about : "",
            addressDesc : "",
            pin_code : "",
            lat : "",
            long : ""
        },
    })

    async function onSubmit(data:FormValues){
        const {companyName ,about , addressDesc , pin_code , lat,long} = data;
        const res = await createCompany({
            companyName,
            about,
            addressDesc,
            pin_code: Number(pin_code),
            lat,
            long
        });
        if(res.success){
            setError('');
            form.reset();
            console.log('Created company successfully')
        }
        else{
            setError(res.message)
        }
    }
    return (
        <div className="flex w-full justify-center p-4 md:p-8">
            <Card className="w-full max-w-lg shadow-sm">
                <CardHeader>
                    <CardTitle>Create company</CardTitle>
                    <CardDescription>
                        Enter details to create company
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
                        <FieldGroup className="flex flex-col gap-4">
                        <Controller
                          name="companyName"
                          control={form.control}
                          render={({ field, fieldState }) => (
                            <Field data-invalid={fieldState.invalid}>
                              <FieldLabel htmlFor="form-rhf-companyName">
                                Company name
                              </FieldLabel>
                              <Input
                                {...field}
                                id="form-rhf-companyName"
                                type="text"
                                aria-invalid={fieldState.invalid}
                                placeholder="Company name"
                                autoComplete="name"
                              />
                              {fieldState.invalid && (
                                <FieldError errors={[fieldState.error]} />
                              )}
                            </Field>
                          )}
                        />
                        <Controller
                          name="about"
                          control={form.control}
                          render={({ field, fieldState }) => (
                            <Field data-invalid={fieldState.invalid}>
                              <FieldLabel htmlFor="form-rhf-about">
                                About
                              </FieldLabel>
                              <Input
                                {...field}
                                id="form-rhf-about"
                                type="text"
                                aria-invalid={fieldState.invalid}
                                placeholder="About company"
                                autoComplete="off"
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
                                placeholder="Company address"
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
                                Pin code
                              </FieldLabel>
                              <Input
                                {...field}
                                id="form-rhf-pin_code"
                                type="text"
                                inputMode="numeric"
                                aria-invalid={fieldState.invalid}
                                placeholder="Pin code (e.g. 400001)"
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
                                placeholder="Latitude (e.g. 19.0760)"
                                autoComplete="off"
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
                                placeholder="Longitude (e.g. 72.8777)"
                                autoComplete="off"
                              />
                              {fieldState.invalid && (
                                <FieldError errors={[fieldState.error]} />
                              )}
                            </Field>
                          )}
                        />
                    </FieldGroup>
                    <div className="flex items-center justify-between pt-2">
                        <Button type="button" variant="outline" onClick={() => form.reset()}>
                            Reset
                        </Button>
                        <Button type="submit" disabled={form.formState.isSubmitting}>
                            {form.formState.isSubmitting ? "Creating..." : "Create Company"}
                        </Button>
                    </div>
                    </CardContent>
                </form>
            </Card>
        </div>
    )
}