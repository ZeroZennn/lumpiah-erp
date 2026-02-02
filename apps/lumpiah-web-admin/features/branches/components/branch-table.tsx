"use client";

import { useMemo, useCallback, useState, useEffect } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { ColumnDef } from "@tanstack/react-table";
import { MoreHorizontal, Pencil, Eye, MapPin, Users, Search, X } from "lucide-react";
import { Input } from "@/shared/components/ui/input";
import Link from "next/link";
import { useUpdateBranchStatus } from "@/features/branches/api/use-branches";
import { DataTable } from "@/shared/components/ui/data-table";
import { DataTableColumnHeader } from "@/shared/components/ui/data-table-column-header";
import { Button } from "@/shared/components/ui/button";
import { Badge } from "@/shared/components/ui/badge";
import { Switch } from "@/shared/components/ui/switch";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/shared/components/ui/dropdown-menu";
import { notify } from "@/shared/lib/notify";
import { useDebounce } from "@/shared/hooks/use-debounce";

export interface Branch {
    id: number;
    name: string;
    address?: string;
    isActive: boolean;
    _count?: {
        users: number;
    };
}

interface BranchTableProps {
    data: Branch[];
    isLoading: boolean;
}

export function BranchTable({ data, isLoading }: BranchTableProps) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const updateStatusMutation = useUpdateBranchStatus();

    const handleToggleActive = useCallback((id: number, currentStatus: boolean) => {
        updateStatusMutation.mutate(
            { id, isActive: !currentStatus },
            {
                onSuccess: () => {
                    notify.success(`Cabang ${!currentStatus ? "diaktifkan" : "dinonaktifkan"}`);
                },
                onError: (error) => {
                    console.error("Failed to update status", error);
                    notify.error("Gagal mengubah status cabang");
                }
            }
        );
    }, [updateStatusMutation]);

    const columns = useMemo<ColumnDef<Branch>[]>(() => [
        {
            accessorKey: "name",
            header: ({ column }) => <DataTableColumnHeader column={column} title="Nama Cabang" />,
            cell: ({ row }) => (
                <div className="font-medium">{row.original.name}</div>
            ),
        },
        {
            accessorKey: "address",
            header: ({ column }) => <DataTableColumnHeader column={column} title="Alamat" />,
            cell: ({ row }) => (
                <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <MapPin className="h-3.5 w-3.5" />
                    {row.original.address || "-"}
                </div>
            ),
        },
        {
            id: "users",
            header: ({ column }) => <DataTableColumnHeader column={column} title="Pegawai" className="justify-center" />,
            cell: ({ row }) => (
                <div className="flex items-center justify-center gap-1.5">
                    <Users className="h-3.5 w-3.5 text-muted-foreground" />
                    {row.original._count?.users ?? 0}
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
                        onCheckedChange={() => handleToggleActive(row.original.id, row.original.isActive)}
                        disabled={updateStatusMutation.isPending}
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
                const branch = row.original;
                return (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 p-0">
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                                <Link href={`/branches/${branch.id}`}>
                                    <Eye className="mr-2 h-4 w-4" />
                                    Lihat Detail
                                </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                                <Link href={`/branches/${branch.id}?edit=true`}>
                                    <Pencil className="mr-2 h-4 w-4" />
                                    Edit Cabang
                                </Link>
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                );
            },
        },
    ], [handleToggleActive, updateStatusMutation.isPending]);

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

    // Manual Filtering
    const filteredData = useMemo(() => {
        if (!data) return [];
        if (!urlSearchQuery) return data;
        return data.filter((branch) =>
            branch.name.toLowerCase().includes(urlSearchQuery.toLowerCase()) ||
            (branch.address && branch.address.toLowerCase().includes(urlSearchQuery.toLowerCase()))
        );
    }, [data, urlSearchQuery]);

    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

    const toolbarActions = (
        <div className="relative w-full md:w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
                placeholder="Cari cabang..."
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
