"use client"

import { requireAdmin } from "@/app/api/auth/action"
import { useEffect } from "react";

export default function AdminPage(){
    useEffect(() => {
        const a = async () => {
            await requireAdmin();
        }
        a();
    },[])

    return(
        <div>
            <h1>Kuch bhi</h1>
        </div>
    )
}