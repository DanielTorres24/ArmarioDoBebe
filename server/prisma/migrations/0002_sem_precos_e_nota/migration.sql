-- AlterTable
ALTER TABLE "items" DROP COLUMN "max_price",
DROP COLUMN "min_price";

-- AlterTable
ALTER TABLE "site_settings" ADD COLUMN     "gift_note" VARCHAR(400) NOT NULL DEFAULT '';

-- AlterTable
ALTER TABLE "suggestions" DROP COLUMN "max_price",
DROP COLUMN "min_price";

