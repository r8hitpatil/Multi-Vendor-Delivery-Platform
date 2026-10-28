"use server"

import { handleActionError } from "@/app/libs/errors";
import { prisma } from "@/app/libs/prisma";
import { requireCustomer } from "../auth/action";


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

      if(!product || product.quantity < quantityToAdd){
        throw new Error("Insufficient stock");
      }

      const updateProduct = await tx.product.update({
        where : {
          id : prodId
        },
        data : {
          quantity : { decrement : quantityToAdd }
        }
      })

      
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
      return { updateProduct,cartItem };
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

      const updateProduct = await tx.product.update({
        where : {
          id : prodId
        },
        data : {
          quantity : { increment : quantityToAdd }
        }
      })

      if(existingCartItem.quantity <= quantityToAdd){
        await tx.cartItems.delete({
          where : {
            cartId_productId : {
              cartId : cart.id,
              productId : prodId
            }
          }
        })
      }
      else {
        await tx.cartItems.update({
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
      
      return { updateProduct };
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
    const { customerId : userId } = await requireCustomer()
    const res = await prisma.cart.findFirst({
      where : {
        userId
      },
      select : {
        id : true,
        items : {
          select : {
            id : true,
            quantity : true,
            productId : true,
            product : {
              select : {
                name : true,
                price : true,
                discountedPrice : true,  
              }
            }
          }
        }
      }
    });
    if(!res || res.items.length === 0){
      return {
        success : true as const,
        message : "No items in cart",
        data : {
          cartId : res?.id || null,
          items : [],
          totalAmount : 0
        }
      }
    }

    const formattedItems = res.items.map((item) => {
      const unitPrice = item.product.discountedPrice ?? item.product.price;
      return {
        cartItemId: item.id,
        productId: item.productId,
        name: item.product.name,
        price: unitPrice,
        quantity: item.quantity,
        totalItemPrice: unitPrice * item.quantity,
      }
    })

    const totalAmount = formattedItems.reduce((e,item) => e + item.totalItemPrice,0)

    return {
      success : true as const,
      message : "Items fetched from cart",
      data : {
        items : formattedItems,
        totalAmount
      }
    }
  } catch (error) {
    return handleActionError(error);
  }
}