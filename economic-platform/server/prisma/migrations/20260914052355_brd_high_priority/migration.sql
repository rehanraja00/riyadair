/*
  Warnings:

  - You are about to drop the column `source` on the `Indicator` table. All the data in the column will be lost.
  - You are about to drop the column `sourceUrl` on the `Indicator` table. All the data in the column will be lost.
  - You are about to drop the column `unit` on the `Indicator` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "LayoutTemplate" AS ENUM ('ONE_COL', 'TWO_COL', 'GRID');

-- AlterEnum
ALTER TYPE "WidgetType" ADD VALUE 'CONTENT';

-- AlterTable
ALTER TABLE "Indicator" DROP COLUMN "source",
DROP COLUMN "sourceUrl",
DROP COLUMN "unit",
ADD COLUMN     "longTermTargetLabel" TEXT DEFAULT 'Long-term target',
ADD COLUMN     "longTermTargetValue" DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "View" ADD COLUMN     "gridColumns" INTEGER NOT NULL DEFAULT 4,
ADD COLUMN     "layoutTemplate" "LayoutTemplate" NOT NULL DEFAULT 'ONE_COL',
ADD COLUMN     "published" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "sectionId" TEXT;

-- AlterTable
ALTER TABLE "ViewWidget" ADD COLUMN     "columnSpan" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "columnStart" INTEGER,
ADD COLUMN     "contentHtml" TEXT,
ADD COLUMN     "rowSpan" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "rowStart" INTEGER;

-- CreateTable
CREATE TABLE "Section" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Section_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Source" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "url" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "mergedIntoId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Source_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Unit" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "symbol" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "mergedIntoId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Unit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IndicatorUnit" (
    "id" TEXT NOT NULL,
    "indicatorId" TEXT NOT NULL,
    "unitId" TEXT NOT NULL,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "IndicatorUnit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IndicatorSource" (
    "id" TEXT NOT NULL,
    "indicatorId" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "IndicatorSource_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Target" (
    "id" TEXT NOT NULL,
    "indicatorId" TEXT NOT NULL,
    "period" TIMESTAMP(3) NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Target_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Forecast" (
    "id" TEXT NOT NULL,
    "indicatorId" TEXT NOT NULL,
    "period" TIMESTAMP(3) NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "version" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Forecast_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Baseline" (
    "id" TEXT NOT NULL,
    "indicatorId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "period" TIMESTAMP(3) NOT NULL,
    "intervalType" "Frequency" NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT false,
    "supersedesId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Baseline_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Section_slug_key" ON "Section"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Source_name_key" ON "Source"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Unit_name_key" ON "Unit"("name");

-- CreateIndex
CREATE UNIQUE INDEX "IndicatorUnit_indicatorId_unitId_key" ON "IndicatorUnit"("indicatorId", "unitId");

-- CreateIndex
CREATE UNIQUE INDEX "IndicatorSource_indicatorId_sourceId_key" ON "IndicatorSource"("indicatorId", "sourceId");

-- CreateIndex
CREATE INDEX "Target_indicatorId_period_idx" ON "Target"("indicatorId", "period");

-- CreateIndex
CREATE UNIQUE INDEX "Target_indicatorId_period_key" ON "Target"("indicatorId", "period");

-- CreateIndex
CREATE INDEX "Forecast_indicatorId_period_idx" ON "Forecast"("indicatorId", "period");

-- CreateIndex
CREATE UNIQUE INDEX "Forecast_indicatorId_period_version_key" ON "Forecast"("indicatorId", "period", "version");

-- CreateIndex
CREATE UNIQUE INDEX "Baseline_supersedesId_key" ON "Baseline"("supersedesId");

-- CreateIndex
CREATE INDEX "Baseline_indicatorId_idx" ON "Baseline"("indicatorId");

-- AddForeignKey
ALTER TABLE "Source" ADD CONSTRAINT "Source_mergedIntoId_fkey" FOREIGN KEY ("mergedIntoId") REFERENCES "Source"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Unit" ADD CONSTRAINT "Unit_mergedIntoId_fkey" FOREIGN KEY ("mergedIntoId") REFERENCES "Unit"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IndicatorUnit" ADD CONSTRAINT "IndicatorUnit_indicatorId_fkey" FOREIGN KEY ("indicatorId") REFERENCES "Indicator"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IndicatorUnit" ADD CONSTRAINT "IndicatorUnit_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "Unit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IndicatorSource" ADD CONSTRAINT "IndicatorSource_indicatorId_fkey" FOREIGN KEY ("indicatorId") REFERENCES "Indicator"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IndicatorSource" ADD CONSTRAINT "IndicatorSource_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "Source"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Target" ADD CONSTRAINT "Target_indicatorId_fkey" FOREIGN KEY ("indicatorId") REFERENCES "Indicator"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Forecast" ADD CONSTRAINT "Forecast_indicatorId_fkey" FOREIGN KEY ("indicatorId") REFERENCES "Indicator"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Baseline" ADD CONSTRAINT "Baseline_indicatorId_fkey" FOREIGN KEY ("indicatorId") REFERENCES "Indicator"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Baseline" ADD CONSTRAINT "Baseline_supersedesId_fkey" FOREIGN KEY ("supersedesId") REFERENCES "Baseline"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "View" ADD CONSTRAINT "View_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "Section"("id") ON DELETE SET NULL ON UPDATE CASCADE;
