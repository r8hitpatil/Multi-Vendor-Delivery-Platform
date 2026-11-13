import { cert , getApp, getApps, initializeApp, type App } from "firebase-admin/app";
import { getMessaging, type Messaging } from "firebase-admin/messaging";

function getFirebaseAdminApp():App {
    if(getApps().length > 0) {
        return getApp();
    }

    const projectId = process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const rawKey = process.env.FIREBASE_PRIVATE_KEY;

    if(!projectId || !clientEmail || !rawKey) {
        throw new Error(
            `[Firebase Admin] missing creds in env ( FIREBASE_PROJECT_ID , FIREBASE_CLIENT_EMAIL , FIREBASE_PRIVATE_KEY )`
        );
    }

    const privateKey = rawKey
                        .trim()
                        .replace(/^["']+|["',]+$/g, "")
                        .replace(/\\n/g, "\n");

    return initializeApp({
        credential : cert({
            projectId,
            clientEmail,
            privateKey
        })
    })
}

export function getAdminMessaging() : Messaging {
    return getMessaging(getFirebaseAdminApp());
}