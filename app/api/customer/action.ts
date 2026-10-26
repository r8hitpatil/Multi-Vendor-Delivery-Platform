import { handleActionError } from "@/app/libs/errors";
import { prisma } from "@/app/libs/prisma";

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