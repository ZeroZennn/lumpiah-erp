
import { useState, useMemo } from "react";
import { DataTable } from "@/shared/components/ui/data-table";
import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/shared/components/ui/badge";
import { formatCurrency } from "@/shared/lib/format";
import { DataTableColumnHeader } from '@/shared/components/ui/data-table-column-header';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/components/ui/select";
import { Input } from "@/shared/components/ui/input";
import { Search, X } from "lucide-react";
import { Button } from "@/shared/components/ui/button";

interface ItemBreakdown {
    productId: number;
    productName: string;
    categoryName: string;
    qtySold: number;
    totalValue: number;
}

interface ItemBreakdownTableProps {
    data: ItemBreakdown[];
    isLoading: boolean;
}

export function ItemBreakdownTable({ data, isLoading }: ItemBreakdownTableProps) {
    const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });
    const [search, setSearch] = useState("");
    const [categoryFilter, setCategoryFilter] = useState("all");

    // Extract unique categories
    const categories = useMemo(() => {
        const cats = Array.from(new Set(data.map(item => item.categoryName)));
        return cats.sort();
    }, [data]);

    // Local Filtering
    const filteredData = useMemo(() => {
        return data.filter(item => {
            const matchesSearch = item.productName.toLowerCase().includes(search.toLowerCase());
            const matchesCategory = categoryFilter === "all" || item.categoryName === categoryFilter;
            return matchesSearch && matchesCategory;
        });
    }, [data, search, categoryFilter]);

    const columns: ColumnDef<ItemBreakdown>[] = [
        {
            accessorKey: "productName",
            header: ({ column }) => <DataTableColumnHeader column={column} title="Nama Produk" />,
            cell: ({ row }) => <div className="font-bold text-slate-900">{row.original.productName}</div>
        },
        {
            accessorKey: "categoryName",
            header: ({ column }) => <DataTableColumnHeader column={column} title="Kategori" />,
            cell: ({ row }) => <div className="uppercase text-[10px] tracking-widest text-muted-foreground">{row.original.categoryName}</div>
        },
        {
            accessorKey: "qtySold",
            header: ({ column }) => <DataTableColumnHeader column={column} title="Qty Terjual" className="justify-center" />,
            cell: ({ row }) => (
                <div className="flex justify-center">
                    <Badge variant="outline" className="border-slate-200 bg-slate-50">{row.original.qtySold}</Badge>
                </div>
            )
        },
        {
            accessorKey: "totalValue",
            header: ({ column }) => <DataTableColumnHeader column={column} title="Total Nilai" className="justify-end" />,
            cell: ({ row }) => <div className="text-right font-black text-primary">{formatCurrency(row.original.totalValue)}</div>
        }
    ];

    const toolbarActions = (
        <div className="flex flex-wrap items-center gap-2">
            <div className="relative w-full md:w-64">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Cari produk..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-9 h-9"
                />
                {search && (
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setSearch('')}
                        className="absolute right-0 top-0 h-9 w-9 text-muted-foreground"
                    >
                        <X className="h-4 w-4" />
                    </Button>
                )}
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-[160px] h-9">
                    <SelectValue placeholder="Semua Kategori" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">Semua Kategori</SelectItem>
                    {categories.map(cat => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
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
            pagination={pagination}
            onPaginationChange={setPagination}
            toolbarActions={toolbarActions}
        />
    );
}
