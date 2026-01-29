"use client";

import { use } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save, MapPin, Receipt, Calendar } from "lucide-react";
import { getBranchById, formatDate } from "@/features/branches/data/branches.dummy";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Textarea } from "@/shared/components/ui/textarea";
import { Switch } from "@/shared/components/ui/switch";
import { Badge } from "@/shared/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Separator } from "@/shared/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/components/ui/tabs";

export default function BranchDetailPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = use(params);
    const searchParams = useSearchParams();
    const isEditMode = searchParams.get("edit") === "true";
    const branch = getBranchById(Number(id));

    if (!branch) {
        return (
            <div className="flex h-[50vh] items-center justify-center">
                <div className="text-center">
                    <h2 className="text-xl font-semibold">Cabang tidak ditemukan</h2>
                    <p className="text-muted-foreground mt-1">
                        Cabang dengan ID {id} tidak ada dalam sistem
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
                    <Button className="gap-2">
                        <Save className="h-4 w-4" />
                        Simpan Perubahan
                    </Button>
                ) : (
                    <Button asChild>
                        <Link href={`/branches/${id}?edit=true`}>Edit Cabang</Link>
                    </Button>
                )}
            </div>

            {/* Tabs */}
            <Tabs defaultValue="info" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="info">Informasi</TabsTrigger>
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
                                        defaultValue={branch.name}
                                        disabled={!isEditMode}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="address">Alamat</Label>
                                    <Input
                                        id="address"
                                        defaultValue={branch.address || ""}
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
                                        {branch.isActive
                                            ? "Cabang aktif dan POS dapat digunakan"
                                            : "Cabang nonaktif, POS akan terkunci"}
                                    </p>
                                </div>
                                <Switch
                                    id="status"
                                    checked={branch.isActive}
                                    disabled={!isEditMode}
                                />
                            </div>

                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Calendar className="h-4 w-4" />
                                Dibuat pada {formatDate(branch.createdAt)}
                            </div>
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
                                    defaultValue={branch.receiptFooter || ""}
                                    placeholder="Contoh: Terima kasih telah berbelanja! Promo 10% untuk member."
                                    rows={3}
                                    disabled={!isEditMode}
                                />
                                <p className="text-xs text-muted-foreground">
                                    Pesan ini akan muncul di bagian bawah struk pembayaran
                                </p>
                            </div>

                            {/* Receipt Preview */}
                            <div className="rounded-lg border bg-white p-4">
                                <p className="text-sm font-medium mb-3">Preview Struk:</p>
                                <div className="border rounded bg-gray-50 p-4 font-mono text-xs space-y-1">
                                    <p className="text-center font-bold">{branch.name}</p>
                                    <p className="text-center text-[10px]">{branch.address}</p>
                                    <p className="text-center">-------------------</p>
                                    <p>Lumpia Kecil x2     Rp 10.000</p>
                                    <p>Lumpia Besar x1     Rp  8.000</p>
                                    <p className="text-center">-------------------</p>
                                    <p className="font-bold">TOTAL:          Rp 18.000</p>
                                    <p className="text-center">-------------------</p>
                                    <p className="text-center text-[10px] mt-2">
                                        {branch.receiptFooter || "Terima kasih!"}
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
