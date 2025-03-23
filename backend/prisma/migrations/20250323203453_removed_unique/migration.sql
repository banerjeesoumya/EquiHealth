-- DropIndex
DROP INDEX "DoctorAvailability_doctorId_key";

-- AlterTable
ALTER TABLE "DoctorAvailability" ALTER COLUMN "date" DROP DEFAULT;

-- CreateIndex
CREATE INDEX "DoctorAvailability_doctorId_date_idx" ON "DoctorAvailability"("doctorId", "date");
