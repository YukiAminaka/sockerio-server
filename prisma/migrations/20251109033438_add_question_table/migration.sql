-- CreateTable
CREATE TABLE "Question" (
    "id" SERIAL NOT NULL,
    "word" TEXT NOT NULL,
    "meaning" TEXT NOT NULL,
    "blank" INTEGER NOT NULL,
    "answer" TEXT NOT NULL,
    "hint" TEXT NOT NULL,
    "difficulty" TEXT NOT NULL DEFAULT 'normal',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Question_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Question_difficulty_idx" ON "Question"("difficulty");
