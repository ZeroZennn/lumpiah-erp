"use client"

import { ColumnDef } from "@tanstack/react-table"
import { MoreHorizontal, ArrowUpDown, Info, CheckCircle } from "lucide-react"

import { Button } from "@/shared/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuTrigger,
} from "@/shared/components/ui/dropdown-menu"
import { Badge } from "@/shared/components/ui/badge"
import { Checkbox } from "@/shared/components/ui/checkbox"
import { ProductionPlanWithRealization } from "../api/production.types"
import { RealizationDialog } from "@/features/production/components/realization-dialog"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/shared/components/ui/tooltip"
import { cn } from "@/shared/lib/utils"

export const columns: ColumnDef<ProductionPlanWithRealization>[] = [
    {
        id: "select",
        header: ({ table }) => (
            <Checkbox
                checked={
                    table.getIsAllPageRowsSelected() ||
                    (table.getIsSomePageRowsSelected() && "indeterminate")
                }
                onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
                aria-label="Select all"
            />
        ),
        cell: ({ row }) => (
            <Checkbox
                checked={row.getIsSelected()}
                onCheckedChange={(value) => row.toggleSelected(!!value)}
                aria-label="Select row"
            />
        ),
        enableSorting: false,
        enableHiding: false,
    },
    {
        accessorKey: "productName",
        header: ({ column }) => {
            return (
                <Button
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                >
                    Produk
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            )
        },
        cell: ({ row }) => {
            return (
                <div className="font-medium">
                    <div>{row.getValue("productName")}</div>
                    <div className="text-xs text-muted-foreground">ID: #{row.original.productId}</div>
                </div>
            )
        }
    },
    {
        accessorKey: "finalRecommendation",
        header: () => {
            return (
                <div className="text-right flex items-center justify-end gap-1">
                    Rekomendasi
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger>
                                <Info className="h-3.5 w-3.5 text-muted-foreground" />
                            </TooltipTrigger>
                            <TooltipContent className="max-w-[300px]">
                                <p className="font-semibold mb-1">Formula WMA:</p>
                                <p className="text-xs text-muted-foreground">
                                    Rekomendasi dihitung berdasarkan bobot historis penjualan + safety stock.
                                </p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                </div>
            )
        },
        cell: ({ row }) => {
            return (
                <div className="text-right">
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <div className="cursor-help decoration-dotted underline underline-offset-2 font-bold">
                                    {row.getValue("finalRecommendation")}
                                </div>
                            </TooltipTrigger>
                            <TooltipContent>
                                {row.original.calculationLog}
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                </div>
            )
        }
    },
    {
        id: "progress",
        header: "Realisasi Progress",
        cell: ({ row }) => {
            const plan = row.original;
            const percent = plan.realization
                ? Math.min((plan.realization.actualQty / plan.finalRecommendation) * 100, 100)
                : 0;

            return (
                <div className="w-[180px] space-y-1">
                    <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">{percent.toFixed(0)}%</span>
                    </div>
                    <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                        <div
                            className={cn("h-full transition-all", percent >= 100 ? "bg-emerald-500" : "bg-primary")}
                            style={{ width: `${percent}%` }}
                        />
                    </div>
                </div>
            )
        }
    },
    {
        accessorKey: "realization.actualQty",
        header: () => <div className="text-right">Qty</div>,
        cell: ({ row }) => {
            const realization = row.original.realization;
            if (!realization) return <div className="text-right text-muted-foreground">-</div>;

            return (
                <div className={cn("text-right font-medium", realization.deviation >= 0 ? "text-emerald-600" : "text-amber-600")}>
                    {realization.actualQty}
                </div>
            )
        },
    },
    {
        id: "status",
        header: () => <div className="text-center">Status</div>,
        cell: ({ row }) => {
            const realization = row.original.realization;
            return (
                <div className="text-center">
                    {realization ? (
                        <Badge variant="default" className="bg-emerald-500 hover:bg-emerald-600">
                            <CheckCircle className="mr-1 h-3 w-3" />
                            Selesai
                        </Badge>
                    ) : (
                        <Badge variant="secondary">
                            Pending
                        </Badge>
                    )}
                </div>
            )
        }
    },
    {
        id: "actions",
        cell: ({ row }) => {
            const payment = row.original

            return (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem
                            onClick={() => navigator.clipboard.writeText(String(payment.id))}
                        >
                            Copy Plan ID
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                            <div onClick={(e) => e.preventDefault()}>
                                <RealizationDialog />
                            </div>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            )
        },
    },
]
