"use client";

import { useEffect } from "react";
import { useForm, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/shared/components/ui/dialog";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
    FormDescription,
} from "@/shared/components/ui/form";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/shared/components/ui/select";
import { Input } from "@/shared/components/ui/input";
import { Button } from "@/shared/components/ui/button";
import { Switch } from "@/shared/components/ui/switch";
import { User, Role } from "../api/users.types";
import { Branch } from "@/features/branches/api/branches.types";

const userSchema = z.object({
    fullname: z.string().min(2, "Nama lengkap harus diisi"),
    email: z.string().email("Email tidak valid"),
    phoneNumber: z.string(),
    roleId: z.string().min(1, "Role harus dipilih"),
    branchId: z.string(),
    password: z.string().optional(),
    isActive: z.boolean(),
});

export type UserFormValues = z.infer<typeof userSchema>;

interface UserDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    user?: User;
    roles: Role[];
    branches: Branch[];
    onSubmit: SubmitHandler<UserFormValues>;
    isPending?: boolean;
}

export function UserDialog({
    open,
    onOpenChange,
    user,
    roles,
    branches,
    onSubmit,
    isPending = false,
}: UserDialogProps) {
    const form = useForm<UserFormValues>({
        resolver: zodResolver(userSchema),
        defaultValues: {
            fullname: "",
            email: "",
            phoneNumber: "",
            roleId: "",
            branchId: "none",
            password: "",
            isActive: true,
        },
    });

    useEffect(() => {
        if (open) {
            if (user) {
                form.reset({
                    fullname: user.fullname,
                    email: user.email,
                    phoneNumber: user.phoneNumber || "",
                    roleId: String(user.roleId),
                    branchId: user.branchId ? String(user.branchId) : "none",
                    password: "",
                    isActive: user.isActive,
                });
            } else {
                form.reset({
                    fullname: "",
                    email: "",
                    phoneNumber: "",
                    roleId: "",
                    branchId: "none",
                    password: "",
                    isActive: true,
                });
            }
        }
    }, [open, user, form]);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>{user ? "Edit User" : "Tambah User Baru"}</DialogTitle>
                    <DialogDescription>
                        {user
                            ? "Perbarui informasi user di bawah ini."
                            : "Isi data user baru untuk didaftarkan ke sistem."}
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-2">
                        <FormField
                            control={form.control}
                            name="fullname"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Nama Lengkap</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Contoh: Budi Santoso" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="email"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Email</FormLabel>
                                        <FormControl>
                                            <Input placeholder="budi@example.com" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="phoneNumber"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>No. HP</FormLabel>
                                        <FormControl>
                                            <Input placeholder="0812..." {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="roleId"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Role</FormLabel>
                                        <Select
                                            onValueChange={field.onChange}
                                            value={field.value}
                                        >
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Pilih Role" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {roles.map((role) => (
                                                    <SelectItem key={role.id} value={String(role.id)}>
                                                        {role.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="branchId"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Cabang</FormLabel>
                                        <Select
                                            onValueChange={field.onChange}
                                            value={field.value}
                                        >
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Pilih Cabang" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="none">Pusat / Owner</SelectItem>
                                                {branches
                                                    .filter(b => b.isActive || (field.value !== "none" && b.id === Number(field.value)))
                                                    .map((branch) => (
                                                        <SelectItem key={branch.id} value={String(branch.id)}>
                                                            {branch.name}
                                                        </SelectItem>
                                                    ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="password"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>{user ? "Password Baru (Opsional)" : "Password"}</FormLabel>
                                        <FormControl>
                                            <Input type="password" placeholder="******" {...field} />
                                        </FormControl>
                                        {user && (
                                            <FormDescription>
                                                Kosongkan jika tidak ingin mengubah password
                                            </FormDescription>
                                        )}
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="isActive"
                                render={({ field }) => (
                                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm mt-8">
                                        <div className="space-y-0.5">
                                            <FormLabel>Status Aktif</FormLabel>
                                            <FormDescription>
                                                User dapat login jika aktif
                                            </FormDescription>
                                        </div>
                                        <FormControl>
                                            <Switch
                                                checked={field.value}
                                                onCheckedChange={field.onChange}
                                            />
                                        </FormControl>
                                    </FormItem>
                                )}
                            />
                        </div>

                        <DialogFooter className="pt-4">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => onOpenChange(false)}
                            >
                                Batal
                            </Button>
                            <Button type="submit" disabled={isPending}>
                                {isPending ? "Menyimpan..." : user ? "Simpan Perubahan" : "Tambah User"}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
