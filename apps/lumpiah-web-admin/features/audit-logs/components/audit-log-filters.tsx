import { Input } from "@/shared/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/shared/components/ui/select";
import { Button } from "@/shared/components/ui/button";
import { X } from "lucide-react";

interface AuditLogFiltersProps {
    filters: {
        startDate?: string;
        endDate?: string;
        userId?: string;
        actionType?: string;
        targetTable?: string;
        search?: string;
    };
    onFilterChange: (key: string, value: string | undefined) => void;
    users: Array<{ id: number; fullname: string }>; // Pass users list for dropdown
}

export function AuditLogFilters({ filters, onFilterChange, users }: AuditLogFiltersProps) {
    return (
        <div className="flex flex-col gap-4 md:flex-row md:items-end">
            <div className="flex-1 space-y-2">
                <label className="text-sm font-medium">Search (Target ID)</label>
                <div className="relative">
                    <Input
                        placeholder="Search Target ID..."
                        value={filters.search || ""}
                        onChange={(e) => onFilterChange("search", e.target.value)}
                        className="w-full"
                    />
                    {filters.search && (
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onFilterChange("search", undefined)}
                            className="absolute right-0 top-0 h-9 w-9 text-muted-foreground hover:bg-transparent"
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    )}
                </div>
            </div>

            <div className="w-[200px] space-y-2">
                <label className="text-sm font-medium">Action Type</label>
                <Select
                    value={filters.actionType || "all"}
                    onValueChange={(val) => onFilterChange("actionType", val === "all" ? undefined : val)}
                >
                    <SelectTrigger>
                        <SelectValue placeholder="All Actions" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Actions</SelectItem>
                        <SelectItem value="LOGIN">LOGIN</SelectItem>
                        <SelectItem value="CREATE">CREATE</SelectItem>
                        <SelectItem value="UPDATE">UPDATE</SelectItem>
                        <SelectItem value="DELETE">DELETE</SelectItem>
                        <SelectItem value="VOID">VOID</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <div className="w-[200px] space-y-2">
                <label className="text-sm font-medium">Feature</label>
                <Select
                    value={filters.targetTable || "all"}
                    onValueChange={(val) => onFilterChange("targetTable", val === "all" ? undefined : val)}
                >
                    <SelectTrigger>
                        <SelectValue placeholder="All Features" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Features</SelectItem>
                        <SelectItem value="users">Users / Auth</SelectItem>
                        <SelectItem value="products">Products</SelectItem>
                        <SelectItem value="transactions">Transactions</SelectItem>
                        <SelectItem value="attendance">Attendance</SelectItem>
                        <SelectItem value="branches">Branches</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <div className="w-[200px] space-y-2">
                <label className="text-sm font-medium">User</label>
                <Select
                    value={filters.userId || "all"}
                    onValueChange={(val) => onFilterChange("userId", val === "all" ? undefined : val)}
                >
                    <SelectTrigger>
                        <SelectValue placeholder="All Users" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Users</SelectItem>
                        {users?.map((user) => (
                            <SelectItem key={user.id} value={user.id.toString()}>
                                {user.fullname}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {/* Date Range Picker can be added here - omitted for brevity but slot available */}
        </div >
    );
}
