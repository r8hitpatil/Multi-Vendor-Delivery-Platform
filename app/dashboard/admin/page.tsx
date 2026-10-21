"use client"

import { isBanned } from "@/app/api/auth/action";
import { useEffect, useState } from "react"

type isBanned = {
    ban : boolean;
}

export default function AdminPage(){

    const [bool,setBool] = useState<isBanned>();
    const [error,setError] = useState('');

    useEffect(() => {
        async function c(){
            const a = await isBanned();
            if(a.success && a.data){ 
                setBool(a.data)
            }else{
                setError(a.message);
            }
        }
        c();
    },[])

    return (
        <div>
            {
                bool?.ban ? (<span>Banned</span>) : (<span>Not banned</span>)
            }
            <br />
            <span>{bool?.ban}</span>
        </div>
    )
}