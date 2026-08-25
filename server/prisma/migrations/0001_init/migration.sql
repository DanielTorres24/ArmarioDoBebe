-- CreateEnum
CREATE TYPE "ItemStatus" AS ENUM ('NEEDED', 'WANTED', 'SOME', 'OWNED');

-- CreateEnum
CREATE TYPE "ReservationStatus" AS ENUM ('THINKING', 'RESERVED', 'GIFTED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ReserverVisibility" AS ENUM ('PUBLIC', 'ADMIN_ONLY', 'HIDDEN');

-- CreateTable
CREATE TABLE "admin_users" (
    "id" TEXT NOT NULL,
    "email" VARCHAR(160) NOT NULL,
    "password_hash" VARCHAR(120) NOT NULL,
    "name" VARCHAR(80),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "admin_users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "site_settings" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "baby_name" VARCHAR(60) NOT NULL DEFAULT 'Diogo',
    "site_name" VARCHAR(80) NOT NULL DEFAULT 'Armário do Diogo',
    "hero_icon" VARCHAR(16) NOT NULL DEFAULT '🧸',
    "hero_title" VARCHAR(120) NOT NULL,
    "hero_subtitle" VARCHAR(600) NOT NULL,
    "primary_cta_label" VARCHAR(60) NOT NULL,
    "secondary_cta_label" VARCHAR(60) NOT NULL,
    "preferences_title" VARCHAR(120) NOT NULL,
    "preferences_intro" VARCHAR(600),
    "footer_text" VARCHAR(200) NOT NULL,
    "reservation_enabled" BOOLEAN NOT NULL DEFAULT true,
    "allow_thinking" BOOLEAN NOT NULL DEFAULT true,
    "allow_cancellation" BOOLEAN NOT NULL DEFAULT true,
    "reserver_visibility" "ReserverVisibility" NOT NULL DEFAULT 'PUBLIC',
    "reservation_ttl_days" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "site_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "status_settings" (
    "id" SERIAL NOT NULL,
    "status" "ItemStatus" NOT NULL,
    "label" VARCHAR(60) NOT NULL,
    "icon" VARCHAR(16) NOT NULL,
    "color" VARCHAR(20) NOT NULL,
    "description" VARCHAR(240) NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "status_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "categories" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(60) NOT NULL,
    "slug" VARCHAR(60) NOT NULL,
    "icon" VARCHAR(16) NOT NULL DEFAULT '💙',
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "age_ranges" (
    "id" TEXT NOT NULL,
    "label" VARCHAR(40) NOT NULL,
    "slug" VARCHAR(40) NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "age_ranges_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "items" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "description" VARCHAR(600),
    "category_id" TEXT NOT NULL,
    "status" "ItemStatus" NOT NULL DEFAULT 'NEEDED',
    "priority" INTEGER NOT NULL DEFAULT 2,
    "size" VARCHAR(60),
    "age_range_id" TEXT,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "min_price" DECIMAL(8,2),
    "max_price" DECIMAL(8,2),
    "product_url" VARCHAR(500),
    "is_featured" BOOLEAN NOT NULL DEFAULT false,
    "owner_id" VARCHAR(64),
    "owner_name" VARCHAR(80),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "guests" (
    "id" VARCHAR(64) NOT NULL,
    "name" VARCHAR(80) NOT NULL,
    "email" VARCHAR(160),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "guests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reservations" (
    "id" TEXT NOT NULL,
    "item_id" TEXT NOT NULL,
    "guest_id" VARCHAR(64) NOT NULL,
    "guest_name" VARCHAR(80) NOT NULL,
    "guest_email" VARCHAR(160),
    "status" "ReservationStatus" NOT NULL DEFAULT 'RESERVED',
    "note" VARCHAR(300),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "expires_at" TIMESTAMP(3),

    CONSTRAINT "reservations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "suggestions" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "description" VARCHAR(600),
    "category_id" TEXT,
    "min_price" DECIMAL(8,2),
    "max_price" DECIMAL(8,2),
    "priority" INTEGER NOT NULL DEFAULT 2,
    "product_url" VARCHAR(500),
    "image_url" VARCHAR(500),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "suggestions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "parent_preferences" (
    "id" TEXT NOT NULL,
    "title" VARCHAR(120) NOT NULL,
    "description" VARCHAR(400),
    "icon" VARCHAR(16) NOT NULL DEFAULT '💙',
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "parent_preferences_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "admin_users_email_key" ON "admin_users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "status_settings_status_key" ON "status_settings"("status");

-- CreateIndex
CREATE UNIQUE INDEX "categories_slug_key" ON "categories"("slug");

-- CreateIndex
CREATE INDEX "categories_sort_order_idx" ON "categories"("sort_order");

-- CreateIndex
CREATE UNIQUE INDEX "age_ranges_slug_key" ON "age_ranges"("slug");

-- CreateIndex
CREATE INDEX "age_ranges_sort_order_idx" ON "age_ranges"("sort_order");

-- CreateIndex
CREATE INDEX "items_status_idx" ON "items"("status");

-- CreateIndex
CREATE INDEX "items_category_id_idx" ON "items"("category_id");

-- CreateIndex
CREATE INDEX "items_owner_id_idx" ON "items"("owner_id");

-- CreateIndex
CREATE INDEX "items_created_at_idx" ON "items"("created_at");

-- CreateIndex
CREATE INDEX "reservations_item_id_idx" ON "reservations"("item_id");

-- CreateIndex
CREATE INDEX "reservations_guest_id_idx" ON "reservations"("guest_id");

-- CreateIndex
CREATE INDEX "reservations_status_idx" ON "reservations"("status");

-- CreateIndex
CREATE INDEX "suggestions_is_active_idx" ON "suggestions"("is_active");

-- CreateIndex
CREATE INDEX "parent_preferences_sort_order_idx" ON "parent_preferences"("sort_order");

-- AddForeignKey
ALTER TABLE "items" ADD CONSTRAINT "items_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "items" ADD CONSTRAINT "items_age_range_id_fkey" FOREIGN KEY ("age_range_id") REFERENCES "age_ranges"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reservations" ADD CONSTRAINT "reservations_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reservations" ADD CONSTRAINT "reservations_guest_id_fkey" FOREIGN KEY ("guest_id") REFERENCES "guests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "suggestions" ADD CONSTRAINT "suggestions_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

