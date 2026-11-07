'use server';

import { DispatchStatus, OrderStatus } from "../generated/prisma/enums";
import { prisma } from "../libs/prisma";
import { cancelVendorTimeout, scheduleDriverRoundTimeout } from "../libs/queue/delivery.queue";

export async function vendorAcceptOrderAction(orderId:string) {
    await cancelVendorTimeout(orderId);

    const updated = await prisma.orderItem.update({
        where : { id : orderId },
        data : {
            orderStatus : OrderStatus.VENDOR_ACCEPTED,
            dispatchStatus : DispatchStatus.SEARCHING,
        }
    })

    await scheduleDriverRoundTimeout(orderId,1,3,60);

    return { success : true, order : updated };
}