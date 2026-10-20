"use client"

import { dropAdmins, manageAdmin, selectedAdmin } from "@/app/api/super-admin/action";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button, Input } from "@base-ui/react";
import { useEffect, useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";

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

    async function handleSubmit(formData:FormData){
        const name = formData.get("name") as string;
        const phone = formData.get("phone") as string;
        const email = formData.get("email") as string;
        const ban = Boolean(formData.get("ban"));
        const res = await manageAdmin({ name,phone,email,ban });
        if(res.success && res.data){
            console.log('Created admin',res)
        }
        else{
            setError(res.message);
        }
    }

    async function selectedValue(adminId:string){
        const iteratedAdmin = await selectedAdmin(adminId);
        if(iteratedAdmin.success && iteratedAdmin.data){
            setAdminValues(iteratedAdmin.data);
        }
        else{
            setError(iteratedAdmin.message);
        }
    }

    useEffect(() => {
        async function c() {
            const a = await dropAdmins();
            if(a.success && a.data){
                setAllAdmins(a.data);
            }
            else{
                setError(a.message);
            }
        }
        c();
    },[]);

        return (
            <div>
                <div>
                    <select name="admin" id="admin-value" onChange={(e) => (selectedValue(e.target.value))} required>
                        <option>--Select value--</option>
                        {allAdmins.map((e) => (
                            <option key={e.id} value={e.id}><span>{e.name}</span></option>
                        ))}
                    </select>
                </div>
            {
                adminValues ? 
                <Card className="w-full max-w-sm">
                <CardHeader>
                    <CardTitle>Admin Panel</CardTitle>
                    <CardDescription>
                        Update admin account
                    </CardDescription>
                </CardHeader>
                <form key={adminValues.email} action={handleSubmit}>
                <CardContent>
                    {
                        error
                    }
                        <div className="flex flex-col gap-6">
                            <div className="grid gap-2">
                                <Label htmlFor="email">Name</Label>
                                <Input
                                    id="name"
                                    type="name"
                                    name="name"
                                    value={adminValues.name}
                                    placeholder="name"
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
                                    value={adminValues.email}
                                    required
                                />
                            </div>
                            <div className="grid gap-2">
                                <div className="flex items-center">
                                    <Label htmlFor="phone">Phone</Label>
                                </div>
                                <Input id="phone" name="phone" value={adminValues.phone} type="phone" placeholder="phone" required />
                            </div>
                                                        <div className="grid gap-2">
                                <Label htmlFor="ban">Ban</Label>
                                <Checkbox
                                    id="ban"
                                    name="ban"
                                    defaultChecked={Boolean(adminValues.ban)}
                                />
                            </div>
                        </div>
                </CardContent>
                <Button type="submit" className="w-full">
                    Update Admin
                </Button>
                </form>
            </Card>
            :
            <div>
                <span>
                Select admin
                </span>
            </div>
            }
            </div>
        )
}