"use client"

import { createVendor, getAdmins } from "@/app/api/admin/action";
import { getCompany } from "@/app/api/super-admin/action";
import { Company, User } from "@/app/generated/prisma/client";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function VendorSignupPage (){

    const router = useRouter();
    const [error,setError] = useState<string | null>(null);
    const [company,setCompany] = useState<Company[]>([]);
    const [admins,setAdmins] = useState<User[]>([]);

    
    async function getAllAdmins(companyId:string){
        const res = await getAdmins(companyId);
        if(res.success && res.data){
            setAdmins(res.data);
        }
        else{
            setError(res.message);
        }
    }

    useEffect(() => {
        const a = async () => {
            const res = await getCompany();
            if(res.success && res.data){
                setCompany(res.data);
            }
            else{
                setError(res.message);
            }
        }
        a();
    },[])

    async function handleSubmit(formData:FormData){
        const name = formData.get("name") as string;
        const email = formData.get("email") as string;
        const password = formData.get("password") as string;
        const companyId = formData.get("company") as string;
        const aadhar = formData.get("aadhar") as string;
        const pan = formData.get("pan") as string;
        const phone = formData.get("phone") as string;
        const adminId = formData.get("admin") as string || "";

        const res = await createVendor({
            name,
            email,
            password,
            companyId,
            aadhar,
            adminId,
            pan,
            phone
        })

        if(res.success){
            return router.push('/');
        }
        else {
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
                            <div className="flex items-center">
                                <Label htmlFor="company">Company</Label>
                                <select name="company" onChange={(e) =>{
                                    getAllAdmins(e.target.value);
                                    setAdmins([])
                                }} required>
                                    <option value="">--select option--</option>
                                    {company?.map((e) => (
                                        <option key={e.id} value={e.id}>{e.companyName}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="flex items-center">
                                <Label htmlFor="admin">Admins</Label>
                                <select name="admin" required>
                                    <option value="">--select option--</option>
                                    {admins.map((e) => (
                                        <option key={e.id} value={e.id}>{e.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="aadhar">Aadhar</Label>
                                <Input
                                    id="aadhar"
                                    type="aadhar"
                                    name="aadhar"
                                    placeholder="Aadhar"
                                    required
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="pan">PAN</Label>
                                <Input
                                    id="pan"
                                    type="pan"
                                    name="pan"
                                    placeholder="pan"
                                    required
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="phone">Phone</Label>
                                <Input
                                    id="phone"
                                    type="phone"
                                    name="phone"
                                    placeholder="Phone"
                                    required
                                />
                            </div>
                        </div>
                </CardContent>
                <Button type="submit" className="w-full">
                    Create Vendor
                </Button>
                </form>
            </Card>
        </div>
    )
}