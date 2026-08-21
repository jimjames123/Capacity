-- CreateTable
CREATE TABLE "Booking" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "organizationId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "providerName" TEXT,
    "category" TEXT,
    "staffCount" INTEGER NOT NULL DEFAULT 1,
    "date" DATETIME NOT NULL,
    "cost" TEXT NOT NULL,
    "paid" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL DEFAULT 'SCHEDULED',
    "attendance" INTEGER,
    "certificateIssued" BOOLEAN NOT NULL DEFAULT false,
    "outcome" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Booking_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "Booking_organizationId_idx" ON "Booking"("organizationId");
