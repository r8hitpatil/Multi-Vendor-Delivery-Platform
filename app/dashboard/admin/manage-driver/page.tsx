"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@base-ui/react";
import { useEffect, useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import type { User } from "@/app/generated/prisma/client";
import { getDrivers, getPendingVendors, manageDriver, selectedDriver } from "@/app/api/admin/action";
import PageLoading from "../loading";

export default function ManageDriver(){

    const [drivers,setDrivers] = useState<User[]>([]);
    const [selectDriver,setSelectDriver] = useState<any>();
    const [error,setError] = useState('');
    const [isLoading,setIsLoading] = useState(true);

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
        if(!selectDriver?.id) return;

        const ban = Boolean(formData.get("ban"));
        const res = await manageDriver({  id:selectDriver.id , ban });
        if(res.success){
            console.log('Updated',res)
        }
        else{
            setError(res.message);
        }
    }

    useEffect(() => {
        const a = async () => {
            try {
                const res = await getDrivers();
                if(res.success && res.data){
                    setDrivers(res.data);
                }
            } catch (error:any) {
                setError(error.message);
            } finally {
                setIsLoading(false);
            }
        };
        a();
    },[])

    if(isLoading) return <PageLoading/>

    return (
        <div>
            <div>
                <select name="driver" id="driver-id" onChange={(e) => (selectedValue(e.target.value))} required>
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