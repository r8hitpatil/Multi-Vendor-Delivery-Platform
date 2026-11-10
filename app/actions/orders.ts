'use server';

import { getDistanceInKm } from "@/distance";
import { DispatchStatus, OrderStatus, Role, Status } from "../generated/prisma/enums";
import { prisma } from "../libs/prisma";
import { cancelVendorTimeout, scheduleDriverRoundTimeout } from "../libs/queue/delivery.queue";

export async function vendorAcceptOrderAction(orderId:string) {
    try {
        await cancelVendorTimeout(orderId);

        const updated = await prisma.orderItem.update({
            where : { id : orderId },
            data : {
                orderStatus : OrderStatus.VENDOR_ACCEPTED,
                dispatchStatus : DispatchStatus.SEARCHING,
            },
            include : {
                product : {
                    include : {
                        storeProducts : {
                            include : {
                                address : {
                                    select : {
                                        lat : true,
                                        long : true,
                                    }
                                },
                                vendor : {
                                    select : {
                                        range : true,
                                        admin : {
                                            select : {
                                                drivers : {
                                                    where : {
                                                        Role : Role.DRIVER,
                                                        status : Status.ACCEPTED,
                                                        ban : false,
                                                        // online : true,
                                                    },
                                                    include : {
                                                        address : {
                                                            select : {
                                                                lat : true,
                                                                long : true,
                                                            }
                                                        }
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            },
                        }
                    }
                }
            }
        })

        const drivers = updated.product.storeProducts.vendor.admin?.drivers || []
        const address = updated.product.storeProducts.address;
        const range = updated.product.storeProducts.vendor?.range;
        let shouldWeSend = false;

        if(address?.lat && address.long && drivers.length > 0 && range){
            const storeLat = Number(address.lat);
            const storeLong = Number(address.long);

            for(const driver of drivers){
                if(driver.address?.lat && driver.address?.long){
                    const driverLat = Number(driver.address.lat);
                    const driverLong = Number(driver.address.long);
                    const a = getDistanceInKm(storeLat,storeLong,driverLat,driverLong);
                    if(a <= range){
                        shouldWeSend = true;
                        console.log('New Distance in kms : ',a);
                    }
                }
            }
        }
        else {
            console.log(`[Order ${orderId}] No online drivers found immediately. Background worker will search in rounds.`);
        }
        if(shouldWeSend){
            await scheduleDriverRoundTimeout(orderId,1,5,10);
        }
        return {
            success : true,
            message : "Accepted the order"
        }
    } catch (error:any) {
        console.error('[vendorAcceptOrderAction] Error:', error);
        return { success: false, message: error.message || "Failed to accept order" };
    }
}