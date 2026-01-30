'use client';

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/shared/components/ui/dialog";
import { Button } from "@/shared/components/ui/button";
import { HelpCircle, BookOpen, Lightbulb, TrendingUp } from "lucide-react";

export function ProductionGuide() {
    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="h-9 gap-2 text-amber-600 border-amber-200 bg-amber-50 hover:bg-amber-100 hover:border-amber-300">
                    <HelpCircle className="h-4 w-4" />
                    Panduan
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-xl">
                        <BookOpen className="h-5 w-5 text-amber-500" />
                        Panduan Perencanaan Produksi
                    </DialogTitle>
                    <DialogDescription>
                        Cara menggunakan sistem DSS (Decision Support System) untuk perencanaan produksi harian.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    {/* Step 1 */}
                    <div className="flex gap-4">
                        <div className="flex-none w-8 h-8 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center font-bold">1</div>
                        <div className="space-y-1">
                            <h4 className="font-semibold text-slate-900">Operasional Harian (Pagi)</h4>
                            <p className="text-sm text-muted-foreground">
                                Sistem otomatis memberikan rekomendasi jumlah produksi berdasarkan data penjualan hari-hari sebelumnya (WMA). Kamu bisa menyesuaikan angka ini jika perlu.
                            </p>
                        </div>
                    </div>

                    {/* Step 2 */}
                    <div className="flex gap-4">
                        <div className="flex-none w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold">2</div>
                        <div className="space-y-1">
                            <h4 className="font-semibold text-slate-900">Input Realisasi (Sore/Malam)</h4>
                            <p className="text-sm text-muted-foreground">
                                Setelah produksi selesai, masukkan jumlah **Realisasi** yang benar-benar dibuat. Klik tombol **Simpan** (ikon disket) untuk menyimpan draft, atau **Finalisasi** (ikon centang) jika sudah selesai.
                            </p>
                            <div className="mt-2 p-3 bg-slate-50 rounded-md border border-slate-200">
                                <p className="text-xs text-slate-600 leading-relaxed italic">
                                    <Lightbulb className="inline h-3 w-3 mr-1 text-amber-500" />
                                    <strong>Tips:</strong> Data yang sudah di-Finalisasi tidak bisa diubah lagi untuk menjaga validitas laporan.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Step 3 */}
                    <div className="flex gap-4">
                        <div className="flex-none w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">3</div>
                        <div className="space-y-1">
                            <h4 className="font-semibold text-slate-900">Laporan Akurasi</h4>
                            <p className="text-sm text-muted-foreground">
                                Cek tab **Laporan Akurasi** untuk membandingkan antara:
                            </p>
                            <ul className="list-disc list-inside text-sm text-muted-foreground mt-2 space-y-1 pl-2">
                                <li><strong>Target</strong>: Saran dari sistem (DSS)</li>
                                <li><strong>Produksi</strong>: Jumlah yang benar-benar kamu buat</li>
                                <li><strong>Terjual</strong>: Jumlah yang laku di kasir hari itu</li>
                            </ul>
                        </div>
                    </div>

                    <div className="rounded-lg bg-emerald-50 border border-emerald-100 p-4 flex items-start gap-3">
                        <TrendingUp className="h-5 w-5 text-emerald-600 mt-0.5" />
                        <div>
                            <h5 className="text-sm font-bold text-emerald-900">Mengapa Akurasi Penting?</h5>
                            <p className="text-xs text-emerald-700 leading-relaxed mt-1">
                                Jika Produksi jauh lebih tinggi dari Terjual, ada risiko **pemborosan (waste)**. Jika Produksi lebih rendah dari Terjual, ada potensi **kehilangan penjualan (lost sales)**. Gunakan laporan ini untuk memperbaiki strategi besok!
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex justify-end">
                    <Button variant="default" className="bg-amber-500 hover:bg-amber-600" asChild>
                        <DialogTrigger>Mengerti</DialogTrigger>
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
