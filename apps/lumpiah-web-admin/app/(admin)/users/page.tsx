"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, MoreHorizontal, Pencil, Shield, Key, History } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Badge } from "@/shared/components/ui/badge";
import { Switch } from "@/shared/components/ui/switch";
import { Input } from "@/shared/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/shared/components/ui/table";
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
import { useUsers, useRoles, useCreateUser, useUpdateUser } from "@/features/users/api/use-users";
import { useBranches } from "@/features/branches/api/use-branches";
import { UserDialog, type UserFormValues } from "@/features/users/components/UserDialog";
import { notify } from "@/shared/lib/notify";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { User } from "@/features/users/api/users.types";

export default function UsersPage() {
    const { data: users = [], isLoading: usersLoading } = useUsers();
    const { data: roles = [], isLoading: rolesLoading } = useRoles();
    const { data: branches = [], isLoading: branchesLoading } = useBranches();

    const createUserMutation = useCreateUser();
    const updateUserMutation = useUpdateUser();

    const [searchQuery, setSearchQuery] = useState("");
    const [roleFilter, setRoleFilter] = useState<string>("all");
    const [branchFilter, setBranchFilter] = useState<string>("all");

    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState<User | undefined>();

    const handleOpenCreate = () => {
        setSelectedUser(undefined);
        setIsDialogOpen(true);
    };

    const handleOpenEdit = (user: User) => {
        setSelectedUser(user);
        setIsDialogOpen(true);
    };

    const handleFormSubmit = (values: UserFormValues) => {
        try {
            const payload: import("@/features/users/api/users.types").UpdateUserRequest = {
                email: values.email,
                fullname: values.fullname,
                roleId: Number(values.roleId),
                phoneNumber: values.phoneNumber,
                isActive: values.isActive,
            };

            payload.branchId = values.branchId === "none" ? null : Number(values.branchId);

            if (selectedUser) {
                // Remove password if empty for edit
                if (values.password) {
                    payload.password = values.password;
                }

                updateUserMutation.mutate({ id: selectedUser.id, data: payload }, {
                    onSuccess: () => {
                        notify.success("User berhasil diperbarui");
                        setIsDialogOpen(false);
                    },
                    onError: () => notify.error("Gagal memperbarui user")
                });
            } else {
                payload.password = values.password;
                createUserMutation.mutate(payload as import("@/features/users/api/users.types").CreateUserRequest, {
                    onSuccess: () => {
                        notify.success("User berhasil ditambahkan");
                        setIsDialogOpen(false);
                    },
                    onError: () => notify.error("Gagal menambahkan user")
                });
            }
        } catch {
            notify.error("Terjadi kesalahan sistem");
        }
    };

    const handleToggleStatus = (user: User) => {
        const newStatus = !user.isActive;
        updateUserMutation.mutate(
            { id: user.id, data: { isActive: newStatus } },
            {
                onSuccess: () => notify.success(`User ${newStatus ? "diaktifkan" : "dinonaktifkan"}`),
                onError: () => notify.error("Gagal mengubah status user")
            }
        );
    };

    const filteredUsers = users.filter((user) => {
        const matchesSearch =
            user.fullname.toLowerCase().includes(searchQuery.toLowerCase()) ||
            user.email.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesRole = roleFilter === "all" || user.roleId === Number(roleFilter);
        const matchesBranch =
            branchFilter === "all" ||
            (branchFilter === "none" && user.branchId === null) ||
            user.branchId === Number(branchFilter);
        return matchesSearch && matchesRole && matchesBranch;
    });

    if (usersLoading || rolesLoading || branchesLoading) {
        return <div className="p-8 text-center">Loading users...</div>;
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Manajemen User</h1>
                    <p className="text-muted-foreground">
                        Kelola pengguna dan hak akses
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" asChild>
                        <Link href="/users/audit">
                            <History className="mr-2 h-4 w-4" />
                            Audit Log
                        </Link>
                    </Button>
                    <Button className="gap-2" onClick={handleOpenCreate}>
                        <Plus className="h-4 w-4" />
                        Tambah User
                    </Button>
                </div>
            </div>

            {/* Stats */}
            <div className="grid gap-4 md:grid-cols-4">
                <Card>
                    <CardContent className="pt-6">
                        <div className="text-2xl font-bold">{users.length}</div>
                        <p className="text-xs text-muted-foreground">Total User</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="text-2xl font-bold text-emerald-600">
                            {users.filter((u) => u.isActive).length}
                        </div>
                        <p className="text-xs text-muted-foreground">User Aktif</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="text-2xl font-bold text-orange-600">
                            {users.filter((u) => !u.isActive).length}
                        </div>
                        <p className="text-xs text-muted-foreground">User Nonaktif</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="text-2xl font-bold">{roles.length}</div>
                        <p className="text-xs text-muted-foreground">Jenis Role</p>
                    </CardContent>
                </Card>
            </div>

            {/* Filters */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-base">Filter</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-wrap gap-4">
                        <div className="flex-1 min-w-[200px]">
                            <Input
                                placeholder="Cari nama atau email..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <Select value={roleFilter} onValueChange={setRoleFilter}>
                            <SelectTrigger className="w-[180px]">
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
                        <Select value={branchFilter} onValueChange={setBranchFilter}>
                            <SelectTrigger className="w-[180px]">
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
                </CardContent>
            </Card>

            {/* Users Table */}
            <Card>
                <CardHeader>
                    <CardTitle>Daftar User</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Nama</TableHead>
                                <TableHead>Email</TableHead>
                                <TableHead>Cabang</TableHead>
                                <TableHead>Role</TableHead>
                                <TableHead>Dibuat Pada</TableHead>
                                <TableHead className="text-center">Status</TableHead>
                                <TableHead className="w-[50px]"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredUsers.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                                        Tidak ada user yang ditemukan
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredUsers.map((user) => (
                                    <TableRow key={user.id}>
                                        <TableCell className="font-medium">{user.fullname}</TableCell>
                                        <TableCell className="text-muted-foreground">{user.email}</TableCell>
                                        <TableCell>{user.branchName || "Pusat"}</TableCell>
                                        <TableCell>
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
                                        </TableCell>
                                        <TableCell className="text-sm text-muted-foreground">
                                            {user.createdAt ? format(new Date(user.createdAt), "dd MMM yyyy", { locale: localeId }) : "-"}
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <div className="flex items-center justify-center gap-2">
                                                <Switch
                                                    checked={user.isActive}
                                                    onCheckedChange={() => handleToggleStatus(user)}
                                                    disabled={updateUserMutation.isPending}
                                                />
                                                <Badge variant={user.isActive ? "default" : "secondary"}>
                                                    {user.isActive ? "Aktif" : "Nonaktif"}
                                                </Badge>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon">
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem onClick={() => handleOpenEdit(user)}>
                                                        <Pencil className="mr-2 h-4 w-4" />
                                                        Edit User
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => handleOpenEdit(user)}>
                                                        <Key className="mr-2 h-4 w-4" />
                                                        Ganti Password
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <UserDialog
                open={isDialogOpen}
                onOpenChange={setIsDialogOpen}
                user={selectedUser}
                roles={roles}
                branches={branches}
                onSubmit={handleFormSubmit}
                isPending={createUserMutation.isPending || updateUserMutation.isPending}
            />
        </div>
    );
}