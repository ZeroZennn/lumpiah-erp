"use client";

import React, { createContext, useContext } from "react";
import { useNotifications, Notification } from "@/features/notifications/hooks/useNotifications";
import { Socket } from "socket.io-client";

export { type Notification };

interface SocketContextType {
    socket: Socket | null;
    isConnected: boolean;
    notifications: Notification[];
    unreadCount: number;
    activeTab: 'unread' | 'read';
    setActiveTab: (tab: 'unread' | 'read') => void;
    markAsRead: (id: string) => Promise<void>;
    markAllAsRead: () => void;
    deleteNotification: (id: string) => Promise<void>;
    loadMore: () => Promise<void>;
    hasMore: boolean;
    isLoadingMore: boolean;
    isLoading: boolean;
    pendingReadIds: Set<string>;
}

const SocketContext = createContext<SocketContextType>({
    socket: null,
    isConnected: false,
    notifications: [],
    unreadCount: 0,
    activeTab: 'unread',
    setActiveTab: () => { },
    markAsRead: async () => { },
    markAllAsRead: () => { },
    deleteNotification: async () => { },
    loadMore: async () => { },
    hasMore: false,
    isLoadingMore: false,
    isLoading: false,
    pendingReadIds: new Set(),
});

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }: { children: React.ReactNode }) => {
    const notificationState = useNotifications();

    return (
        <SocketContext.Provider
            value={notificationState}
        >
            {children}
        </SocketContext.Provider>
    );
};
