"use client";

import { use, useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save, MapPin, Receipt, Calendar, Plus, MoreHorizontal, Pencil, Shield, Key } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Textarea } from "@/shared/components/ui/textarea";
import { Switch } from "@/shared/components/ui/switch";
import { Badge } from "@/shared/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Separator } from "@/shared/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/shared/components/ui/dropdown-menu";
import { useBranch, useUpdateBranch } from "@/features/branches/api/use-branches";
import { useUsersByBranch, useRoles, useCreateUser, useUpdateUser } from "@/features/users/api/use-users";
import { UserDialog } from "@/features/users/components/UserDialog";
import { User, CreateUserRequest, UpdateUserRequest } from "@/features/users/api/users.types";
import { notify } from "@/shared/lib/notify";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";

// Rename to Content
function BranchDetailPageContent({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = use(params);
    const branchId = Number(id);
    const searchParams = useSearchParams();
    const router = useRouter();
    const isEditMode = searchParams.get("edit") === "true";

    const { data: branch, isLoading, isError } = useBranch(branchId);
    const { data: users = [], isLoading: usersLoading } = useUsersByBranch(branchId);
    const { data: roles = [] } = useRoles();

    const updateBranchMutation = useUpdateBranch();
    const createUserMutation = useCreateUser();
    const updateUserMutation = useUpdateUser();

    const [isUserDialogOpen, setIsUserDialogOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState<User | undefined>();

    // Local state for form forms
    const [formData, setFormData] = useState({
        name: "",
        address: "",
        receiptFooter: "",
        isActive: true,
    });

    useEffect(() => {
        if (branch) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setFormData({
                name: branch.name,
                address: branch.address || "",
                receiptFooter: branch.receiptFooter || "",
                isActive: branch.isActive,
            });
        }
    }, [branch]);

    const handleSave = () => {
        updateBranchMutation.mutate(
            {
                id: branchId,
                data: {
                    name: formData.name,
                    address: formData.address,
                    // receiptFooter is not supported by API yet
                },
            },
            {
                onSuccess: () => {
                    notify.success("Branch updated successfully");
                    router.push(`/branches/${branchId}`); // Exit edit mode
                },
                onError: (error) => {
                    notify.error("Failed to update branch");
                    console.error(error);
                },
            }
        );
    };


    // Determine status to show: local state if editing, or server state
    // But actually the switch logic in existing code was inside edit mode mostly.
    // The switch in CardContent is disabled={!isEditMode}.

    if (isLoading) {
        return <div className="p-8 text-center">Loading branch details...</div>;
    }

    if (isError || !branch) {
        return (
            <div className="flex h-[50vh] items-center justify-center">
                <div className="text-center">
                    <h2 className="text-xl font-semibold">Cabang tidak ditemukan</h2>
                    <p className="text-muted-foreground mt-1">
                        Cabang dengan ID {branchId} tidak ada dalam sistem atau terjadi kesalahan.
                    </p>
                    <Button asChild className="mt-4">
                        <Link href="/branches">Kembali ke Daftar Cabang</Link>
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" asChild>
                    <Link href="/branches">
                        <ArrowLeft className="h-4 w-4" />
                    </Link>
                </Button>
                <div className="flex-1">
                    <div className="flex items-center gap-3">
                        <h1 className="text-2xl font-bold tracking-tight">{branch.name}</h1>
                        <Badge variant={branch.isActive ? "default" : "secondary"}>
                            {branch.isActive ? "Aktif" : "Nonaktif"}
                        </Badge>
                    </div>
                    <p className="text-muted-foreground flex items-center gap-1.5 mt-1">
                        <MapPin className="h-3.5 w-3.5" />
                        {branch.address || "Alamat belum diset"}
                    </p>
                </div>
                {isEditMode ? (
                    <Button className="gap-2" onClick={handleSave} disabled={updateBranchMutation.isPending}>
                        <Save className="h-4 w-4" />
                        {updateBranchMutation.isPending ? "Menyimpan..." : "Simpan Perubahan"}
                    </Button>
                ) : (
                    <Button asChild>
                        <Link href={`/branches/${branchId}?edit=true`}>Edit Cabang</Link>
                    </Button>
                )}
            </div>

            {/* Tabs */}
            <Tabs defaultValue="info" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="info">Informasi</TabsTrigger>
                    <TabsTrigger value="employees">Pegawai ({users.length})</TabsTrigger>
                    <TabsTrigger value="receipt">Konfigurasi Struk</TabsTrigger>
                </TabsList>

                <TabsContent value="info" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Informasi Cabang</CardTitle>
                            <CardDescription>
                                Detail dan pengaturan dasar cabang
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="name">Nama Cabang</Label>
                                    <Input
                                        id="name"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        disabled={!isEditMode}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="address">Alamat</Label>
                                    <Input
                                        id="address"
                                        value={formData.address}
                                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                        placeholder="Masukkan alamat cabang"
                                        disabled={!isEditMode}
                                    />
                                </div>
                            </div>

                            <Separator />

                            <div className="flex items-center justify-between rounded-lg border p-4">
                                <div className="space-y-0.5">
                                    <Label htmlFor="status">Status Operasional</Label>
                                    <p className="text-sm text-muted-foreground">
                                        {formData.isActive
                                            ? "Cabang aktif dan POS dapat digunakan"
                                            : "Cabang nonaktif, POS akan terkunci"}
                                    </p>
                                </div>
                                <Switch
                                    id="status"
                                    checked={formData.isActive}
                                    onCheckedChange={(c) => {
                                        // If we are in edit mode, just update local state
                                        // But wait, the Update endpoint doesn't support status update in my implementation?
                                        // My Service has update(id, dto) and updateStatus(id, isActive).
                                        // My UpdateBranchDto allows isActive?
                                        // Let's check UpdateBranchDto. 
                                        // CreateBranchDto has optional isActive. So UpdateBranchDto (Partial) has it too.
                                        // So I can update it via main update endpoint.
                                        setFormData({ ...formData, isActive: c });
                                    }}
                                    disabled={!isEditMode}
                                />
                            </div>

                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Calendar className="h-4 w-4" />
                                Dibuat pada {branch.createdAt ? format(new Date(branch.createdAt), "dd MMMM yyyy", { locale: localeId }) : "-"}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="employees" className="space-y-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                                <CardTitle>Daftar Pegawai</CardTitle>
                                <CardDescription>
                                    Pegawai yang terdaftar di cabang ini
                                </CardDescription>
                            </div>
                            <Button className="gap-2" size="sm" onClick={() => {
                                setSelectedUser(undefined);
                                setIsUserDialogOpen(true);
                            }}>
                                <Plus className="h-4 w-4" />
                                Tambah Pegawai
                            </Button>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Nama</TableHead>
                                        <TableHead>Email</TableHead>
                                        <TableHead>Role</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="w-[50px]"></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {usersLoading ? (
                                        <TableRow>
                                            <TableCell colSpan={5} className="text-center py-8">Loading employees...</TableCell>
                                        </TableRow>
                                    ) : users.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                                                Belum ada pegawai di cabang ini
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        users.map((user) => (
                                            <TableRow key={user.id}>
                                                <TableCell className="font-medium">{user.fullname}</TableCell>
                                                <TableCell className="text-muted-foreground">{user.email}</TableCell>
                                                <TableCell>
                                                    <Badge variant="outline">
                                                        <Shield className="mr-1 h-3 w-3" />
                                                        {user.role?.name || "Pegawai"}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant={user.isActive ? "default" : "secondary"}>
                                                        {user.isActive ? "Aktif" : "Nonaktif"}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="ghost" size="icon">
                                                                <MoreHorizontal className="h-4 w-4" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end">
                                                            <DropdownMenuItem onClick={() => {
                                                                setSelectedUser(user);
                                                                setIsUserDialogOpen(true);
                                                            }}>
                                                                <Pencil className="mr-2 h-4 w-4" />
                                                                Edit
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem onClick={() => {
                                                                setSelectedUser(user);
                                                                setIsUserDialogOpen(true);
                                                            }}>
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
                </TabsContent>

                <TabsContent value="receipt" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Receipt className="h-5 w-5" />
                                Konfigurasi Struk
                            </CardTitle>
                            <CardDescription>
                                Sesuaikan pesan footer yang tampil di struk cabang ini
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="space-y-2">
                                <Label htmlFor="receiptFooter">Pesan Footer Struk</Label>
                                <Textarea
                                    id="receiptFooter"
                                    value={formData.receiptFooter}
                                    onChange={(e) => setFormData({ ...formData, receiptFooter: e.target.value })}
                                    placeholder="Contoh: Terima kasih telah berbelanja! Promo 10% untuk member."
                                    rows={3}
                                    disabled={!isEditMode}
                                />
                                <p className="text-xs text-muted-foreground">
                                    Pesan ini akan muncul di bagian bawah struk pembayaran (Belum disimpan ke database)
                                </p>
                            </div>

                            {/* Receipt Preview */}
                            <div className="rounded-lg border bg-white p-4">
                                <p className="text-sm font-medium mb-3">Preview Struk:</p>
                                <div className="border rounded bg-gray-50 p-4 font-mono text-xs space-y-1">
                                    <p className="text-center font-bold">{formData.name || "Nama Cabang"}</p>
                                    <p className="text-center text-[10px]">{formData.address || "Alamat"}</p>
                                    <p className="text-center">-------------------</p>
                                    <p>Lumpia Kecil x2     Rp 10.000</p>
                                    <p>Lumpia Besar x1     Rp  8.000</p>
                                    <p className="text-center">-------------------</p>
                                    <p className="font-bold">TOTAL:          Rp 18.000</p>
                                    <p className="text-center">-------------------</p>
                                    <p className="text-center text-[10px] mt-2">
                                        {formData.receiptFooter || "Terima kasih!"}
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            <UserDialog
                open={isUserDialogOpen}
                onOpenChange={setIsUserDialogOpen}
                user={selectedUser}
                roles={roles}
                branches={branch ? [branch] : []}
                onSubmit={(values) => {
                    const payload: Record<string, unknown> = {
                        email: values.email,
                        fullname: values.fullname,
                        roleId: Number(values.roleId),
                        phoneNumber: values.phoneNumber,
                        isActive: values.isActive,
                        branchId: values.branchId === "none" ? null : Number(values.branchId),
                    };

                    if (selectedUser) {
                        if (values.password) {
                            payload.password = values.password;
                        }
                        updateUserMutation.mutate({ id: selectedUser.id, data: payload as unknown as UpdateUserRequest }, {
                            onSuccess: () => {
                                notify.success("Pegawai berhasil diperbarui");
                                setIsUserDialogOpen(false);
                            },
                            onError: () => notify.error("Gagal memperbarui pegawai")
                        });
                    } else {
                        payload.password = values.password;
                        createUserMutation.mutate(payload as unknown as CreateUserRequest, {
                            onSuccess: () => {
                                notify.success("Pegawai berhasil ditambahkan");
                                setIsUserDialogOpen(false);
                            },
                            onError: () => notify.error("Gagal menambahkan pegawai")
                        });
                    }
                }}
                isPending={createUserMutation.isPending || updateUserMutation.isPending}
            />
        </div>
    );
}

export default function BranchDetailPage(props: any) {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <BranchDetailPageContent {...props} />
        </Suspense>
    );
}
