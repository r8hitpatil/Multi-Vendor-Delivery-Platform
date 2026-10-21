"use client"
import { createAdmin, getCompany } from "@/app/api/super-admin/action";
import { Company } from "@/app/generated/prisma/client";
import { Role } from "@/app/generated/prisma/enums";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button, Input } from "@base-ui/react";
import { useEffect, useState } from "react";

export default function CreateAdmin(){

    const [error,setError] = useState('');
    const [companies,setCompanies] = useState<Company[]>([]);

    async function handleSubmit(formData:FormData){
        const name = formData.get("name") as string;
        const phone = formData.get("phone") as string;
        const email = formData.get("email") as string;
        const password = formData.get("password") as string;
        const companyId = formData.get("companyId") as string;
        const ban = Boolean(formData.get("ban"));
        const Role = formData.get("role") as Role;
        const res = await createAdmin({ name,phone,email,companyId,password,ban, Role });
        if(res.success && res.data){
            console.log('Created admin',res)
        }
        else{
            setError(res.message);
        }
    }

    useEffect(() => {
        const a = async() => {
            const res = await getCompany();
            if(res.success && res.data){
                setCompanies(res.data);
            }
            else{
                setError(res.message);
            }
        }
        a();
    },[])

    return (
        <div>
            <Card className="w-full max-w-sm">
                <CardHeader>
                    <CardTitle>Create admin account</CardTitle>
                    <CardDescription>
                        Enter details to create admin account
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
                                <div className="flex items-center">
                                    <Label htmlFor="comapany">Company</Label>
                                </div>
                                <select name="companyId" id="companyId" required>
                                    {companies?.map((item:any) => (
                                        <option key={item.id} value={item.id}><span>{item.companyName}</span></option>
                                    ))}
                                </select>
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="ban">Ban</Label>
                                <Input
                                    id="ban"
                                    type="checkbox"
                                    name="ban"
                                    placeholder="ban"
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