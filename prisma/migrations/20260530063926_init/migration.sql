-- CreateTable
CREATE TABLE "openclaw_user_dialog" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "sessionId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "openclaw_user_dialog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "openclaw_user_dialog_userId_idx" ON "openclaw_user_dialog"("userId");

-- CreateIndex
CREATE INDEX "openclaw_user_dialog_sessionId_idx" ON "openclaw_user_dialog"("sessionId");
