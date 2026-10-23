"use client"

import { requireVendor } from "@/app/api/auth/action";
import { createStore } from "@/app/api/vendor/action";
import { Status } from "@/app/generated/prisma/enums";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useEffect, useState } from "react"

export default function VendorPage(){

    const [error,setError] = useState('');
    const [status,setStatus] = useState<Status>();
    const [hasStore,setHasStore] = useState(true);
    const [isLoading,setIsLoading] = useState(true);

    async function handleSubmit (formData : FormData) {
        const storeName = formData.get("name") as string;
        const storeAddress = formData.get("address") as string;
        const lat = formData.get("lat") as string;
        const long = formData.get("long") as string;

        const res = await createStore({
            storeName,
            storeAddress,
            lat,
            long
        })

        if(res.success){
            window.location.reload();
        }
        else {
            setError(res.message);
        }
    }

    useEffect(() => {
        const a = async () => {
            try {
                const res = await requireVendor();
                setStatus(res.status);
                setHasStore(Boolean(res.storeId));
            } catch (error:any) {
                setError(error.message)
            }
            finally {
                setIsLoading(false);
            }
        };
        a();
    },[])

    if(isLoading) return <div>Loading vendor profile...</div>

    if(status==="PENDING"){
        return (
            <div>
                <h1>Pending for approval....</h1>
            </div>
        )
    }

    if(status==="REJECTED"){
        return (
            <div>
                <h1>Reject your approval....</h1>
            </div>
        )
    }
    
    if(hasStore){
        return (
            <div>
                <h1>You already have a store.</h1>
            </div>
        )
    }

    return (
        <div>
            <Card className="w-full max-w-sm">
                    <CardHeader>
                        <CardTitle>Create store</CardTitle>
                        <CardDescription>
                            Enter your store details
                        </CardDescription>
                    </CardHeader>
                    <form action={handleSubmit}>
                    <CardContent>
                        {
                            error
                        }
                            <div className="flex flex-col gap-6">
                                <div className="grid gap-2">
                                    <Label htmlFor="name">Store name</Label>
                                    <Input
                                        id="name"
                                        type="name"
                                        name="name"
                                        placeholder="Name"
                                        required
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="address">Address</Label>
                                    <Input
                                        id="address"
                                        type="text"
                                        name="address"
                                        placeholder="Address"
                                        required
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="lat">Latitude</Label>
                                    <Input
                                        id="lat"
                                        type="text"
                                        name="lat"
                                        placeholder="lat"
                                        required
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="long">Longitude</Label>
                                    <Input
                                        id="long"
                                        type="text"
                                        name="long"
                                        placeholder="long"
                                        required
                                    />
                                </div>
                            </div>
                    </CardContent>
                    <Button type="submit" className="w-full">
                        Create Store
                    </Button>
                    </form>
                </Card>
        </div>
    )
}