"use server"

import { handleActionError } from "@/app/libs/errors";
import { prisma } from "@/app/libs/prisma";
import { requireCustomer } from "../auth/action";
import { createUserAddress } from "./schema";
import { zodError } from "@/app/libs/zod-error";



export async function homePageProducts() {
  try {
    const res = await prisma.availableProduct.findMany({
      where: {
        isAvailable: true
      }
    })
    return {
      success: true as const,
      message: "Fetched products successfully",
      data: res
    }
  } catch (error) {
    return handleActionError(error)
  }
}

export async function customerAddress(body:unknown){
  try {
    const res = createUserAddress.safeParse(body);
    if(!res.success) return zodError(res.error);

    const { address,lat,long,pin_code } = res.data;
    const { customerId } = await requireCustomer();
    await prisma.address.upsert({
      where: { userId: customerId },
      update: { address, lat, long, pin_code },
      create: { userId: customerId, address, lat, long, pin_code },
    });
    return {
      success : true,
      message : "Created user address"
    }
  } catch (error) {
    return handleActionError(error);
  }
}

export async function addToCart(prodId:string,quantityToAdd:number=1){
  try {
    const { customerId : userId } = await requireCustomer();

    let cart = await prisma.cart.findUnique({
      where : { userId }
    });

    if(!cart){
      cart = await prisma.cart.create({
        data : { userId },
      })
    }

    const res = await prisma.$transaction(async (tx) => {
      const product = await tx.product.findUnique({
        where : {
          id : prodId
        }
      })

      const existingCartItem = await tx.cartItems.findUnique({
        where : {
          cartId_productId : {
            cartId : cart.id,
            productId : prodId
          }
        }
      })

      const currentInCart = existingCartItem?.quantity ?? 0;

      if(!product || product.quantity < (currentInCart + quantityToAdd)){
        throw new Error("Insufficient stock");
      }
      
      const cartItem = await tx.cartItems.upsert({
        where : {
          cartId_productId : {
            cartId : cart.id,
            productId : prodId
          }
        },
        update : {
          quantity : { increment : quantityToAdd },
        },
        create : {
          cartId : cart.id,
          productId : prodId,
          quantity : quantityToAdd
        },
      })
      return { cartItem };
    })
    return {
      success : true,
      message : "Added to cart",
      data : res
    }
  } catch (error) {
    return handleActionError(error);
  }
}

export async function removeFromCart(prodId:string,quantityToAdd:number=1){
  try {
    const { customerId : userId } = await requireCustomer();

    const cart = await prisma.cart.findUnique({
      where : { userId }
    });

    if(!cart){
      throw new Error("Cannot find cart!! please add few items in cart");
    }

    const res = await prisma.$transaction(async (tx) => {
      const existingCartItem = await tx.cartItems.findUnique({
        where : {
          cartId_productId : {
            cartId : cart.id,
            productId : prodId
          }
        }
      })
    
      if(!existingCartItem){
        throw new Error("Cannot find cart item");
      }

      let cartItem;

      if(existingCartItem.quantity <= quantityToAdd){
        cartItem = await tx.cartItems.delete({
          where : {
            cartId_productId : {
              cartId : cart.id,
              productId : prodId
            }
          }
        })
      }
      else {
        cartItem = await tx.cartItems.update({
          where : {
            cartId_productId : {
              cartId : cart.id,
              productId : prodId
            }
          },
          data : {
            quantity : { decrement : quantityToAdd }
          }
        })
      }
      
      return { cartItem };
    })
    return {
      success : true,
      message : "Removed from cart",
      data : res
    }
  } catch (error) {
    return handleActionError(error);
  }
}

export async function getCart() {
  try {
    const { customerId: userId } = await requireCustomer();
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        address: true,
        cart: {
          select: {
            id: true,
            items: {
              select: {
                id: true,
                quantity: true,
                productId: true,
                product: {
                  select: {
                    name: true,
                    price: true,
                    discountedPrice: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    const cart = user?.cart;
    if (!cart || cart.items.length === 0) {
      return {
        success: true as const,
        message: "No items in cart",
        data: {
          cartId: cart?.id || null,
          items: [],
          totalAmount: 0,
          address: user?.address ?? null,
        },
      };
    }

    const formattedItems = cart.items.map((item) => {
      const unitPrice = item.product.discountedPrice ?? item.product.price;
      return {
        cartItemId: item.id,
        productId: item.productId,
        name: item.product.name,
        price: unitPrice,
        quantity: item.quantity,
        totalItemPrice: unitPrice * item.quantity,
      };
    });

    const totalAmount = formattedItems.reduce((acc, item) => acc + item.totalItemPrice, 0);

    return {
      success: true as const,
      message: "Items fetched from cart",
      data: {
        cartId: cart.id,
        items: formattedItems,
        totalAmount,
        address: user?.address ?? null,
      },
    };
  } catch (error) {
    return handleActionError(error);
  }
}

export async function orderProducts(){
  try {
    const { customerId } = await requireCustomer();
    const cart = await prisma.cart.findUnique({
      where : { userId : customerId },
      select : {
        id: true,
        items : {
          include : {
            product : true
          }
        }
      }
    });

    if(!cart || cart.items.length === 0){
      throw new Error("Cannot find cart!! please add few items in cart");
    }
    
    const res = await prisma.$transaction(async (tx) => {
      for( const item of cart.items ){
        if(item.product.quantity < item.quantity) {
          throw new Error("Insufficient items in stock")
        }
      }

      const newOrder = await tx.order.create({
        data : {
          customerId,
          orderItems : {
            createMany : {
              data : cart.items.map((e) => ({
                productId : e.productId,
                quantity : e.quantity,
                price : e.product.discountedPrice ?? e.product.price
              }))
            }
          }
        },
        include : {
          orderItems : true,
        }
      })

      if(newOrder){
        for( const item of cart.items ){
          await tx.product.update({
          where : {
            id : item.productId,
          },
          data : {
            quantity : { decrement : item.quantity },
          }
        });
        }
      }

      await tx.cartItems.deleteMany({
        where : { cartId : cart.id }
      });

      return newOrder;
    })
    return {
      success : true,
      message : "Create order successfully",
      data : res
    }
  } catch (error) {
    return handleActionError(error)
  }
}

export async function getOrders(){
  try {
    const { customerId } = await requireCustomer();
    const findOrders = await prisma.order.findMany({
      where : {
        customerId,
      },
      include : {
        orderItems : {
          include : {
            product : {
              select : {
                name : true
              }
            }
          }
        }
      }
    })
    return {
      success : true,
      message : "No orders yet",
      data : findOrders
    }
  } catch (error) {
    return handleActionError(error);
  }
}