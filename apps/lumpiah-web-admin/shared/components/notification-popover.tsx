"use client";

import * as React from "react";
import { Bell, Check, Trash2, Loader2, ExternalLink } from "lucide-react";
import { useRouter } from "next/navigation";

import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/shared/components/ui/popover";
import { Button } from "@/shared/components/ui/button";
import { ScrollArea } from "@/shared/components/ui/scroll-area";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { useSocket } from "@/shared/container/socket-provider";
import { cn } from "@/shared/lib/utils";
import { formatDistanceToNow } from "date-fns";

import { Tabs, TabsList, TabsTrigger } from "@/shared/components/ui/tabs";
import { useInView } from "react-intersection-observer";
import { useEffect } from "react";

export function NotificationPopover() {
    const {
        notifications,
        unreadCount,
        activeTab,
        setActiveTab,
        markAllAsRead,
        markAsRead,
        deleteNotification,
        loadMore,
        hasMore,
        isLoadingMore,
        isLoading,
        pendingReadIds
    } = useSocket();
    const [open, setOpen] = React.useState(false);
    const router = useRouter();
    const { ref, inView } = useInView();

    useEffect(() => {
        if (inView && hasMore && !isLoadingMore) {
            loadMore();
        }
    }, [inView, hasMore, isLoadingMore, loadMore]);

    const handleItemClick = (notification: any) => {
        if (!notification.read) {
            markAsRead(notification.id);
        }
        if (notification.link) {
            setOpen(false);
            router.push(notification.link);
        }
    };

    const handleDelete = (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        deleteNotification(id);
    };

    const handleMarkRead = (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        markAsRead(id);
    };

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-destructive text-[10px] font-medium text-destructive-foreground text-white flex items-center justify-center animate-in zoom-in">
                            {unreadCount > 9 ? "9+" : unreadCount}
                        </span>
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0" align="end">
                <div className="p-4 border-b space-y-3">
                    <div className="flex items-center justify-between">
                        <h4 className="font-semibold leading-none">Notifications</h4>
                        {unreadCount > 0 && activeTab === 'unread' && (
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-auto px-2 text-xs text-muted-foreground hover:text-primary"
                                onClick={markAllAsRead}
                            >
                                Mark all as read
                            </Button>
                        )}
                    </div>

                    <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full">
                        <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="unread">Belum (Unread)</TabsTrigger>
                            <TabsTrigger value="read">Sudah (Read)</TabsTrigger>
                        </TabsList>
                    </Tabs>
                </div>

                <ScrollArea className="h-[400px]">
                    {isLoading ? (
                        <div className="flex flex-col p-4 space-y-4">
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="flex gap-3">
                                    <Skeleton className="h-12 w-full" />
                                </div>
                            ))}
                        </div>
                    ) : notifications.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-[300px] p-4 text-center text-muted-foreground">
                            <Bell className="h-8 w-8 mb-2 opacity-20" />
                            <p className="text-sm">No {activeTab} notifications</p>
                        </div>
                    ) : (
                        <div className="flex flex-col">
                            {notifications.map((notification) => (
                                <div
                                    key={notification.id}
                                    className={cn(
                                        "relative group flex flex-col gap-1 p-4 text-left border-b last:border-0 hover:bg-muted/50 transition-colors cursor-pointer",
                                        !notification.read && "bg-muted/20"
                                    )}
                                    onClick={() => handleItemClick(notification)}
                                >
                                    <div className="flex items-start justify-between w-full">
                                        <div className="flex-1 pr-6">
                                            <div className="flex items-center gap-2">
                                                <span className={cn("text-sm font-medium block", !notification.read && "text-primary")}>
                                                    {notification.title}
                                                </span>
                                                {notification.link && (
                                                    <ExternalLink className="h-3 w-3 text-muted-foreground opacity-50" />
                                                )}
                                            </div>
                                            <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                                                {notification.description}
                                            </p>
                                            {notification.link && (
                                                <p className="text-[10px] text-primary/80 mt-1 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                                                    Click to view details <ExternalLink className="h-2 w-2" />
                                                </p>
                                            )}
                                        </div>
                                        <span className="text-[10px] text-muted-foreground whitespace-nowrap ml-2 flex-shrink-0">
                                            {formatDistanceToNow(notification.timestamp, { addSuffix: true })}
                                        </span>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="flex items-center justify-end gap-1 mt-2">
                                        {!notification.read && (
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-6 px-2 text-[10px] text-primary hover:text-primary hover:bg-primary/10"
                                                onClick={(e) => handleMarkRead(e, notification.id)}
                                                disabled={pendingReadIds.has(notification.id)}
                                            >
                                                {pendingReadIds.has(notification.id) ? (
                                                    <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                                                ) : (
                                                    <Check className="h-3 w-3 mr-1" />
                                                )}
                                                Mark as Read
                                            </Button>
                                        )}
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-6 px-2 text-[10px] text-destructive hover:text-destructive hover:bg-destructive/10"
                                            onClick={(e) => handleDelete(e, notification.id)}
                                        >
                                            <Trash2 className="h-3 w-3 mr-1" />
                                            Delete
                                        </Button>
                                    </div>

                                    {!notification.read && (
                                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary" />
                                    )}

                                    {/* Loading Overlay */}
                                    {pendingReadIds.has(notification.id) && (
                                        <div className="absolute inset-0 bg-background/50 flex items-center justify-center">
                                            <Loader2 className="h-5 w-5 animate-spin text-primary" />
                                        </div>
                                    )}
                                </div>
                            ))}

                            {/* Infinite Scroll Sentinel */}
                            <div ref={ref} className="p-4 flex justify-center">
                                {isLoadingMore && (
                                    <span className="text-xs text-muted-foreground animate-pulse">Loading more...</span>
                                )}
                            </div>
                        </div>
                    )}
                </ScrollArea>
            </PopoverContent>
        </Popover>
    );
}
