// Queue names
export const DELIVERY_QUEUES = {
    DISPATCH: 'delivery-dispatch-queue',
    NOTIFICATIONS: 'delivery-notifications-queue',
} as const;

// Specific job action names
export const DELIVERY_JOBS = {
    VENDOR_RESPONSE_TIMEOUT:'vendor-response-timeout',
    DRIVER_ROUND_TIMEOUT:'driver-round-timeout',
    ADMIN_SEARCH_TIMEOUT:'admin-search-timeout',
    SEND_PUSH_NOTIFICATION:'send-push-notification'
} as const;

// Job Payload Interfaces
export interface VendorTimeoutJobData {
    orderId: string;
}

export interface DriverRoundTimeoutJobData {
    orderId: string;
    roundNumber: number;
    radiusKm: number;
}

export interface AdminSearchTimeoutJobData {
    orderId : string;
}

export interface NotificationJobData {
    userId: string,
    title: string,
    body: string,
    data?: Record<string, string>;
}