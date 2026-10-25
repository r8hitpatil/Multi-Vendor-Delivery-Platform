"use client"

import {
    Card,
    CardAction,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { loginAction } from "@/app/api/auth/action"
import { useState } from "react"
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
  email: z
    .email("Enter valid email"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters.")
    .max(12, "Password must be at most 12 characters."),
})

type FormValues = z.infer<typeof formSchema>;

export default function LoginPage() {

    const router = useRouter();
    const [error,setError] = useState<string | null>(null);

    const form = useForm<FormValues>({
      resolver: zodResolver(formSchema),
      defaultValues: {
        email: "",
        password: "",
      },
    })

    async function onSubmit (data: FormValues) {
        const {email,password} = data;

        const res = await loginAction({ email,password });

        if(res.success && res.data){
            const { role } = res.data;
            switch(role) {
                case 'SUPER_ADMIN':
                    router.push('/dashboard/super-admin');
                    break;
                case 'ADMIN':
                    router.push('/dashboard/admin');
                    break;
                case 'VENDOR':
                    router.push('/dashboard/vendor');
                    break;
                case 'CUSTOMER':
                    router.push('/dashboard');
                    break;
            }
        } else {
            setError(res.message);
        }
    }

    return (
        <div className="flex min-h-screen w-full items-center justify-center p-4 md:p-8">
            <Card className="w-full max-w-sm shadow-sm">
                <CardHeader>
                    <CardTitle className="text-xl">Login to your account</CardTitle>
                    <CardDescription>
                        Enter your email below to login to your account
                    </CardDescription>
                </CardHeader>
                <form id="form-rhf-login" onSubmit={form.handleSubmit(onSubmit)}>
                    <CardContent>
                        {
                            error && (
                                <div className="mb-4 rounded-md bg-destructive/15 p-3 text-sm text-destructive">
                                    {error}
                                </div>
                            )
                        }
                    <FieldGroup className="flex flex-col gap-4">
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
                    </FieldGroup>
                    </CardContent>
                </form>
                <CardFooter>
                    <Field orientation="horizontal" className="flex w-full items-center justify-between">
                      <Button type="button" variant="outline" onClick={() => form.reset()}>
                        Reset
                      </Button>
                      <Button type="submit" form="form-rhf-login">
                        Login
                      </Button>
                    </Field>
                </CardFooter>
            </Card>
        </div>
    )
}