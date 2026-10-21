"use client"

import {
    Card,
    CardAction,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { loginAction } from "@/app/api/auth/action"
import { useState } from "react"

export default function LoginPage() {

    const router = useRouter();
    const [error,setError] = useState<string | null>(null);
    async function handleSubmit (formData: FormData) {
        const email = formData.get("email") as string;
        const password = formData.get("password") as string;

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
        <div>
            <Card className="w-full max-w-sm">
                <CardHeader>
                    <CardTitle>Login to your account</CardTitle>
                    <CardDescription>
                        Enter your email below to login to your account
                    </CardDescription>
                    <CardAction>
                        <Button variant="link">Sign Up</Button>
                    </CardAction>
                </CardHeader>
                <form action={handleSubmit}>
                <CardContent>
                    {
                        error
                    }
                        <div className="flex flex-col gap-6">
                            <div className="grid gap-2">
                                <Label htmlFor="email">Email</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    name="email"
                                    placeholder="Email"
                                    required
                                />
                            </div>
                            <div className="grid gap-2">
                                <div className="flex items-center">
                                    <Label htmlFor="password">Password</Label>
                                </div>
                                <Input id="password" name="password" type="password" placeholder="Password" required />
                            </div>
                        </div>
                </CardContent>
                <Button type="submit" className="w-full">
                    Login
                </Button>
                </form>
            </Card>
        </div>
    )
}