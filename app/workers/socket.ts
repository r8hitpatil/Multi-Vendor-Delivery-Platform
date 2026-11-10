import 'dotenv/config';
import { redisConnection } from "../libs/queue/redis";
import { Server } from 'socket.io';
import { createAdapter } from '@socket.io/redis-streams-adapter';

const io = new Server({
    cors : {
        origin : "http://localhost:3000",// frontend
    },
    adapter : createAdapter(redisConnection),
})

io.on("connection",(socket) => {
    console.log('[Socket] Connected',socket.id);

    socket.on("driver-location",(data: { orderId:string,lat:number,long:number }) => {
        console.log(`[Socket] Live gps received : `,data);
        io.to(data.orderId).emit("location-update",{
            lat : data.lat,
            long : data.long
        })
    })

    socket.on("disconnect",() => {
        console.log(`[Socket] disconnected :`,socket.id);
    })
})

io.listen(3002);
console.log(`[Socket] Server running on port 3002`);