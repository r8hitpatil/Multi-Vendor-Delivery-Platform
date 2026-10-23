"use client"
import { deleteProduct } from "@/app/api/vendor/action";
import { Product } from "@/app/generated/prisma/client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useState } from "react";

type Props = {
    product : Product | null,
    open : boolean,
    onClose : () => void;
    onSuccess : () => void;
}

export default function DeleteProductDrawer({product,open,onClose,onSuccess}:Props){
    const [error,setError] = useState('');
    
    async function removeProduct(id:string){
        const res = await deleteProduct(id);
        if(res.success){
            console.log("Product deleted");
            onSuccess();
            onClose();
        }else{
            setError(error);
        }
    }

    return (
        <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
            <DialogContent>
                <h1>Do you want to delete</h1>
                <Button type="submit"onClick={() => product?.id && removeProduct(product?.id)} >Yes</Button>
                <Button type="button" onClick={() => onClose()}>No</Button>
            </DialogContent>
        </Dialog>
    )
}