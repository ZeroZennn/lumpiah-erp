-- AlterTable
ALTER TABLE "daily_closings" ADD COLUMN     "closing_note" TEXT,
ADD COLUMN     "total_cash_actual" DECIMAL NOT NULL DEFAULT 0,
ADD COLUMN     "total_qris_actual" DECIMAL NOT NULL DEFAULT 0;
