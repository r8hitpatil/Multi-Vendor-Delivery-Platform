"use client"

import { dropAdmins, manageAdmin, selectedAdmin } from "@/app/api/super-admin/action";
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
import { Status } from "@/app/generated/prisma/enums";

const formSchema = z.object({
    name : z
        .string()
        .trim()
        .min(2,"Must be at least 2 character long"),
    phone : z
        .string()
        .trim()
        .min(10,"Must be at least 10 character long"),
    email : z
        .string()
        .trim()
        .email("Invalid email address"),
    status : z
        .nativeEnum(Status,{ message : "Select valid status" }),
    ban : z
        .boolean()
})

type FormValues = z.infer<typeof formSchema>;


type Admin = {
    id: string;
    name: string;
    email: string;
    phone: string;
    ban: boolean;
};

export default function ManageAdmin() {

    const [error,setError] = useState('');
    const [allAdmins,setAllAdmins] = useState<Admin[]>([]);
    const [adminValues,setAdminValues] = useState<any>();
    const [isLoading,setIsLoading] = useState(true);

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: "",
            phone: "",
            email: "",
            status: Status.PENDING,
            ban: false,
        },
        values: adminValues ? {
            name: adminValues.name ?? "",
            phone: adminValues.phone ?? "",
            email: adminValues.email ?? "",
            status: adminValues.status ?? Status.PENDING,
            ban: adminValues.ban ?? false,
        } : undefined,
    })

    async function onSubmit(data:FormValues){
        const { name,phone,email,ban,status} = data;
        const res = await manageAdmin({ name,phone,email,ban,status});
        if(res.success){
            console.log('Updated admin')
        }
        else{
            setError(res.message);
        }
    }

    async function selectedValue(adminId:string){
        if (!adminId) {
            setAdminValues(undefined);
            form.reset({
                name: "",
                phone: "",
                email: "",
                status: Status.PENDING,
                ban: false,
            });
            return;
        }
        const iteratedAdmin = await selectedAdmin(adminId);
        if(iteratedAdmin.success && iteratedAdmin.data){
            setAdminValues(iteratedAdmin.data);
            form.reset({
                name: iteratedAdmin.data.name ?? "",
                phone: iteratedAdmin.data.phone ?? "",
                email: iteratedAdmin.data.email ?? "",
                status: iteratedAdmin.data.status ?? Status.PENDING,
                ban: iteratedAdmin.data.ban ?? false,
            });
        }
        else{
            setError(iteratedAdmin.message);
        }
    }

    useEffect(() => {
        async function c() {
            try {
                const a = await dropAdmins();
                if(a.success && a.data){
                    setAllAdmins(a.data);
                }
                else{
                    setError(a.message);
                }
            } catch (error:any) {
                setError(error.message)
            }
            finally {
                setIsLoading(false);
            }
        }
        c();
    },[]);

    
    const statusItems = [
        { value: Status.PENDING, label: Status.PENDING },
        { value: Status.ACCEPTED, label: Status.ACCEPTED },
        { value: Status.REJECTED, label: Status.REJECTED },
    ];

    if(isLoading) return <PageLoading/>

    return (
        <div className="flex w-full justify-center p-4 md:p-8">
            <div className="flex w-full max-w-lg flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                    <label htmlFor="admin-value" className="text-sm font-medium text-muted-foreground">
                        Select Admin
                    </label>
                    <select
                        name="admin"
                        id="admin-value"
                        value={adminValues?.id ?? ""}
                        onChange={(e) => selectedValue(e.target.value)}
                        className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 dark:bg-input/30"
                        required
                    >
                        <option value="">Select Admin</option>
                        {allAdmins.map((e) => (
                            <option key={e.id} value={e.id} className="bg-popover text-popover-foreground">
                                {e.name}
                            </option>
                        ))}
                    </select>
                </div>

                {adminValues ? (
                    <Card className="w-full shadow-sm">
                        <CardHeader>
                            <CardTitle className="text-xl">Admin Panel</CardTitle>
                            <CardDescription>
                                Update admin account
                            </CardDescription>
                        </CardHeader>
                        <form onSubmit={form.handleSubmit(onSubmit)}>
                            <CardContent className="space-y-4">
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
                                            <SelectItem value="PENDING">{Status.PENDING}</SelectItem>
                                            <SelectItem value="ACCEPTED">{Status.ACCEPTED}</SelectItem>
                                            <SelectItem value="REJECTED">{Status.REJECTED}</SelectItem>
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
                                        {form.formState.isSubmitting ? "Updating..." : "Update Admin"}
                                    </Button>
                                </div>
                            </CardContent>
                        </form>
                    </Card>
                ) : (
                    <Card className="w-full shadow-sm">
                        <CardContent className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
                            <p className="text-sm">Please select an admin from the dropdown above to view and update their account.</p>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    )
}