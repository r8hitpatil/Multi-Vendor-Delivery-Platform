"use client"
import { createAdmin, getCompany } from "@/app/api/super-admin/action";
import { Company } from "@/app/generated/prisma/client";
import { Status } from "@/app/generated/prisma/enums";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useEffect, useState } from "react";
import PageLoading from "../loading";
import { zodResolver } from "@hookform/resolvers/zod"
import { Controller, useForm } from "react-hook-form"
import * as z from "zod"
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger , SelectValue } from "@/components/ui/select"; 

const formSchema = z.object({
    name : z
        .string()
        .trim()
        .min(2,"Must be at least 2 character long"),
    phone : z
        .string()
        .trim()
        .min(10,"Must be at least 10 character long"),
    password : z
        .string()
        .trim()
        .min(8,"Must be at least 8 character long"),
    email : z
        .string()
        .trim()
        .email("Invalid email address"),
    companyId : z
        .string()
        .min(1,"Company id is required"),
    status : z
        .nativeEnum(Status,{ message : "Select valid status" }),
    ban : z
        .boolean()
})

type FormValues = z.infer<typeof formSchema>;

export default function CreateAdmin(){

    const [error,setError] = useState('');
    const [companies,setCompanies] = useState<Company[]>([]);
    const [isLoading,setIsLoading] = useState(true);

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name : "",
            phone : "",
            password : "",
            email : "",
            companyId : "",
            status : undefined,
            ban : false
        },
    })

    async function onSubmit(data : FormValues){
        const { name,phone,email,companyId,password,ban, status } = data;
        const res = await createAdmin({ name,phone,email,companyId,password,ban, status });
        if(res.success){
            console.log('Created admin')
        }
        else{
            setError(res.message);
        }
    }

    useEffect(() => {
        const a = async() => {
            try {
                const res = await getCompany();
                if(res.success && res.data){
                    setCompanies(res.data);
                }
                else{
                    setError(res.message);
                }
            } catch (error:any) {
                setError(error.message);
            } finally {
                setIsLoading(false);
            }
        }
        a();
    },[])

    const companyItems = [
        { value: "", label: "Select Company" },
        ...companies.map((e) => ({ value: e.id, label: e.companyName })),
    ];

    const statusItems = [
        { value: Status.PENDING, label: Status.PENDING },
        { value: Status.ACCEPTED, label: Status.ACCEPTED },
        { value: Status.REJECTED, label: Status.REJECTED },
    ];

    if(isLoading) return <PageLoading/>

    return (
        <div className="flex w-full justify-center p-4 md:p-8">
            <Card className="w-full max-w-lg shadow-sm">
                <CardHeader>
                    <CardTitle className="text-xl">Create admin account</CardTitle>
                    <CardDescription>
                        Enter details to create admin account
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
                                placeholder="9100091000"
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
                                autoComplete="current-password"
                              />
                              {fieldState.invalid && (
                                <FieldError errors={[fieldState.error]} />
                              )}
                            </Field>
                          )}
                        />
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
                        <Controller
                          name="companyId"
                          control={form.control}
                          render={({ field, fieldState }) => (
                            <Field data-invalid={fieldState.invalid}>
                              <FieldLabel htmlFor="form-rhf-companyId">
                                Company
                              </FieldLabel>
                              <Select
                                name={field.name}
                                value={field.value}
                                onValueChange={field.onChange}
                                items={companyItems}>
                              <SelectTrigger 
                                    id="form-rhf-companyId"
                                    aria-invalid={fieldState.invalid}
                                    className="w-full">
                                <SelectValue placeholder="Select Company"/>
                              </SelectTrigger>
                              <SelectContent>
                                {companies && companies.length > 0 ? (
                                    companies.map((e) => (
                                        <SelectItem key={e.id} value={e.id}>{e.companyName}</SelectItem>
                                    ))
                                ) : (
                                    <SelectItem value="" disabled>No companies available</SelectItem>
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
                              <FieldLabel htmlFor="form-rhf-status">
                                Status
                              </FieldLabel>
                              <Select
                                name={field.name}
                                value={field.value}
                                onValueChange={field.onChange}
                                items={statusItems}>
                              <SelectTrigger 
                                    id="form-rhf-status"
                                    aria-invalid={fieldState.invalid}
                                    className="w-full">
                                <SelectValue placeholder="Select Status"/>
                              </SelectTrigger>
                              <SelectContent>
                                {statusItems && statusItems.length > 0 ? (
                                    statusItems.map((e) => (
                                        <SelectItem key={e.value} value={e.value}>{e.label}</SelectItem>
                                    ))
                                ) : (
                                    <SelectItem value="" disabled>No companies available</SelectItem>
                                )}
                              </SelectContent>
                              </Select>
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
                            {form.formState.isSubmitting ? "Creating..." : "Create Admin"}
                        </Button>
                    </div>
                    </CardContent>
                </form>
            </Card>
        </div>
    )
}