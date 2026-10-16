import { PrismaClient } from "@/app/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import * as argon from 'argon2';

const connectionString = `${process.env.DATABASE_URL}`;
const pool = new Pool({ connectionString })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

export async function main(){
    const super_admin = await prisma.user.upsert({
        where : { email : "super@admin.com" },
        update : {},
        create : {
            email : "super@admin.com",
            name : "Rohit",
            phone : 123456789,
            password : await argon.hash('makichu@123'),
            Role : 'SUPER_ADMIN',
            companyName : "BilluBackchod",
            ban : false,
            status : 'ACCEPTED',
            address : {
                create : {
                    address : 'Pune',
                    pin_code : 410500,
                    lat : '71N',
                    long : '21W'
                }
            }
        }
    })
    const customer = await prisma.user.upsert({
        where : { email : "r@gmail.com" },
        update : {},
        create : {
            email : "r@gmail.com",
            name : "Rohan",
            phone : 987654321,
            password : await argon.hash('ro@123'),
            ban : false,
            status : 'ACCEPTED',
            address : {
                create : {
                    address : 'Pune',
                    pin_code : 410506,
                    lat : '61N',
                    long : '22W'
                }
            }
        }
    })
    console.log('Seed',super_admin,customer);
}
    
main()
    .then(async() => {
        await prisma.$disconnect();
        await pool.end();
    })
    .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    await pool.end();
    process.exit(1);
});