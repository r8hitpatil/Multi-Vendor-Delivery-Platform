"use client"

import { approveVendor, getPendingVendors, rejectVendor } from "@/app/api/admin/action";
import { User } from "@/app/generated/prisma/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useEffect, useState } from "react";
import PageLoading from "./loading";

export default function AdminPage() {
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [pending, setPending] = useState<User[]>([]);

    async function onAcceptVendor(id: string) {
        const res = await approveVendor(id);
        if (res.success) {
            setPending((prev) => prev.filter((v) => v.id !== id));
        } else {
            setError("Couldn't accept vendor");
        }
    }

    async function onRejectVendor(id: string) {
        const res = await rejectVendor(id);
        if (res.success) {
            setPending((prev) => prev.filter((v) => v.id !== id));
        } else {
            setError("Couldn't reject vendor");
        }
    }

    useEffect(() => {
        const fetchPending = async () => {
            try {
                const vendors = await getPendingVendors();
                if (vendors.success && vendors.data) {
                    setPending(vendors.data);
                } else if (!vendors.success) {
                    setError(vendors.message);
                }
            } catch (err: any) {
                setError(err.message);
            } finally {
                setIsLoading(false);
            }
        };
        fetchPending();
    }, []);

    if (isLoading) return <PageLoading />;

    return (
        <div className="p-4 md:p-8 space-y-4">
            {error && (
                <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive max-w-sm">
                    {error}
                </div>
            )}
            <h3 className="text-xl font-semibold">Pending Vendor Approvals</h3>
            {pending && pending.length > 0 ? (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {pending.map((e) => (
                        <Card className="w-full max-w-sm" key={e.id}>
                            <CardContent className="pt-6 space-y-3">
                                <div className="text-sm">
                                    <span className="font-semibold text-muted-foreground">
                                        Vendor:{" "}
                                    </span>
                                    <span className="font-medium text-foreground">{e.name}</span>
                                </div>
                                <div className="text-sm">
                                    <span className="font-semibold text-muted-foreground">
                                        Current status:{" "}
                                    </span>
                                    <span className="font-medium text-foreground">
                                        {e.status}
                                    </span>
                                </div>
                                <div className="flex gap-2 pt-2">
                                    <Button
                                        type="button"
                                        size="sm"
                                        className="flex-1"
                                        onClick={() => onAcceptVendor(e.id)}
                                    >
                                        Accept Vendor
                                    </Button>
                                    <Button
                                        type="button"
                                        size="sm"
                                        variant="destructive"
                                        className="flex-1"
                                        onClick={() => onRejectVendor(e.id)}
                                    >
                                        Reject Vendor
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            ) : (
                <Card className="w-full max-w-sm">
                    <CardContent className="py-6 text-center text-sm text-muted-foreground">
                        No pending vendors
                    </CardContent>
                </Card>
            )}
        </div>
    );
}