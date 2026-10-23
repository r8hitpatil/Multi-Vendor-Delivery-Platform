"use client"
import { Product } from "@/app/generated/prisma/client"
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateProduct } from "@/app/api/vendor/action";
import { Dialog, DialogContent } from "@/components/ui/dialog";

type Props = {
    product: Product | null;
    open : boolean;
    onClose : () => void;
    onSuccess : () => void;
}

export default function EditProductDrawer({product,open,onClose,onSuccess}:Props){
    const [error,setError] = useState('');

    if(!product) return null;

    async function handleSubmit(formData:FormData){
        if(!product) return;
        const name = formData.get("name") as string;
        const quantity = Number(formData.get("quantity"))
        
        const res = await updateProduct({ id : product.id , name , quantity });
        if(res.success){
            console.log("Product updated")
            onSuccess();
            onClose();
        }
        else {
            setError(error);
        }
    }

    return (
        <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
        <DialogContent  className="p-6">
            <form key={product.id} action={handleSubmit}>
                {error && <p>{error}</p>}
                    <div className="flex flex-col gap-6">
                        <div className="grid gap-2">
                            <Label htmlFor="name">Product name</Label>
                            <Input
                                id="name"
                                type="name"
                                name="name"
                                defaultValue={product.name}
                                placeholder="Name"
                                required
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="quantity">Quantity</Label>
                            <Input
                                id="quantity"
                                type="number"
                                defaultValue={product.quantity}
                                name="quantity"
                                placeholder="Quantity"
                                required
                            />
                        </div>
                    </div>
            <Button type="submit" className="w-full">
                Update Product
            </Button>
        </form>
        </DialogContent>
        </Dialog>
    )
}