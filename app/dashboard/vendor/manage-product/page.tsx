"use client"
import { getProducts } from "@/app/api/vendor/action";
import { Product, Status } from "@/app/generated/prisma/client";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useEffect, useState } from "react";
import EditProductDrawer from "./edit-product-drawer";
import DeleteProductDrawer from "./delete-product-drawer";
import { requireVendor } from "@/app/api/auth/action";
import PageLoading from "../loading";

export default function ManageProductPage(){

    const [products,setProducts] = useState<Product[]>();
    const [edit,setEdit] = useState<Product | null>(null);
    const [del,setDel] = useState<Product | null>(null);
    
    const [status,setStatus] = useState<Status>();
    const [hasStore,setHasStore] = useState(false);
    const [isBanned,setIsBanned] = useState(false);
    const [isLoading,setIsLoading] = useState(true);
    const [error,setError] = useState('');

    async function loadProducts() {
        const res = await getProducts();
        if(res.success && res.data) {
            setProducts(res.data);
        }
    }

    useEffect(() => {
        const a = async() => {
                try {
                    const res = await requireVendor();
                    setStatus(res.status);
                    setHasStore(Boolean(res.storeId));
                    setIsBanned(Boolean(res.ban));
                    loadProducts();
                } catch (error:any) {
                    setError(error);
                }
                finally{
                    setIsLoading(false);
                }
        };
        a();
    },[])

    if(isLoading) return <PageLoading/>

    if(isBanned) return <div>Vendor is banned</div>

    if(status!=="ACCEPTED") return <div>User not approved</div>

    if(!hasStore) return <div>Create a store first</div>

    return (
        <div>
            <Card className="w-full max-w-sm">
                    <CardHeader>
                        <CardTitle>Update Product</CardTitle>
                        <CardDescription>
                            Enter your product details
                        </CardDescription>
                    </CardHeader>
                    { products?.length===0 ? ( <div><span>No products</span></div> ) : 
                    (
                        products?.map((e) => (
                        <div key={e.id}>
                            <div>
                                <h3>{e.name}</h3>
                            </div>
                            <div>
                                <h3>{e.quantity}</h3>
                            </div>
                            <div>
                                <Button onClick={() => setEdit(e)}>
                                    Edit
                                </Button>
                                <Button onClick={() => setDel(e)}>
                                    Delete
                                </Button>
                            </div>
                        </div>
                        ))
                    )
                    }
                </Card>
                <EditProductDrawer
                    product={edit}
                    open={Boolean(edit)}
                    onClose={() => setEdit(null)}
                    onSuccess={loadProducts}
                />
                <DeleteProductDrawer
                    product={del}
                    open={Boolean(del)}
                    onClose={() => setDel(null)}
                    onSuccess={loadProducts}
                />
        </div>
    )
}