"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { useCreateBranch } from "@/features/branches/api/use-branches";
import { notify } from "@/shared/lib/notify";

export default function NewBranchPage() {
    const router = useRouter();
    const createBranchMutation = useCreateBranch();

    const [formData, setFormData] = useState({
        name: "",
        address: "",
    });

    const handleSave = () => {
        if (!formData.name.trim()) {
            notify.error("Nama cabang harus diisi");
            return;
        }

        createBranchMutation.mutate(formData, {
            onSuccess: () => {
                notify.success("Cabang berhasil dibuat");
                router.push("/branches");
            },
            onError: (error) => {
                notify.error("Gagal membuat cabang");
                console.error(error);
            },
        });
    };

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
                    <h1 className="text-2xl font-bold tracking-tight">Tambah Cabang Baru</h1>
                    <p className="text-muted-foreground mt-1">
                        Buat cabang baru untuk sistem ERP
                    </p>
                </div>
                <Button className="gap-2" onClick={handleSave} disabled={createBranchMutation.isPending}>
                    <Save className="h-4 w-4" />
                    {createBranchMutation.isPending ? "Menyimpan..." : "Simpan Cabang"}
                </Button>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Informasi Cabang</CardTitle>
                    <CardDescription>
                        Detail dasar untuk cabang baru
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
                                placeholder="Masukkan nama cabang"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="address">Alamat</Label>
                            <Input
                                id="address"
                                value={formData.address}
                                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                placeholder="Masukkan alamat cabang"
                            />
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
