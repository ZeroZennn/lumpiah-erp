import { useState, useEffect } from "react";
import { useQuery, useInfiniteQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { io, Socket } from "socket.io-client";
import { toast } from "sonner";
import { apiClient } from "@/shared/lib/api-client";
import { cookieStorage } from "@/shared/lib/cookie-storage";
import { queryKeys } from "@/shared/lib/query-keys.factory";



const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export interface Notification {
    id: string;
    title: string;
    description: string;
    timestamp: Date;
    read: boolean;
    link?: string;
}

interface NotificationResponse {
    id: string;
    title: string;
    description: string;
    createdAt: string;
    isRead: boolean;
    link?: string;
    userId: number;
}

export const useNotifications = () => {
    const queryClient = useQueryClient();
    const [socket, setSocket] = useState<Socket | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const [activeTab, setActiveTab] = useState<'unread' | 'read'>('unread');
    const [pendingReadIds, setPendingReadIds] = useState<Set<string>>(new Set());
    
    // Check auth
    const hasToken = cookieStorage.hasToken();

    // 1. Unread Count Query
    const { data: unreadData } = useQuery({
        queryKey: queryKeys.notifications.unreadCount,
        queryFn: async () => {
            // Cast to unkown then to expected type because backend returns raw object, not ApiResponse
            const res = await apiClient.get<{ count: number }>('/notifications/unread-count');
            return res as unknown as { count: number }; 
        },
        enabled: !!hasToken,
        refetchInterval: 60000, 
    });

    const unreadCount = unreadData?.count || 0;

    // 2. Notifications Infinite Query
    const {
        data,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        isLoading
    } = useInfiniteQuery({
        queryKey: queryKeys.notifications.list({ isRead: activeTab === 'read' }),
        queryFn: async ({ pageParam = 0 }) => {
            const isRead = activeTab === 'read';
            const url = `/notifications?skip=${pageParam}&take=10&isRead=${isRead}`;
            // Cast to unknown then to array because backend returns raw array, not ApiResponse
            const res = await apiClient.get<NotificationResponse[]>(url);
            return res as unknown as NotificationResponse[];
        },
        initialPageParam: 0,
        getNextPageParam: (lastPage: NotificationResponse[], allPages) => {
            if (!lastPage || lastPage.length < 10) return undefined;
            return allPages.length * 10;
        },
        enabled: !!hasToken,
    });

    // Flatten pages
    const notifications = data?.pages.flatMap(page => 
        page.map(n => ({
            id: n.id,
            title: n.title,
            description: n.description,
            link: n.link,
            timestamp: new Date(n.createdAt),
            read: n.isRead,
        }))
    ) || [];

    // 3. Socket Connection
    useEffect(() => {
        if (!hasToken) return;

        const socketInstance = io(API_URL, {
            transports: ["websocket"],
            autoConnect: true,
        });

        socketInstance.on("connect", () => {
            setIsConnected(true);
        });

        socketInstance.on("disconnect", () => {
             setIsConnected(false);
        });

        socketInstance.on("new_audit_log", (data: any) => {
            // Invalidate queries to refetch
            queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all });
            
            // Show Toast
            toast("New Notification", {
                description: `${data.actionType} on ${data.targetTable}`,
            });
        });

        // eslint-disable-next-line
        setSocket(socketInstance);

        return () => {
            socketInstance.disconnect();
        };
    }, [hasToken, queryClient]);

    // 4. Mutations
    const markAsReadMutation = useMutation({
        mutationFn: async (id: string) => {
            await apiClient.patch(`/notifications/${id}/read`);
        },
        onMutate: async (id) => {
            setPendingReadIds(prev => new Set(prev).add(id));
            await queryClient.cancelQueries({ queryKey: queryKeys.notifications.all });
        },
        onSettled: (data, error, variables) => {
            setPendingReadIds(prev => {
                const next = new Set(prev);
                next.delete(variables);
                return next;
            });
            queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all });
        }
    });

    const deleteMutation = useMutation({
        mutationFn: async (id: string) => {
            await apiClient.delete(`/notifications/${id}`);
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all });
        }
    });


    // 5. Exposed Functions
    const loadMore = async () => {
        if (hasNextPage && !isFetchingNextPage) {
            await fetchNextPage();
        }
    };

    const markAsRead = async (id: string) => {
        // Optimistic update local display first
        // (Only remove from unread tab for instant feedback)
        markAsReadMutation.mutate(id);
    };

    const deleteNotification = async (id: string) => {
        deleteMutation.mutate(id);
    };

    const markAllAsRead = () => {
        // If we had a bulk endpoint, call it.
        // For now, assume user just wants to clear badge or UI
        // But since we split tabs, "Mark All Read" usually moves them to 'read' tab
        // Without backend bulk update, this is tricky. 
        // For now, we rely on individual actions or assume backend improves later.
        // We'll just invalidate to refresh state.
        queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all });
    };

    return {
        socket,
        isConnected,
        notifications,
        unreadCount,
        activeTab,
        setActiveTab,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        loadMore,
        hasMore: !!hasNextPage,
        isLoadingMore: isFetchingNextPage,
        isLoading,
        pendingReadIds
    };
};
