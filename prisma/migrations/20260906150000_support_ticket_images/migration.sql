-- AlterTable
ALTER TABLE "SupportTicket" ADD COLUMN "imageUrls" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
