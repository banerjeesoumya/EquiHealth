/*
  Warnings:

  - A unique constraint covering the columns `[doctorId,date]` on the table `DoctorAvailability` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "DoctorAvailability_doctorId_date_key" ON "DoctorAvailability"("doctorId", "date");
