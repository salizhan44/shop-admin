-- AlterTable
ALTER TABLE "Customer" ADD COLUMN "loyaltyPoints" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Customer" ADD COLUMN "appSecondsTotal" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "Product" ADD COLUMN "discountPercent" INTEGER;
ALTER TABLE "Product" ADD COLUMN "discountAmountCents" INTEGER;

-- AlterTable
ALTER TABLE "Order" ADD COLUMN "pointsSpent" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Order" ADD COLUMN "pointsEarned" INTEGER NOT NULL DEFAULT 0;
