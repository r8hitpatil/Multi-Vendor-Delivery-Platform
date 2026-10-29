"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { useQueryClient } from "@tanstack/react-query"
import * as z from "zod";
import { Controller, useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { customerAddress } from "@/app/api/customer/action"
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"

interface AddressDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

const formSchema = z
  .object({
    address: z.string().trim().min(5, "Address must be at least 5 characters long"),
    lat: z.string().trim().min(1, "Must be at least 1 character long"),
    long: z.string().trim().min(1, "Must be at least 1 character long"),
    pin_code: z.string().trim().min(4, "Must be at least 4 characters long"),
  })

type FormValues = z.infer<typeof formSchema>;

export default function AddressDialog({ open, onOpenChange, onSuccess }: AddressDialogProps) {
    const queryClient = useQueryClient();
    const [error, setError] = useState<string | null>(null);

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            address: "",
            lat: "",
            long: "",
            pin_code: ""
        },
    })

    async function onSubmit(data: FormValues) {
        const { address, lat, long, pin_code } = data;
        const res = await customerAddress({
            address,
            lat,
            long,
            pin_code: Number(pin_code)
        })
        if (res.success) {
            onSuccess()
            setError('');
            onOpenChange(false)
            form.reset();
            console.log('Created address successfully')
            queryClient.invalidateQueries({ queryKey: ["home-cart"] });
        } else {
            setError(res.message)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md rounded-none border border-border bg-background p-6 shadow-none">
                <DialogHeader className="space-y-1.5 text-left">
                  <div className="flex items-center gap-2">
                    <span className="rounded-none border border-foreground bg-foreground text-background px-2 py-0.5 text-[10px] font-mono uppercase font-bold tracking-wider">
                      CREATE ADDRESS
                    </span>
                  </div>
                  <DialogTitle className="text-lg font-bold tracking-tight uppercase font-mono">
                    Create address
                  </DialogTitle>
                  <DialogDescription className="text-xs font-mono text-muted-foreground">
                    You can add items to cart once you create your delivery address.
                  </DialogDescription>
                </DialogHeader>

                <form onSubmit={form.handleSubmit(onSubmit)}>
                    <div className="space-y-4 pt-2">
                        {error && (
                            <div className="rounded-none border border-destructive/50 bg-destructive/10 p-3 text-xs font-mono text-destructive">
                                {error}
                            </div>
                        )}
                        <FieldGroup className="flex flex-col gap-3">
                            <Controller
                              name="address"
                              control={form.control}
                              render={({ field, fieldState }) => (
                                <Field data-invalid={fieldState.invalid} className="space-y-1">
                                  <FieldLabel htmlFor="form-rhf-address" className="text-xs font-mono uppercase tracking-wider text-muted-foreground font-semibold">
                                    Street Address
                                  </FieldLabel>
                                  <Input
                                    {...field}
                                    id="form-rhf-address"
                                    type="text"
                                    aria-invalid={fieldState.invalid}
                                    placeholder="e.g. 123 Baker Street, Apt 4B"
                                    autoComplete="street-address"
                                    className="rounded-none border-border font-mono text-xs focus-visible:ring-0 focus-visible:border-foreground"
                                  />
                                  {fieldState.invalid && (
                                    <FieldError errors={[fieldState.error]} className="text-xs font-mono text-destructive" />
                                  )}
                                </Field>
                              )}
                            />

                            <Controller
                              name="pin_code"
                              control={form.control}
                              render={({ field, fieldState }) => (
                                <Field data-invalid={fieldState.invalid} className="space-y-1">
                                  <FieldLabel htmlFor="form-rhf-pin_code" className="text-xs font-mono uppercase tracking-wider text-muted-foreground font-semibold">
                                    Pin Code
                                  </FieldLabel>
                                  <Input
                                    {...field}
                                    id="form-rhf-pin_code"
                                    type="text"
                                    inputMode="numeric"
                                    aria-invalid={fieldState.invalid}
                                    placeholder="e.g. 400001"
                                    autoComplete="postal-code"
                                    className="rounded-none border-border font-mono text-xs focus-visible:ring-0 focus-visible:border-foreground"
                                  />
                                  {fieldState.invalid && (
                                    <FieldError errors={[fieldState.error]} className="text-xs font-mono text-destructive" />
                                  )}
                                </Field>
                              )}
                            />

                            <div className="grid grid-cols-2 gap-3">
                              <Controller
                                name="lat"
                                control={form.control}
                                render={({ field, fieldState }) => (
                                  <Field data-invalid={fieldState.invalid} className="space-y-1">
                                    <FieldLabel htmlFor="form-rhf-lat" className="text-xs font-mono uppercase tracking-wider text-muted-foreground font-semibold">
                                      Latitude
                                    </FieldLabel>
                                    <Input
                                      {...field}
                                      id="form-rhf-lat"
                                      type="text"
                                      aria-invalid={fieldState.invalid}
                                      placeholder="e.g. 19.0760"
                                      autoComplete="off"
                                      className="rounded-none border-border font-mono text-xs focus-visible:ring-0 focus-visible:border-foreground"
                                    />
                                    {fieldState.invalid && (
                                      <FieldError errors={[fieldState.error]} className="text-xs font-mono text-destructive" />
                                    )}
                                  </Field>
                                )}
                              />

                              <Controller
                                name="long"
                                control={form.control}
                                render={({ field, fieldState }) => (
                                  <Field data-invalid={fieldState.invalid} className="space-y-1">
                                    <FieldLabel htmlFor="form-rhf-long" className="text-xs font-mono uppercase tracking-wider text-muted-foreground font-semibold">
                                      Longitude
                                    </FieldLabel>
                                    <Input
                                      {...field}
                                      id="form-rhf-long"
                                      type="text"
                                      aria-invalid={fieldState.invalid}
                                      placeholder="e.g. 72.8777"
                                      autoComplete="off"
                                      className="rounded-none border-border font-mono text-xs focus-visible:ring-0 focus-visible:border-foreground"
                                    />
                                    {fieldState.invalid && (
                                      <FieldError errors={[fieldState.error]} className="text-xs font-mono text-destructive" />
                                    )}
                                  </Field>
                                )}
                              />
                            </div>
                        </FieldGroup>

                        <div className="flex items-center justify-between pt-3 border-t border-border mt-4">
                            <Button 
                              type="button" 
                              variant="outline" 
                              onClick={() => form.reset()}
                              className="rounded-none border-border font-mono text-xs uppercase tracking-wider hover:bg-muted font-bold"
                            >
                                Reset
                            </Button>
                            <Button 
                              type="submit" 
                              disabled={form.formState.isSubmitting}
                              className="rounded-none bg-black text-white hover:bg-neutral-800 font-mono text-xs uppercase tracking-wider font-bold"
                            >
                                {form.formState.isSubmitting ? "Creating..." : "Add address"}
                            </Button>
                        </div>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    )
}
