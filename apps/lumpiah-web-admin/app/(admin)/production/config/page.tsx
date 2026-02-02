"use client";

import { useForm, useFieldArray } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/shared/components/ui/form";
import { Input } from "@/shared/components/ui/input";
import { Button } from "@/shared/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/components/ui/select";
import { useDssConfig, useUpdateDssConfig } from "@/features/production/api/use-dss";
import { useBranches } from "@/features/branches/api/use-branches";
import { toast } from "sonner";
import { Loader2, ArrowLeft, Save, Building2 } from "lucide-react";
import Link from "next/link";

// Schema Validation
const dssFormSchema = z.object({
    wmaWeights: z.array(
        z.object({
            value: z.coerce.number().min(0).max(1)
        })
    ).length(3, "Harus ada 3 bobot untuk 3 bulan terakhir")
        .refine((weights) => {
            const sum = weights.reduce((a, b) => a + b.value, 0);
            // Allow small float error or strict? Let's use epsilon
            return Math.abs(sum - 1) < 0.001;
        }, "Total bobot harus berjumlah 1.0 (100%)"),

    safetyStockPercent: z.coerce.number().min(0).max(100),
});

type DssFormValues = z.infer<typeof dssFormSchema>;

export default function DssConfigPage() {
    const { data: branches, isLoading: isLoadingBranches } = useBranches();
    const [selectedBranchId, setSelectedBranchId] = useState<number>();

    const branchIdToUse = selectedBranchId ?? branches?.[0]?.id;

    const { data: config, isLoading } = useDssConfig(branchIdToUse);
    const { mutate: updateConfig, isPending } = useUpdateDssConfig(branchIdToUse);

    const form = useForm<any>({
        resolver: zodResolver(dssFormSchema) as any,
        defaultValues: {
            wmaWeights: [{ value: 0.5 }, { value: 0.3 }, { value: 0.2 }], // Default fallback
            safetyStockPercent: 10,
        },
    });

    const { fields } = useFieldArray({
        control: form.control,
        name: "wmaWeights"
    });

    const wmaWeightsError = (form.formState.errors.wmaWeights as any)?.message;

    // Populate form data when fetched
    useEffect(() => {
        if (config) {
            form.reset({
                wmaWeights: config.wmaWeights.map(w => ({ value: w })),
                safetyStockPercent: config.safetyStockPercent
            });
        }
    }, [config, form]);

    const onSubmit = (data: DssFormValues) => {
        if (!branchIdToUse) {
            toast.error("Cabang tidak terdeteksi");
            return;
        }

        const payload = {
            ...data,
            wmaWeights: data.wmaWeights.map(w => w.value)
        };
        updateConfig(payload, {
            onSuccess: () => {
                toast.success("Konfigurasi DSS berhasil diperbarui");
            },
            onError: (_err: unknown) => {
                toast.error("Gagal menyimpan konfigurasi");
            }
        });
    };

    if (isLoading) {
        return <div className="flex h-screen items-center justify-center">Loading configuration...</div>;
    }

    return (
        <div className="space-y-6 container max-w-2xl mx-auto py-8">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" asChild>
                    <Link href="/production">
                        <ArrowLeft className="h-5 w-5" />
                    </Link>
                </Button>
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Konfigurasi DSS</h1>
                    <p className="text-muted-foreground">Atur parameter Weighted Moving Average (WMA)</p>
                </div>
                <div className="ml-auto flex items-center gap-2">
                    <Select
                        value={String(branchIdToUse ?? '')}
                        onValueChange={(val) => setSelectedBranchId(Number(val))}
                        disabled={isLoadingBranches}
                    >
                        <SelectTrigger className="w-[200px]">
                            <Building2 className="mr-2 h-4 w-4 text-muted-foreground" />
                            <SelectValue placeholder="Pilih Cabang" />
                        </SelectTrigger>
                        <SelectContent>
                            {branches?.map((branch) => (
                                <SelectItem key={branch.id} value={String(branch.id)}>
                                    {branch.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Bobot Perhitungan (WMA)</CardTitle>
                    <CardDescription>
                        Bobot memprioritaskan data penjualan terbaru. Total bobot harus 1.0.
                        <br />
                        <span className="text-xs text-muted-foreground">Urutan: [Hari Lalu (H-1), 2 Hari Lalu (H-2), 3 Hari Lalu (H-3)]</span>
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex gap-3">
                        <div className="text-amber-600 mt-0.5">
                            <Save className="h-4 w-4" />
                        </div>
                        <div className="space-y-1">
                            <p className="text-sm font-bold text-amber-900">Perhatian: Integritas Data</p>
                            <p className="text-xs text-amber-800 leading-relaxed">
                                Perubahan konfigurasi ini <strong>hanya akan berlaku untuk rencana produksi yang belum dibuat</strong>.
                                Rencana yang sudah ada di database tidak akan berubah secara otomatis untuk menjaga integritas laporan historis.
                            </p>
                        </div>
                    </div>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">

                            {/* WMA WEIGHTS */}
                            <div className="grid grid-cols-3 gap-4">
                                {fields.map((item, index) => (
                                    <FormField
                                        key={item.id}
                                        control={form.control}
                                        name={`wmaWeights.${index}.value` as any}
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-xs">
                                                    {index === 0 ? "Hari Lalu (H-1)" :
                                                        index === 1 ? "2 Hari Lalu" : "3 Hari Lalu"}
                                                </FormLabel>
                                                <FormControl>
                                                    <Input
                                                        type="number"
                                                        step="0.1"
                                                        {...field}
                                                        value={field.value ?? ''}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                ))}
                            </div>
                            {wmaWeightsError && (
                                <p className="text-sm font-medium text-destructive">
                                    {String(wmaWeightsError)}
                                </p>
                            )}

                            {/* SAFETY STOCK */}
                            <FormField
                                control={form.control}
                                name="safetyStockPercent"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Safety Stock (%)</FormLabel>
                                        <FormControl>
                                            <Input
                                                type="number"
                                                {...field}
                                                value={field.value ?? ''}
                                            />
                                        </FormControl>
                                        <FormDescription>
                                            Buffer tambahan untuk mengantisipasi lonjakan permintaan (Standard: 10-20%).
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <Button type="submit" disabled={isPending || !branchIdToUse} className="w-full md:w-auto">
                                {isPending ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Menyimpan...
                                    </>
                                ) : (
                                    <>
                                        <Save className="mr-2 h-4 w-4" />
                                        Simpan Konfigurasi
                                    </>
                                )}
                            </Button>
                        </form>
                    </Form>
                </CardContent>
            </Card>
        </div>
    );
}
