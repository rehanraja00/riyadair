-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'EDITOR', 'VIEWER');

-- CreateEnum
CREATE TYPE "Frequency" AS ENUM ('MONTHLY', 'QUARTERLY', 'ANNUAL');

-- CreateEnum
CREATE TYPE "Visibility" AS ENUM ('PRIVATE', 'SHARED', 'PUBLIC');

-- CreateEnum
CREATE TYPE "WidgetType" AS ENUM ('KPI', 'LINE_CHART', 'BAR_CHART', 'TABLE');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'VIEWER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IndicatorCategory" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "IndicatorCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Indicator" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "unit" TEXT NOT NULL,
    "frequency" "Frequency" NOT NULL,
    "source" TEXT,
    "sourceUrl" TEXT,
    "categoryId" TEXT NOT NULL,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Indicator_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IndicatorDataPoint" (
    "id" TEXT NOT NULL,
    "indicatorId" TEXT NOT NULL,
    "period" TIMESTAMP(3) NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "IndicatorDataPoint_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "View" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "visibility" "Visibility" NOT NULL DEFAULT 'PRIVATE',
    "ownerId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "View_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ViewWidget" (
    "id" TEXT NOT NULL,
    "viewId" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "type" "WidgetType" NOT NULL,
    "title" TEXT,
    "config" JSONB,

    CONSTRAINT "ViewWidget_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ViewWidgetIndicator" (
    "id" TEXT NOT NULL,
    "viewWidgetId" TEXT NOT NULL,
    "indicatorId" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "ViewWidgetIndicator_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "IndicatorCategory_name_key" ON "IndicatorCategory"("name");

-- CreateIndex
CREATE UNIQUE INDEX "IndicatorCategory_slug_key" ON "IndicatorCategory"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Indicator_code_key" ON "Indicator"("code");

-- CreateIndex
CREATE INDEX "IndicatorDataPoint_indicatorId_period_idx" ON "IndicatorDataPoint"("indicatorId", "period");

-- CreateIndex
CREATE UNIQUE INDEX "IndicatorDataPoint_indicatorId_period_key" ON "IndicatorDataPoint"("indicatorId", "period");

-- CreateIndex
CREATE UNIQUE INDEX "View_slug_key" ON "View"("slug");

-- CreateIndex
CREATE INDEX "ViewWidget_viewId_order_idx" ON "ViewWidget"("viewId", "order");

-- CreateIndex
CREATE UNIQUE INDEX "ViewWidgetIndicator_viewWidgetId_indicatorId_key" ON "ViewWidgetIndicator"("viewWidgetId", "indicatorId");

-- AddForeignKey
ALTER TABLE "Indicator" ADD CONSTRAINT "Indicator_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "IndicatorCategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Indicator" ADD CONSTRAINT "Indicator_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IndicatorDataPoint" ADD CONSTRAINT "IndicatorDataPoint_indicatorId_fkey" FOREIGN KEY ("indicatorId") REFERENCES "Indicator"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "View" ADD CONSTRAINT "View_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ViewWidget" ADD CONSTRAINT "ViewWidget_viewId_fkey" FOREIGN KEY ("viewId") REFERENCES "View"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ViewWidgetIndicator" ADD CONSTRAINT "ViewWidgetIndicator_viewWidgetId_fkey" FOREIGN KEY ("viewWidgetId") REFERENCES "ViewWidget"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ViewWidgetIndicator" ADD CONSTRAINT "ViewWidgetIndicator_indicatorId_fkey" FOREIGN KEY ("indicatorId") REFERENCES "Indicator"("id") ON DELETE CASCADE ON UPDATE CASCADE;
