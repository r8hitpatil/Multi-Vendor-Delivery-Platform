import 'dotenv/config';
import { redisConnection } from "../libs/queue/redis";
import { Server } from 'socket.io';
import { createAdapter } from '@socket.io/redis-streams-adapter';
import express from 'express';
import { createServer } from 'node:http';

const app = express();
const httpServer = createServer(app);

const io = new Server(httpServer,{
    cors : {
        origin : "http://localhost:3000",// frontend
    },
    pingInterval : 5000,
    pingTimeout : 5000,
    adapter : createAdapter(redisConnection),
})

io.on("connection",(socket) => {
    console.log('[Socket] Connected',socket.id);

    socket.on("join-admin",(adminId:string) => {
        socket.join(adminId);
        console.log(`[Socket] Admin joined room : ${adminId}`);
    })

    socket.on("driver-location",(data: {driverId:string,adminId:string,lat:number,long:number }) => {
        console.log(`[Socket] Live gps received : `,data);
        socket.data.driverId = data.driverId;
        socket.data.adminId = data.adminId;
        socket.data.lat = data.lat;
        socket.data.long = data.long;
        io.to(data.driverId).emit("location-update",{
            lat : data.lat,
            long : data.long
        })
    })

    socket.on("driver-status",(data : {driverId:string,adminId:string,status:boolean}) => {
        console.log(`[Socket] Driver is online : `,data.driverId);
        socket.data.driverId = data.driverId;
        socket.data.adminId = data.adminId;
        io.to(data.adminId).emit("status-update",{
            status : data.status,
            driverId : data.driverId
        })
    })

    socket.on("disconnect",() => {
        console.log(`[Socket] disconnected :`,socket.id);
        if(socket.data.adminId && socket.data.driverId) {
            io.to(socket.data.adminId).emit("status-update",{
                status : false,
                driverId : socket.data.driverId
            })
        }
    })
})

app.get("/live-drivers/:adminId", async(req,res) => {
    const adminId = String(req.params.adminId);
    const sockets = await io.fetchSockets();

    const liveDrivers = sockets
    .filter((s) => 
        s.data.adminId === adminId 
        && s.data.lat != null 
        && s.data.long != null)
    .map((s) => ({
        driverId : s.data.driverId as string,
        lat : s.data.lat as number,
        long : s.data.long as number,
    }));

    res.json(liveDrivers);
})

const PORT = 3002;
httpServer.listen(PORT, () => {
    console.log(`[Socket] Server + HTTP route running on port ${PORT}`);
});