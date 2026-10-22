"use client"
import { createDriver } from "@/app/api/admin/action";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button, Input } from "@base-ui/react";
import { useEffect, useState } from "react";

export default function CreateDriver(){

    const [error,setError] = useState('');

    async function handleSubmit(formData:FormData){
        const ban = Boolean(formData.get("ban"));
        const name = formData.get("name") as string;
        const phone = formData.get("phone") as string;
        const aadhar = formData.get("aadhar") as string;
        const pan = formData.get("pan") as string;
        const password = formData.get("password") as string;
        const email = formData.get("email") as string;
        const addressDesc = formData.get("address") as string;
        const pin_code = Number(formData.get("pin-code"));
        const lat = formData.get("lat") as string;
        const long = formData.get("long") as string;
        const res = await createDriver({ 
            name,
            phone,
            aadhar,
            ban,
            pan,
            email,
            password,
            addressDesc,
            pin_code,
            lat,
            long
         });
        if(res.success){
            console.log('Created Driver');
        }
        else{
            setError(res.message);
        }
    }

    return (
        <div>
            <Card className="w-full max-w-sm">
                <CardHeader>
                    <CardTitle>Driver signup page</CardTitle>
                    <CardDescription>
                        Enter driver details
                    </CardDescription>
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
                                    type="text"
                                    name="name"
                                    placeholder="Name"
                                    required
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="phone">Phone</Label>
                                <Input
                                    id="phone"
                                    type="text"
                                    name="phone"
                                    placeholder="Phone"
                                    required
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="aadhar">Aadhar</Label>
                                <Input
                                    id="aadhar"
                                    type="text"
                                    name="aadhar"
                                    placeholder="Aadhar"
                                    required
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="pan">Pan</Label>
                                <Input
                                    id="pan"
                                    type="text"
                                    name="pan"
                                    placeholder="Pan"
                                    required
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="ban">Ban</Label>
                                <Input
                                    id="ban"
                                    type="checkbox"
                                    name="ban"
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="email">Email</Label>
                                <Input
                                    id="email"
                                    type="text"
                                    name="email"
                                    placeholder="Email"
                                    required
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="password">Password</Label>
                                <Input
                                    id="password"
                                    type="password"
                                    name="password"
                                    placeholder="Password"
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
                                <Label htmlFor="pin-code">Pin-code</Label>
                                <Input
                                    id="pin-code"
                                    type="text"
                                    name="pin-code"
                                    placeholder="Pin-code"
                                    required
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="lat">Latitude</Label>
                                <Input
                                    id="lat"
                                    type="text"
                                    name="lat"
                                    placeholder="Lat"
                                    required
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="long">longitude</Label>
                                <Input
                                    id="long"
                                    type="text"
                                    name="long"
                                    placeholder="Long"
                                    required
                                />
                            </div>
                        </div>
                </CardContent>
                <Button type="submit" className="w-full">
                    Create Driver
                </Button>
                </form>
            </Card>
        </div>
    )
}