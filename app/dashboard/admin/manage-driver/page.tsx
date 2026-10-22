"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@base-ui/react";
import { useEffect, useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import type { User } from "@/app/generated/prisma/client";
import { getDrivers, manageDriver, selectedDriver } from "@/app/api/admin/action";

export default function ManageDriver(){

    const [drivers,setDrivers] = useState<User[]>([]);
    const [selectDriver,setSelectDriver] = useState<any>();
    const [error,setError] = useState('');

    async function selectedValue(id:string){
        if(!id){
            setSelectDriver(undefined);
            return;
        }
        const res = await selectedDriver(id);
        if(res.success && res.data){
            setSelectDriver(res.data);
        }
        else{
            setError(res.message);
        }
    } 

    async function handleSubmit(formData:FormData) {
        const ban = Boolean(formData.get("ban"));
        const id = formData.get("admin-id") as string;
        const res = await manageDriver({  id , ban });
        if(res.success){
            console.log('Updated',res)
        }
        else{
            setError(res.message);
        }
    }

    useEffect(() => {
        const a = async () => {
            const res = await getDrivers();
            if(res.success && res.data){
                setDrivers(res.data);
            }
        };
        a();
    },[])

    return (
        <div>
            <div>
                <select name="admin" id="admin-value" onChange={(e) => (selectedValue(e.target.value))} required>
                    <option value="">--Select value--</option>
                    {drivers.map((e) => (
                        <option key={e.id} value={e.id}><span>{e.name}</span></option>
                    ))}
                </select>
            </div>
        {
            selectDriver ? 
            <Card className="w-full max-w-sm">
            <CardHeader>
                <CardTitle>Driver Panel</CardTitle>
                <CardDescription>
                    Update driver
                </CardDescription>
            </CardHeader>
            <form key={selectDriver?.email} action={handleSubmit}>
            <CardContent>
                {
                    error
                }
                    <div className="flex flex-col gap-6">
                        <div className="grid gap-2">
                            <Label htmlFor="ban">Ban</Label>
                            <Checkbox
                                id="ban"
                                name="ban"
                                defaultChecked={Boolean(selectDriver?.ban)}
                                />
                        </div>
                    </div>
            </CardContent>
            <Button type="submit" className="w-full">
                Update Driver
            </Button>
            </form>
        </Card>
        :
        <div>
            <span>
            Update driver
            </span>
        </div>
        }
        </div>
    )
}