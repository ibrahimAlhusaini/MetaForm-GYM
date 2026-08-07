CREATE TYPE "BmiCategory" AS ENUM ('UNDERWEIGHT', 'NORMAL', 'OVERWEIGHT', 'OBESITY');
CREATE TYPE "BmrFormula" AS ENUM ('MIFFLIN_ST_JEOR');

ALTER TABLE "NutritionCalculation"
ADD COLUMN "age" INTEGER,
ADD COLUMN "gender" "Gender",
ADD COLUMN "heightCm" DECIMAL(5,2),
ADD COLUMN "weightKg" DECIMAL(6,2),
ADD COLUMN "activityLevel" "ActivityLevel",
ADD COLUMN "fitnessGoal" "FitnessGoal",
ADD COLUMN "recommendedCalories" INTEGER,
ADD COLUMN "bmiCategory" "BmiCategory",
ADD COLUMN "bmrFormula" "BmrFormula",
ADD COLUMN "calculationVersion" VARCHAR(20),
ADD COLUMN "safetyFloorApplied" BOOLEAN,
ADD COLUMN "macroFallbackApplied" BOOLEAN;
