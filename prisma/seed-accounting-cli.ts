/**
 * Menjamin master akuntansi tersedia setelah migrasi produksi.
 * Idempoten: tidak membuat transaksi dan aman dijalankan pada setiap deploy.
 */
import { PrismaClient } from "@prisma/client";
import { seedAccountingMasters } from "./seed-accounting";

const prisma = new PrismaClient();

seedAccountingMasters(prisma)
  .then(() => console.log("Master akuntansi siap."))
  .finally(() => prisma.$disconnect());
