"use client"

import { getProducts } from "@/app/api/vendor/action";
import { Product, Status } from "@/app/generated/prisma/client";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useEffect, useState } from "react";
import EditProductDrawer from "./edit-product-drawer";
import DeleteProductDrawer from "./delete-product-drawer";
import { requireVendor } from "@/app/api/auth/action";
import Link from "next/link";
import PageLoading from "../loading";
import { cn } from "cn";

export default function ManageProductPage() {
  const [products, setProducts] = useState<Product[]>();
  const [edit, setEdit] = useState<Product | null>(null);
  const [del, setDel] = useState<Product | null>(null);

  const [status, setStatus] = useState<Status>();
  const [hasStore, setHasStore] = useState(false);
  const [isBanned, setIsBanned] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadProducts() {
    const res = await getProducts();
    if (res.success && res.data) {
      setProducts(res.data);
    } else if (!res.success) {
      setError(res.message);
    }
  }

  useEffect(() => {
    const checkAuthAndLoad = async () => {
      try {
        const res = await requireVendor();
        setStatus(res.status);
        setHasStore(Boolean(res.storeId));
        setIsBanned(Boolean(res.ban));
        if (res.storeId) {
          await loadProducts();
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };
    checkAuthAndLoad();
  }, []);

  if (isLoading) return <PageLoading />;

  if (isBanned) {
    return (
      <div className="flex w-full justify-center p-4 md:p-8">
        <Card className="w-full max-w-sm text-center">
          <CardHeader>
            <CardTitle className="text-destructive">Account Suspended</CardTitle>
            <CardDescription>
              Your vendor account is currently banned. Please contact administrator.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (status !== "ACCEPTED") {
    return (
      <div className="flex w-full justify-center p-4 md:p-8">
        <Card className="w-full max-w-sm text-center">
          <CardHeader>
            <CardTitle>Approval Required</CardTitle>
            <CardDescription>
              Your vendor account must be approved before you can manage products.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (!hasStore) {
    return (
      <div className="flex w-full justify-center p-4 md:p-8">
        <Card className="w-full max-w-sm text-center">
          <CardHeader>
            <CardTitle>No Store Found</CardTitle>
            <CardDescription>
              You need to create a store before managing products.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-2">
            <Link
              href="/dashboard/vendor"
              className={cn(buttonVariants({ variant: "default" }), "w-full")}
            >
              Go to Home &amp; Create Store
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex w-full justify-center p-4 md:p-8">
      <div className="flex w-full max-w-2xl flex-col gap-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold tracking-tight">Manage Products</h2>
            <p className="text-sm text-muted-foreground">
              View, edit, or delete products in your store
            </p>
          </div>
          <Link
            href="/dashboard/vendor/create-product"
            className={buttonVariants({ size: "sm" })}
          >
            Add Product
          </Link>
        </div>

        {error && (
          <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">
            {error}
          </div>
        )}

        {products && products.length > 0 ? (
          <div className="flex flex-col gap-3">
            {products.map((product) => (
              <Card key={product.id} className="p-4 shadow-xs">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="space-y-3">
                    <h3 className="font-semibold text-base text-foreground leading-tight">
                      {product.name}
                    </h3>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                      <span>Stock: <strong className="text-foreground">{product.quantity}</strong></span>
                      <div className="flex items-baseline gap-1.5">
                        <span>Price:</span>
                        {product.discountedPrice ? (
                          <>
                            <span className="font-semibold text-foreground">₹{product.discountedPrice}</span>
                            <span className="line-through text-muted-foreground">₹{product.price}</span>
                          </>
                        ) : (
                          <span className="font-semibold text-foreground">₹{product.price}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setEdit(product)}
                    >
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => setDel(product)}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="py-12 text-center space-y-3">
              <p className="text-sm text-muted-foreground">
                No products found in your store.
              </p>
              <Link
                href="/dashboard/vendor/create-product"
                className={buttonVariants({ variant: "outline", size: "sm" })}
              >
                Create your first product
              </Link>
            </CardContent>
          </Card>
        )}

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
    </div>
  );
}