"use client"
import { createAdmin } from "@/app/api/super-admin/action";
import { Role } from "@/app/generated/prisma/enums";
import { Card, CardAction, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button, Input } from "@base-ui/react";
import { useState } from "react";

export default function CreateAdmin(){

    const [error,setError] = useState('');

    async function handleSubmit(formData:FormData){
        const name = formData.get("name") as string;
        const phone = formData.get("phone") as string;
        const email = formData.get("email") as string;
        const password = formData.get("password") as string;
        const ban = Boolean(formData.get("ban"));
        const Role = formData.get("role") as Role;
        const res = await createAdmin({ name,phone,email,password,ban, Role });
        if(res.success && res.data){
            console.log('Created admin',res)
        }
        else{
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
                        <Button type="button">Sign Up</Button>
                    </CardAction>
                </CardHeader>
                <form action={handleSubmit}>
                <CardContent>
                    {
                        error
                    }
                        <div className="flex flex-col gap-6">
                            <div className="grid gap-2">
                                <Label htmlFor="name">Name</Label>
                                <Input
                                    id="name"
                                    type="name"
                                    name="name"
                                    placeholder="Name"
                                    required
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="phone">Phone</Label>
                                <Input
                                    id="phone"
                                    type="number"
                                    name="phone"
                                    placeholder="phone"
                                    required
                                />
                            </div>
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
                            <div className="grid gap-2">
                                <Label htmlFor="ban">Ban</Label>
                                <Input
                                    id="ban"
                                    type="checkbox"
                                    name="ban"
                                    placeholder="ban"
                                    required
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="role">Role</Label>
                                <select name="role" id="role" required>
                                    <option value="">--Select option--</option>
                                    <option value="ADMIN">Admin</option>
                                </select>
                            </div>
                        </div>
                </CardContent>
                <Button type="submit" className="w-full">
                    Create Admin
                </Button>
                </form>
            </Card>
        </div>
    )
}