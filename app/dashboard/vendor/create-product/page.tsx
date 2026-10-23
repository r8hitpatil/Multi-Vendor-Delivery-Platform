"use client"

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useEffect, useState } from "react";
import { createNewProduct } from "../../../api/vendor/action";
import { requireVendor } from "@/app/api/auth/action";
import { Status } from "@/app/generated/prisma/enums";

export default function CreateProduct(){

    const [error,setError] = useState();
    const [loading,setLoading] = useState(true);
    const [status,setStatus] = useState<Status>();
    const [hasStore,setHasStore] = useState(false);
    
    async function handleSubmit(formData:FormData){
        const name = formData.get("name") as string;
        const quantity = Number(formData.get("quantity"))
        
        const res = await createNewProduct({ name , quantity });
        if(res.success){
            console.log("Product created")
        }
        else {
            setError(error);
        }
    }

    useEffect(() => {
        const a = async() => {
            try {
                const res = await requireVendor();
                setStatus(res.status);
                setHasStore(Boolean(res.storeId));
            } catch (error:any) {
                setError(error);
            }
            finally{
                setLoading(false);
            }
        };
        a();
    },[])

    if(loading) return <div>loading....</div>

    if(status!=="ACCEPTED") return <div>User not approved</div>

    if(!hasStore) return <div>Create a store first</div>

    return(
        <div>
            <Card className="w-full max-w-sm">
                    <CardHeader>
                        <CardTitle>Create Product</CardTitle>
                        <CardDescription>
                            Enter your product details
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
                                    <Label htmlFor="quantity">Quantity</Label>
                                    <Input
                                        id="quantity"
                                        type="number"
                                        name="quantity"
                                        placeholder="Quantity"
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