import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "./app/libs/jwt";

export async function middleware(req:NextRequest) {
    const token = req.cookies.get('access_token')?.value;
    const { pathname } = req.nextUrl;

    if(pathname.startsWith("/dashboard") && !token){
        return NextResponse.redirect(new URL("/login",req.url));
    }

    if(token){
        const user = await verifyToken(token);
        
        if(!user){
            const response = NextResponse.redirect(new URL("/login", req.url));
            response.cookies.delete("access_token");
            return response;
        }

        if (pathname === "/login") {
            if (user.role === "SUPER_ADMIN") return NextResponse.redirect(new URL("/dashboard/super-admin", req.url));
            if (user.role === "ADMIN") return NextResponse.redirect(new URL("/dashboard/admin", req.url));
            return NextResponse.redirect(new URL("/dashboard", req.url));
        }

        if (pathname === "/dashboard") {
            if (user.role === "SUPER_ADMIN") return NextResponse.redirect(new URL("/dashboard/super-admin", req.url));
            if (user.role === "ADMIN") return NextResponse.redirect(new URL("/dashboard/admin", req.url));
            // Only Customers stay on /dashboard
        }

        if (pathname.startsWith("/dashboard/super-admin") && user.role !== "SUPER_ADMIN") {
            return NextResponse.redirect(new URL("/dashboard", req.url));
        }
        
        if (pathname === "/dashboard/admin" && user.role !== "ADMIN") {
            return NextResponse.redirect(new URL("/dashboard", req.url));
        }

        if(pathname === "/dashboard" && user.role !== "CUSTOMER") {
            return NextResponse.redirect(new URL("/login", req.url));
        }
    }

    return NextResponse.next();
}

export const config = {
    matcher : [
        "/dashboard/:path*", // all pages under dashboard
        "/login",
    ]
}