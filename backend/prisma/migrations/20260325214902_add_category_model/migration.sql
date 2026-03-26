-- AlterTable
ALTER TABLE "User" ADD COLUMN     "current_category_id" INTEGER;

-- CreateTable
CREATE TABLE "Category" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "max_annual_income" DOUBLE PRECISION NOT NULL,
    "max_unit_price" DOUBLE PRECISION,
    "max_surface_m2" DOUBLE PRECISION,
    "max_electric_consumption" DOUBLE PRECISION,
    "max_rent_amount" DOUBLE PRECISION,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "effective_from" TIMESTAMP(3) NOT NULL,
    "effective_to" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Category_code_effective_from_key" ON "Category"("code", "effective_from");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_current_category_id_fkey" FOREIGN KEY ("current_category_id") REFERENCES "Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;
