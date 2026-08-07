-- AddIndex
CREATE INDEX "WorkoutPlan_userId_updatedAt_idx" ON "WorkoutPlan"("userId", "updatedAt" DESC);

-- AddIndex
CREATE INDEX "WorkoutPlan_isPublic_isTemplate_difficultyLevel_idx" ON "WorkoutPlan"("isPublic", "isTemplate", "difficultyLevel");
