-- AlterTable
ALTER TABLE "comments" ADD COLUMN     "imageUrl" TEXT,
ADD COLUMN     "rating" INTEGER;

-- AlterTable
ALTER TABLE "menu_items" ADD COLUMN     "description" TEXT;

-- AlterTable
ALTER TABLE "places" ADD COLUMN     "imagesJson" TEXT NOT NULL DEFAULT '[]';
