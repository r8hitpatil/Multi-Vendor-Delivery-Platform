"use client"
import { getVendors, updateVendor } from "@/app/api/admin/action";
import { User } from "@/app/generated/prisma/client";
import { Status } from "@/app/generated/prisma/enums";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button, Input } from "@base-ui/react";
import { useEffect, useState } from "react";
import PageLoading from "../loading";

export default function ManageVendor(){

    const [error,setError] = useState('');
    const [vendor,setVendors] = useState<User[]>([]);
    const [isLoading,setIsLoading] = useState(true);

    async function handleSubmit(formData:FormData){
        const status = formData.get("status") as Status;
        const ban = Boolean(formData.get("ban"));
        const id= formData.get("vendor-id") as string;
        const res = await updateVendor({ id,status,ban });
        if(res.success){
            console.log('Updated vendor');
        }
        else{
            setError(res.message);
        }
    }

    useEffect(() => {
        const a = async() => {
            try {
                const res = await getVendors();
                if(res.success && res.data){
                    setVendors(res.data);
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

    if(isLoading) return <PageLoading/>

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
                                <Label htmlFor="ban">Ban</Label>
                                <Input
                                    id="ban"
                                    type="checkbox"
                                    name="ban"
                                    placeholder="ban"
                                />
                            </div>
                            <div>
                                <select name="vendor-id" required>
                                    <option value="">--select option--</option>
                                    {vendor.map((item) => (
                                        <option key={item.id} value={item.id}>{item.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <select name="status" required>
                                    <option value="">--select option--</option>
                                    <option value={Status.ACCEPTED}>{Status.ACCEPTED}</option>
                                    <option value={Status.REJECTED}>{Status.REJECTED}</option>
                                    <option value={Status.PENDING}>{Status.PENDING}</option>
                                </select>
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