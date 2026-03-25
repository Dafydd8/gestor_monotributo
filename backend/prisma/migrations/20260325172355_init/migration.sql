-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "cuit" TEXT NOT NULL,
    "full_name" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Invoice" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "invoice_type" TEXT NOT NULL,
    "point_of_sale" TEXT NOT NULL,
    "invoice_number" TEXT NOT NULL,
    "invoice_date" TIMESTAMP(3) NOT NULL,
    "total_amount" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "Invoice_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_cuit_key" ON "User"("cuit");

-- CreateIndex
CREATE UNIQUE INDEX "Invoice_user_id_invoice_type_point_of_sale_invoice_number_key" ON "Invoice"("user_id", "invoice_type", "point_of_sale", "invoice_number");

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
