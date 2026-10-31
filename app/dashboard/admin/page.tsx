"use client"

import { approveVendor, getPendingVendors, rejectVendor } from "@/app/api/admin/action";
import { User } from "@/app/generated/prisma/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useEffect, useState } from "react";
import PageLoading from "./loading";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { db } from "@/app/libs/firebase";
import { getAdminId } from "@/app/api/auth/action";

export default function AdminPage() {
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [pending, setPending] = useState<User[]>([]);
    const [requests,setRequests] = useState<any[]>([]);

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
        let unsubscribe:(() => void) | undefined;
        async function initListen(){
            const adminId = await getAdminId();
            if(!adminId) return;
            const q = query(
                collection(db,"driver_req"),
                where("adminId","==",adminId),
                where("status","==","PENDING")
            )

            unsubscribe = onSnapshot(q,(snapshot) => {
                const items = snapshot.docs.map((doc) => ({
                    id : doc.id,
                    ...doc.data(),
                }));
                setRequests(items);
            })
        }
        initListen();

        return () => {
            if(unsubscribe) unsubscribe();
        }
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
            {
                <div className="border p-4 rounded-none bg-card space-y-2">
                  <div className="flex justify-between items-center">
                    <h2 className="font-bold text-sm uppercase">Driver Requests</h2>
                    <span className="bg-red-300 text-destructive-foreground text-xs font-mono font-bold px-2 py-0.5">
                      {requests.length} Pending
                    </span>
                  </div>
                  {requests.map((req) => (
                    <div key={req.id} className="p-2 border text-xs font-mono space-y-1">
                      <p className="font-bold">{req.productName} (Order #{req.orderId.slice(0, 8)})</p>
                      <p className="text-muted-foreground">Deliver to: {req.deliveryAddress}</p>
                    </div>
                  ))}
                </div>
            }
        </div>
    );
}