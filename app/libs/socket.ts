'use client';

import { io } from "socket.io-client";

export const socket = io("http://localhost:3002",{
    autoConnect : false, // connects only when we call
})