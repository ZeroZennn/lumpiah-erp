"use client";

import { useMemo, useCallback, useState, useEffect } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { ColumnDef } from "@tanstack/react-table";
import { MoreHorizontal, Pencil, Shield, Key, Search, X } from "lucide-react";
import { DataTable } from "@/shared/components/ui/data-table";
import { DataTableColumnHeader } from "@/shared/components/ui/data-table-column-header";
import { Button } from "@/shared/components/ui/button";
import { Badge } from "@/shared/components/ui/badge";
import { Switch } from "@/shared/components/ui/switch";
import { Input } from "@/shared/components/ui/input";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/shared/components/ui/dropdown-menu";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/shared/components/ui/select";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { User, Role } from "@/features/users/api/users.types";
import { Branch } from "@/features/branches/api/branches.types";
import { useDebounce } from "@/shared/hooks/use-debounce";

interface UserTableProps {
    data: User[];
    roles: Role[];
    branches: Branch[];
    isLoading: boolean;
    onEdit: (user: User) => void;
    onToggleStatus: (user: User) => void;
    isUpdatingStatus?: boolean;
}

export function UserTable({
    data,
    roles,
    branches,
    isLoading,
    onEdit,
    onToggleStatus,
    isUpdatingStatus
}: UserTableProps) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    // Helper to update URL params
    const updateFilterParams = useCallback((updates: Record<string, string>) => {
        const params = new URLSearchParams(searchParams.toString());
        let hasChanges = false;

        Object.entries(updates).forEach(([key, value]) => {
            const current = params.get(key);
            if (value && value !== 'all') {
                if (current !== value) {
                    params.set(key, value);
                    hasChanges = true;
                }
            } else {
                if (params.has(key)) {
                    params.delete(key);
                    hasChanges = true;
                }
            }
        });

        // Reset page to 1 on filter change
        if (!updates.page && params.has('page') && params.get('page') !== '1') {
            params.set('page', '1');
            hasChanges = true;
        }

        if (hasChanges) {
            router.push(`${pathname}?${params.toString()}`, { scroll: false });
        }
    }, [pathname, router, searchParams]);

    // --- Filter State (Synced with URL) ---
    const urlSearchQuery = searchParams.get('q') || '';
    const roleFilter = searchParams.get('role') || 'all';
    const branchFilter = searchParams.get('branch') || 'all';

    const [searchValue, setSearchValue] = useState(urlSearchQuery);
    const debouncedSearch = useDebounce(searchValue, 500);

    // Sync input with URL when URL changes externally
    useEffect(() => {
        setSearchValue(urlSearchQuery);
    }, [urlSearchQuery]);

    // Sync URL with debounced value
    useEffect(() => {
        if (debouncedSearch !== urlSearchQuery) {
            updateFilterParams({ q: debouncedSearch });
        }
    }, [debouncedSearch, urlSearchQuery, updateFilterParams]);

    // --- Columns ---
    const columns = useMemo<ColumnDef<User>[]>(() => [
        {
            accessorKey: "fullname",
            header: ({ column }) => <DataTableColumnHeader column={column} title="Nama" />,
            cell: ({ row }) => <div className="font-medium">{row.original.fullname}</div>,
        },
        {
            accessorKey: "email",
            header: ({ column }) => <DataTableColumnHeader column={column} title="Email" />,
            cell: ({ row }) => <div className="text-muted-foreground">{row.original.email}</div>,
        },
        {
            accessorKey: "branchId",
            header: ({ column }) => <DataTableColumnHeader column={column} title="Cabang" />,
            cell: ({ row }) => <div>{row.original.branch?.name || "Pusat"}</div>,
        },
        {
            accessorKey: "roleId",
            header: ({ column }) => <DataTableColumnHeader column={column} title="Role" />,
            cell: ({ row }) => {
                const user = row.original;
                return (
                    <Badge
                        variant="outline"
                        className={
                            user.role?.name === "Owner" || user.role?.name === "Admin"
                                ? "border-amber-500 text-amber-600 font-semibold"
                                : ""
                        }
                    >
                        <Shield className="mr-1 h-3 w-3" />
                        {user.role?.name || "Pegawai"}
                    </Badge>
                );
            },
        },
        {
            accessorKey: "createdAt",
            header: ({ column }) => <DataTableColumnHeader column={column} title="Dibuat Pada" />,
            cell: ({ row }) => (
                <div className="text-sm text-muted-foreground">
                    {row.original.createdAt ? format(new Date(row.original.createdAt), "dd MMM yyyy", { locale: localeId }) : "-"}
                </div>
            ),
        },
        {
            accessorKey: "isActive",
            header: ({ column }) => <DataTableColumnHeader column={column} title="Status" className="justify-center" />,
            cell: ({ row }) => (
                <div className="flex items-center justify-center gap-2">
                    <Switch
                        checked={row.original.isActive}
                        onCheckedChange={() => onToggleStatus(row.original)}
                        disabled={isUpdatingStatus}
                    />
                    <Badge variant={row.original.isActive ? "default" : "secondary"}>
                        {row.original.isActive ? "Aktif" : "Nonaktif"}
                    </Badge>
                </div>
            ),
        },
        {
            id: "actions",
            cell: ({ row }) => {
                const user = row.original;
                return (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 p-0">
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => onEdit(user)}>
                                <Pencil className="mr-2 h-4 w-4" />
                                <span className="ml-2">Edit User</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => onEdit(user)}>
                                <Key className="mr-2 h-4 w-4" />
                                <span className="ml-2">Ganti Password</span>
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                );
            },
        },
    ], [onEdit, onToggleStatus, isUpdatingStatus]);

    // --- Filter Logic ---
    const filteredData = useMemo(() => {
        if (!data) return [];
        return data.filter((user) => {
            const matchesSearch =
                user.fullname.toLowerCase().includes(urlSearchQuery.toLowerCase()) ||
                user.email.toLowerCase().includes(urlSearchQuery.toLowerCase());
            const matchesRole = roleFilter === "all" || user.roleId === Number(roleFilter);
            const matchesBranch =
                branchFilter === "all" ||
                (branchFilter === "none" && user.branchId === null) ||
                user.branchId === Number(branchFilter);
            return matchesSearch && matchesRole && matchesBranch;
        });
    }, [data, urlSearchQuery, roleFilter, branchFilter]);

    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

    const toolbarActions = (
        <div className="flex flex-wrap gap-2">
            <div className="min-w-[200px] relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Cari nama atau email..."
                    value={searchValue}
                    onChange={(e) => setSearchValue(e.target.value)}
                    className="pl-9 h-9"
                />
                {searchValue && (
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setSearchValue('')}
                        className="absolute right-0 top-0 h-9 w-9 text-muted-foreground"
                    >
                        <X className="h-4 w-4" />
                    </Button>
                )}
            </div>
            <Select value={roleFilter} onValueChange={(val) => updateFilterParams({ role: val })}>
                <SelectTrigger className="w-[150px] h-8">
                    <SelectValue placeholder="Semua Role" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">Semua Role</SelectItem>
                    {roles.map((role) => (
                        <SelectItem key={role.id} value={String(role.id)}>
                            {role.name}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
            <Select value={branchFilter} onValueChange={(val) => updateFilterParams({ branch: val })}>
                <SelectTrigger className="w-[150px] h-8">
                    <SelectValue placeholder="Semua Cabang" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">Semua Cabang</SelectItem>
                    <SelectItem value="none">Pusat / Owner</SelectItem>
                    {branches.filter(b => b.isActive).map((b) => (
                        <SelectItem key={b.id} value={String(b.id)}>
                            {b.name}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
    );

    return (
        <DataTable
            columns={columns}
            data={filteredData}
            isLoading={isLoading}
            toolbarActions={toolbarActions}
            pagination={{
                pageIndex: page - 1,
                pageSize: limit,
            }}
            onPaginationChange={(newPagination) => {
                updateFilterParams({
                    page: String(newPagination.pageIndex + 1),
                    limit: String(newPagination.pageSize)
                });
            }}
        />
    );
}
