"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { Plus, History } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { UserTable } from "@/features/users/components/user-table";
import { useUsers, useRoles, useCreateUser, useUpdateUser } from "@/features/users/api/use-users";
import { useBranches } from "@/features/branches/api/use-branches";
import { UserDialog, type UserFormValues } from "@/features/users/components/UserDialog";
import { notify } from "@/shared/lib/notify";
import { User } from "@/features/users/api/users.types";

export default function UsersPage() {
    const { data: users = [], isLoading: usersLoading } = useUsers();
    const { data: roles = [], isLoading: rolesLoading } = useRoles();
    const { data: branches = [], isLoading: branchesLoading } = useBranches();

    const createUserMutation = useCreateUser();
    const updateUserMutation = useUpdateUser();

    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState<User | undefined>();

    const handleOpenCreate = useCallback(() => {
        setSelectedUser(undefined);
        setIsDialogOpen(true);
    }, []);

    const handleOpenEdit = useCallback((user: User) => {
        setSelectedUser(user);
        setIsDialogOpen(true);
    }, []);

    const handleFormSubmit = useCallback((values: UserFormValues) => {
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
    }, [selectedUser, createUserMutation, updateUserMutation]);

    const handleToggleStatus = useCallback((user: User) => {
        const newStatus = !user.isActive;
        updateUserMutation.mutate(
            { id: user.id, data: { isActive: newStatus } },
            {
                onSuccess: () => notify.success(`User ${newStatus ? "diaktifkan" : "dinonaktifkan"}`),
                onError: () => notify.error("Gagal mengubah status user")
            }
        );
    }, [updateUserMutation]);

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

            {/* Users Table */}
            <Card>
                <CardHeader>
                    <CardTitle>Daftar User</CardTitle>
                </CardHeader>
                <CardContent>
                    <UserTable
                        data={users}
                        roles={roles}
                        branches={branches as any}
                        isLoading={usersLoading}
                        onEdit={handleOpenEdit}
                        onToggleStatus={handleToggleStatus}
                        isUpdatingStatus={updateUserMutation.isPending}
                    />
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