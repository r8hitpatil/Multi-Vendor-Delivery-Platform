"use server"
import { Role } from "@/app/generated/prisma/enums";
import { getSession } from "@/app/libs/auth";
import { prisma } from "@/app/libs/prisma";
import * as argon from 'argon2';

type CreateAdminBody = {
    name : string,
    phone : string,
    email : string,
    password : string,
    ban : boolean,
    Role : Role
}

type ManageAdminBody = {
    name : string,
    phone : string,
    email : string,
    ban : boolean,
}

export async function createAdmin(body : CreateAdminBody){
    const { name ,phone ,email ,password ,ban ,Role } = body;

    const session = await getSession();

    if(session?.role !== "SUPER_ADMIN"){
        return {
            success : false,
            message : "Unauthorized : Only super admins are allowed"
        }
    }

    const admin = await prisma.user.findUnique({
        where : { email },
    });

    if (admin) {
        return { success: false, message: "User already exists" };
    }

    const hashPass = await argon.hash(password);

    const createAdmin = await prisma.user.create({
        data : {
            name,
            phone,
            email,
            password : hashPass,
            ban,
            Role
        }
    })

    return {
        success: true,
        message: "Created Admin successful",
        data: {
          id: createAdmin.id,
          email: createAdmin.email,
          role: createAdmin.Role,
        },
    };
}

export async function manageAdmin(body: ManageAdminBody){
    const { name ,phone ,email  ,ban  } = body;

    const session = await getSession();

    if(session?.role !== "SUPER_ADMIN"){
        return {
            success : false,
            message : "Unauthorized : Only super admins are allowed"
        }
    }


    const admin = await prisma.user.findUnique({
        where : { email },
    });

    if (!admin) {
        return { success: false, message: "User doesn't exists" };
    }

    const updateAdmin = await prisma.user.update({
        where : {
            email : admin.email
        },
        data : {
            name,
            email,
            phone,
            ban,
        }
    })

    return {
        success: true,
        message: "Created Admin successful",
        data: {
          id: updateAdmin.id,
          email: updateAdmin.email,
          role: updateAdmin.Role,
        },
    };
}

export async function selectedAdmin(adminId:string){

    const session = await getSession();

    if(session?.role !== "SUPER_ADMIN"){
        return {
            success : false,
            message : "Unauthorized : Only super admins are allowed"
        }
    }


    const checkUser = await prisma.user.findUnique({
        where : {
            id : adminId
        }
    })
    if(!checkUser){
        return {
            success : false,
            message : `Something wend wrong fetching user data`
        }
    }
    return {
        success : true,
        message : `Selected admin`,// remove this flaw of sending user as response
        data : {
            name : checkUser.name,
            email : checkUser.email,
            phone : checkUser.phone,
            ban : checkUser.ban,
        }
    }
}

export async function dropAdmins(){

    const session = await getSession();

    if(session?.role !== "SUPER_ADMIN"){
        return {
            success : false,
            message : "Unauthorized : Only super admins are allowed"
        }
    }


    const adminUsers = await prisma.user.findMany({
        where : {
            Role : Role.ADMIN
        }
    })

    if(!adminUsers || adminUsers==null || adminUsers.length<1){
        return {
            success : false,
            message : "No admins found"
        }
    }

    return {
        success : true,
        message : "Admins listed",
        data : adminUsers
    }
}