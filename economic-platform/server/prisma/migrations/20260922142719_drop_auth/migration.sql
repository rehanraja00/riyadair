/*
  Warnings:

  - You are about to drop the column `createdById` on the `Indicator` table. All the data in the column will be lost.
  - You are about to drop the column `ownerId` on the `View` table. All the data in the column will be lost.
  - You are about to drop the column `visibility` on the `View` table. All the data in the column will be lost.
  - You are about to drop the `User` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Indicator" DROP CONSTRAINT "Indicator_createdById_fkey";

-- DropForeignKey
ALTER TABLE "View" DROP CONSTRAINT "View_ownerId_fkey";

-- AlterTable
ALTER TABLE "Indicator" DROP COLUMN "createdById";

-- AlterTable
ALTER TABLE "View" DROP COLUMN "ownerId",
DROP COLUMN "visibility";

-- DropTable
DROP TABLE "User";

-- DropEnum
DROP TYPE "Role";

-- DropEnum
DROP TYPE "Visibility";
