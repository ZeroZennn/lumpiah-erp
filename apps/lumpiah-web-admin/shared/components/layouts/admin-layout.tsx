"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    LayoutDashboard,
    Building2,
    Package,
    Factory,
    Receipt,
    FileBarChart,
    UserCog,
    ClipboardList,
    Settings,
    ChevronLeft,
    Search,
    Bell,
    Grid3X3,
} from "lucide-react";
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarProvider,
    SidebarTrigger,
    useSidebar,
} from "@/shared/components/ui/sidebar";
import {
    Avatar,
    AvatarFallback,
    AvatarImage,
} from "@/shared/components/ui/avatar";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/shared/components/ui/dropdown-menu";
import { Input } from "@/shared/components/ui/input";
import { Button } from "@/shared/components/ui/button";

import { cn } from "@/shared/lib/utils";

// Navigation items grouped by section
const navGroups = [
    {
        label: "OVERVIEW",
        items: [
            { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
            { title: "Cabang", url: "/branches", icon: Building2 },
            { title: "Produk", url: "/products", icon: Package },
        ],
    },
    {
        label: "OPERASIONAL",
        items: [
            { title: "Produksi", url: "/production", icon: Factory },
            { title: "Transaksi", url: "/transactions", icon: Receipt },
            { title: "Laporan", url: "/reports", icon: FileBarChart },
        ],
    },
    {
        label: "HRM",
        items: [
            { title: "Kehadiran", url: "/attendance", icon: ClipboardList },
        ],
    },
    {
        label: "SISTEM",
        items: [
            { title: "Pengguna", url: "/users", icon: UserCog },
            { title: "Audit Log", url: "/users/audit", icon: ClipboardList },
        ],
    },
];

function SidebarNav() {
    const pathname = usePathname();
    const { state } = useSidebar();

    return (
        <>
            <SidebarHeader className="border-b border-sidebar-border bg-sidebar">
                <div className={cn(
                    "flex items-center px-2 py-3 transition-all",
                    state === "collapsed" ? "flex-col justify-center gap-4" : "justify-between gap-2"
                )}>
                    <div className="flex items-center gap-3 min-w-0">
                        <div className={cn(
                            "flex shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold transition-all duration-200 shadow-sm",
                            state === "collapsed" ? "h-8 w-8 text-sm" : "h-9 w-9 text-base"
                        )}>
                            L
                        </div>
                        {state !== "collapsed" && (
                            <div className="flex flex-col min-w-0">
                                <span className="font-semibold text-sm truncate">Lumpiah ERP</span>
                                <span className="text-xs text-muted-foreground truncate">Admin Panel</span>
                            </div>
                        )}
                    </div>

                    <SidebarTrigger className={cn(
                        "h-7 w-7 shrink-0 text-muted-foreground hover:text-foreground transition-colors",
                        state === "collapsed" ? "mx-auto" : ""
                    )} />
                </div>
            </SidebarHeader>

            <SidebarContent className="px-2">
                {navGroups.map((group, groupIndex) => (
                    <SidebarGroup key={group.label} className={groupIndex > 0 ? "pt-2" : ""}>
                        {state !== "collapsed" && (
                            <SidebarGroupLabel className="text-[10px] font-semibold text-muted-foreground/70 tracking-wider px-2 mb-1">
                                {group.label}
                            </SidebarGroupLabel>
                        )}
                        {state === "collapsed" && groupIndex > 0 && (
                            <div className="my-2 border-t border-sidebar-border" />
                        )}
                        <SidebarGroupContent>
                            <SidebarMenu>
                                {group.items.map((item) => {
                                    const isActive = pathname === item.url || pathname.startsWith(item.url + "/");
                                    return (
                                        <SidebarMenuItem key={item.title}>
                                            <SidebarMenuButton
                                                asChild
                                                isActive={isActive}
                                                tooltip={item.title}
                                                className="h-9"
                                            >
                                                <Link href={item.url}>
                                                    <item.icon className="h-4 w-4 shrink-0" />
                                                    <span>{item.title}</span>
                                                </Link>
                                            </SidebarMenuButton>
                                        </SidebarMenuItem>
                                    );
                                })}
                            </SidebarMenu>
                        </SidebarGroupContent>
                    </SidebarGroup>
                ))}
            </SidebarContent>

            <SidebarFooter className="border-t border-sidebar-border">
                <SidebarMenu>
                    <SidebarMenuItem>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <SidebarMenuButton className="w-full">
                                    <Avatar className="h-6 w-6">
                                        <AvatarImage src="" alt="Owner" />
                                        <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                                            OW
                                        </AvatarFallback>
                                    </Avatar>
                                    <span className="flex-1 text-left">Owner</span>
                                    <ChevronLeft className="h-4 w-4 rotate-[-90deg]" />
                                </SidebarMenuButton>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent side="top" className="w-56">
                                <DropdownMenuLabel>Akun Saya</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem>
                                    <Settings className="mr-2 h-4 w-4" />
                                    Pengaturan
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem className="text-destructive">
                                    Keluar
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarFooter>
        </>
    );
}

function AdminHeader() {
    return (
        <header className="sticky top-0 z-40 flex h-16 items-center gap-4 border-b bg-background px-6">

            {/* Search */}
            <div className="flex-1 max-w-md">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        placeholder="Cari..."
                        className="pl-9 bg-muted/50 border-0 focus-visible:ring-1"
                    />
                </div>
            </div>

            <div className="flex items-center gap-2 ml-auto">
                {/* Notifications */}
                <Button variant="ghost" size="icon" className="relative">
                    <Bell className="h-5 w-5" />
                    <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-destructive text-[10px] font-medium text-destructive-foreground flex items-center justify-center">
                        3
                    </span>
                </Button>

                {/* Grid Menu */}
                <Button variant="ghost" size="icon">
                    <Grid3X3 className="h-5 w-5" />
                </Button>

                {/* Settings */}
                <Button variant="ghost" size="icon">
                    <Settings className="h-5 w-5" />
                </Button>
            </div>
        </header>
    );
}

interface AdminLayoutProps {
    children: React.ReactNode;
}

export function AdminLayout({ children }: AdminLayoutProps) {
    return (
        <SidebarProvider>
            <div className="flex min-h-screen w-full">
                <Sidebar collapsible="icon" className="border-r">
                    <SidebarNav />
                </Sidebar>
                <div className="flex flex-1 flex-col">
                    <AdminHeader />
                    <main className="flex-1 overflow-auto bg-muted/30 p-6">
                        {children}
                    </main>
                </div>
            </div>
        </SidebarProvider>
    );
}

export default AdminLayout;
