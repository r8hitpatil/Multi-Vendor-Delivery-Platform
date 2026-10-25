"use client"

import { deleteProduct } from "@/app/api/vendor/action";
import { Product } from "@/app/generated/prisma/client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useState } from "react";

type Props = {
  product: Product | null;
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
};

export default function DeleteProductDrawer({
  product,
  open,
  onClose,
  onSuccess,
}: Props) {
  const [error, setError] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  async function removeProduct(id: string) {
    setIsDeleting(true);
    setError("");
    const res = await deleteProduct(id);
    setIsDeleting(false);
    if (res.success) {
      console.log("Product deleted");
      onSuccess();
      onClose();
    } else {
      setError(res.message);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Delete Product</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete &quot;{product?.name}&quot;? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        {error && (
          <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">
            {error}
          </div>
        )}
        <DialogFooter className="flex gap-2 sm:justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={() => onClose()}
            disabled={isDeleting}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={() => product?.id && removeProduct(product.id)}
            disabled={isDeleting}
          >
            {isDeleting ? "Deleting..." : "Delete"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}