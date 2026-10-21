"use client"

import { createCompany } from "@/app/api/super-admin/action";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";

export default function CreateCompany(){

    const [error,setError] = useState('');

    async function handleSubmit(formData:FormData){
        const companyName = formData.get("name") as string;
        const addressDesc = formData.get("address") as string;
        const about = formData.get("about") as string;
        const pin_code = Number(formData.get("pin-code"));
        const lat = formData.get("lat") as string;
        const long = formData.get("long") as string;

        const res = await createCompany({companyName ,about , addressDesc , pin_code , lat,long});
        if(res.success){
            console.log('Created company successfully')
        }
        else{
            setError(res.message)
        }
    }
    return (
        <div>
            <Card className="w-full max-w-sm">
                <CardHeader>
                    <CardTitle>Create company</CardTitle>
                    <CardDescription>
                        Enter details to create company
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
                                <Label htmlFor="about">About</Label>
                                <Input
                                    id="about"
                                    type="text"
                                    name="about"
                                    placeholder="about"
                                    required
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="address">address</Label>
                                <Input
                                    id="address"
                                    type="text"
                                    name="address"
                                    placeholder="address"
                                    required
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="pin-code">Pin code</Label>
                                <Input
                                    id="pin-code"
                                    type="text"
                                    name="pin-code"
                                    placeholder="pin-code"
                                    required
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="lat">Latitute</Label>
                                <Input
                                    id="lat"
                                    type="text"
                                    name="lat"
                                    placeholder="lat"
                                    required
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="long">longitute</Label>
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
                    Create Company
                </Button>
                </form>
            </Card>
        </div>
    )
}