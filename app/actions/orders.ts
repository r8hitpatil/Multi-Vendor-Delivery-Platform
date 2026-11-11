'use server';

import { getDistanceInKm } from "@/distance";
import { DispatchStatus, OrderStatus, Role, Status } from "../generated/prisma/enums";
import { prisma } from "../libs/prisma";
import { cancelVendorTimeout, scheduleDriverRoundTimeout } from "../libs/queue/delivery.queue";

type LiveDriver = { driverId : string,lat:number,long:number };

async function getLiveDrivers(adminId:string): Promise<LiveDriver[]> {
    try {
        const res = await fetch(`http://localhost:3002/live-drivers/${adminId}`, {
            cache : "no-store",
        });
        if(!res.ok) return [];
        return res.json();
    } catch {
        return [];
    }
}

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
                                        adminId : true,
                                        admin : {
                                            select : {
                                                id : true,
                                                drivers : {
                                                    where : {
                                                        Role : Role.DRIVER,
                                                        status : Status.ACCEPTED,
                                                        ban : false
                                                    },
                                                    select : {
                                                        id : true,
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

        const drivers = updated.product.storeProducts.vendor.admin?.drivers || [];
        const validDriverIds = new Set(drivers.map((d) => d.id));
        const address = updated.product.storeProducts.address;
        const adminId = updated.product.storeProducts.vendor.adminId;
        const liveDrivers = adminId ? await getLiveDrivers(adminId) : [];
        const range = updated.product.storeProducts.vendor?.range;
        let shouldWeSend = false;

        if(address?.lat && address?.long && liveDrivers.length > 0 && range){
            const storeLat = Number(address.lat);
            const storeLong = Number(address.long);

            for(const driver of liveDrivers){

                if(!validDriverIds.has(driver.driverId)) continue;

                if(driver.lat!=null && driver.long!=null){
                    const distanceInKm = getDistanceInKm(storeLat,storeLong,driver.lat,driver.long);
                    if(distanceInKm <= range){
                        shouldWeSend = true;
                        console.log('New Distance in kms : ',distanceInKm);
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
    } catch (error:unknown) {
        console.error('[vendorAcceptOrderAction] Error:', error);
        return { success: false, message: error instanceof Error ? error.message : "Failed to accept order" };
    }
}