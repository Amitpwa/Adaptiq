-- CreateEnum
CREATE TYPE "Role" AS ENUM ('LEARNER', 'INSTRUCTOR', 'ADMIN');

-- CreateEnum
CREATE TYPE "Lens" AS ENUM ('ANALOGY', 'FIRST_PRINCIPLES', 'CODE', 'VISUAL');

-- CreateEnum
CREATE TYPE "MotionPreference" AS ENUM ('SYSTEM', 'FULL', 'REDUCED');

-- CreateEnum
CREATE TYPE "OnboardingStage" AS ENUM ('REGISTERED', 'GOAL_SELECTED', 'PREFERENCES_SET', 'DIAGNOSTIC_IN_PROGRESS', 'COMPLETE');

-- CreateEnum
CREATE TYPE "MasteryStatus" AS ENUM ('NOT_STARTED', 'GAP', 'IN_PROGRESS', 'FRAGILE', 'MASTERED');

-- CreateEnum
CREATE TYPE "PathNodeStatus" AS ENUM ('LOCKED', 'READY', 'IN_PROGRESS', 'MASTERED', 'GAP');

-- CreateEnum
CREATE TYPE "AssessmentType" AS ENUM ('DIAGNOSTIC', 'PRACTICE', 'PROBE', 'BRIDGE');

-- CreateEnum
CREATE TYPE "AssessmentStatus" AS ENUM ('IN_PROGRESS', 'COMPLETED', 'ABANDONED');

-- CreateEnum
CREATE TYPE "QuestionType" AS ENUM ('MCQ', 'MULTI', 'SHORT', 'CODE_COMPLETION', 'OUTPUT_PREDICTION');

-- CreateEnum
CREATE TYPE "RecommendationKind" AS ENUM ('NEXT_CONCEPT', 'PREREQ_BRIDGE', 'REVIEW_PROBE', 'MISCONCEPTION_DRILL');

-- CreateEnum
CREATE TYPE "TutorRole" AS ENUM ('LEARNER', 'TUTOR');

-- CreateEnum
CREATE TYPE "HintSource" AS ENUM ('AI', 'FALLBACK');

-- CreateEnum
CREATE TYPE "EvidenceType" AS ENUM ('DIAGNOSTIC_ITEM', 'PRACTICE_ITEM', 'PROBE_ITEM', 'DECAY_RECALC', 'MANUAL_OVERRIDE');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'LEARNER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "learner_profiles" (
    "userId" TEXT NOT NULL,
    "cognitivePreference" "Lens" NOT NULL DEFAULT 'ANALOGY',
    "motionPreference" "MotionPreference" NOT NULL DEFAULT 'SYSTEM',
    "onboardingStage" "OnboardingStage" NOT NULL DEFAULT 'REGISTERED',
    "activeGoalId" TEXT,
    "frustrationScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "learner_profiles_pkey" PRIMARY KEY ("userId")
);

-- CreateTable
CREATE TABLE "domains" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "domains_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "concepts" (
    "id" TEXT NOT NULL,
    "domainId" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "difficultyB" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "discriminationA" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "guessC" DOUBLE PRECISION NOT NULL DEFAULT 0.2,
    "pInit" DOUBLE PRECISION NOT NULL DEFAULT 0.15,
    "pTransit" DOUBLE PRECISION NOT NULL DEFAULT 0.20,
    "pSlip" DOUBLE PRECISION NOT NULL DEFAULT 0.10,
    "pGuess" DOUBLE PRECISION NOT NULL DEFAULT 0.20,
    "estimatedMinutes" INTEGER NOT NULL DEFAULT 12,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "concepts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "concept_edges" (
    "prerequisiteId" TEXT NOT NULL,
    "conceptId" TEXT NOT NULL,
    "strength" DOUBLE PRECISION NOT NULL DEFAULT 1.0,

    CONSTRAINT "concept_edges_pkey" PRIMARY KEY ("prerequisiteId","conceptId")
);

-- CreateTable
CREATE TABLE "goals" (
    "id" TEXT NOT NULL,
    "domainId" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "goals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "goal_concepts" (
    "goalId" TEXT NOT NULL,
    "conceptId" TEXT NOT NULL,
    "weight" DOUBLE PRECISION NOT NULL DEFAULT 1.0,

    CONSTRAINT "goal_concepts_pkey" PRIMARY KEY ("goalId","conceptId")
);

-- CreateTable
CREATE TABLE "concept_layouts" (
    "goalId" TEXT NOT NULL,
    "conceptId" TEXT NOT NULL,
    "rank" INTEGER NOT NULL,
    "order" INTEGER NOT NULL,
    "x" DOUBLE PRECISION NOT NULL,
    "y" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "concept_layouts_pkey" PRIMARY KEY ("goalId","conceptId")
);

-- CreateTable
CREATE TABLE "content_lenses" (
    "id" TEXT NOT NULL,
    "conceptId" TEXT NOT NULL,
    "lens" "Lens" NOT NULL,
    "level" INTEGER NOT NULL DEFAULT 2,
    "body" TEXT NOT NULL,
    "citation" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "content_lenses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "misconceptions" (
    "id" TEXT NOT NULL,
    "conceptId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "remediationHint" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "misconceptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "questions" (
    "id" TEXT NOT NULL,
    "conceptId" TEXT NOT NULL,
    "type" "QuestionType" NOT NULL,
    "stem" TEXT NOT NULL,
    "canonicalAnswer" TEXT,
    "explanation" TEXT NOT NULL,
    "difficultyB" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "discriminationA" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "guessC" DOUBLE PRECISION NOT NULL DEFAULT 0.25,
    "misconceptionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "questions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "question_options" (
    "id" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "isCorrect" BOOLEAN NOT NULL DEFAULT false,
    "misconceptionId" TEXT,
    "position" INTEGER NOT NULL,

    CONSTRAINT "question_options_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "question_hints" (
    "id" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "level" INTEGER NOT NULL,
    "body" TEXT NOT NULL,

    CONSTRAINT "question_hints_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "assessment_sessions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "AssessmentType" NOT NULL,
    "goalId" TEXT,
    "conceptId" TEXT,
    "status" "AssessmentStatus" NOT NULL DEFAULT 'IN_PROGRESS',
    "theta" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "standardError" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "assessment_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "assessment_items" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "servedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "answeredAt" TIMESTAMP(3),
    "response" JSONB,
    "isCorrect" BOOLEAN,
    "latencyMs" INTEGER,
    "thetaAtServe" DOUBLE PRECISION NOT NULL DEFAULT 0,

    CONSTRAINT "assessment_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "knowledge_states" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "conceptId" TEXT NOT NULL,
    "pMastery" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "stabilityDays" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "correct" INTEGER NOT NULL DEFAULT 0,
    "status" "MasteryStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "lastInteractionAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "knowledge_states_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "knowledge_state_events" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "conceptId" TEXT NOT NULL,
    "prior" DOUBLE PRECISION NOT NULL,
    "posterior" DOUBLE PRECISION NOT NULL,
    "evidenceType" "EvidenceType" NOT NULL,
    "evidenceId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "knowledge_state_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "learner_misconceptions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "misconceptionId" TEXT NOT NULL,
    "occurrences" INTEGER NOT NULL DEFAULT 1,
    "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),

    CONSTRAINT "learner_misconceptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "review_schedules" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "conceptId" TEXT NOT NULL,
    "dueAt" TIMESTAMP(3) NOT NULL,
    "intervalDays" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "review_schedules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "learning_paths" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "goalId" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "learning_paths_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "learning_path_nodes" (
    "id" TEXT NOT NULL,
    "pathId" TEXT NOT NULL,
    "conceptId" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "status" "PathNodeStatus" NOT NULL DEFAULT 'LOCKED',
    "rationale" TEXT NOT NULL,

    CONSTRAINT "learning_path_nodes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "recommendations" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "conceptId" TEXT NOT NULL,
    "kind" "RecommendationKind" NOT NULL,
    "score" DOUBLE PRECISION NOT NULL,
    "rationale" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "consumedAt" TIMESTAMP(3),

    CONSTRAINT "recommendations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tutor_sessions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "conceptId" TEXT NOT NULL,
    "questionId" TEXT,
    "hintLevel" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tutor_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tutor_messages" (
    "id" TEXT NOT NULL,
    "tutorSessionId" TEXT NOT NULL,
    "role" "TutorRole" NOT NULL,
    "content" TEXT NOT NULL,
    "hintLevel" INTEGER,
    "source" "HintSource",
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tutor_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_generations" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "conceptId" TEXT,
    "lens" "Lens",
    "promptHash" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "tokensIn" INTEGER NOT NULL DEFAULT 0,
    "tokensOut" INTEGER NOT NULL DEFAULT 0,
    "latencyMs" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_generations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cohorts" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "instructorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cohorts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cohort_members" (
    "cohortId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cohort_members_pkey" PRIMARY KEY ("cohortId","userId")
);

-- CreateTable
CREATE TABLE "activity_events" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "payload" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "activity_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rate_limits" (
    "key" TEXT NOT NULL,
    "windowStart" TIMESTAMP(3) NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "rate_limits_pkey" PRIMARY KEY ("key","windowStart")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "actorId" TEXT,
    "action" TEXT NOT NULL,
    "targetType" TEXT NOT NULL,
    "targetId" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_role_idx" ON "users"("role");

-- CreateIndex
CREATE INDEX "learner_profiles_activeGoalId_idx" ON "learner_profiles"("activeGoalId");

-- CreateIndex
CREATE UNIQUE INDEX "domains_slug_key" ON "domains"("slug");

-- CreateIndex
CREATE INDEX "concepts_domainId_idx" ON "concepts"("domainId");

-- CreateIndex
CREATE UNIQUE INDEX "concepts_domainId_slug_key" ON "concepts"("domainId", "slug");

-- CreateIndex
CREATE INDEX "concept_edges_conceptId_idx" ON "concept_edges"("conceptId");

-- CreateIndex
CREATE INDEX "concept_edges_prerequisiteId_idx" ON "concept_edges"("prerequisiteId");

-- CreateIndex
CREATE UNIQUE INDEX "goals_slug_key" ON "goals"("slug");

-- CreateIndex
CREATE INDEX "goals_domainId_idx" ON "goals"("domainId");

-- CreateIndex
CREATE INDEX "goal_concepts_conceptId_idx" ON "goal_concepts"("conceptId");

-- CreateIndex
CREATE INDEX "concept_layouts_goalId_idx" ON "concept_layouts"("goalId");

-- CreateIndex
CREATE INDEX "content_lenses_conceptId_idx" ON "content_lenses"("conceptId");

-- CreateIndex
CREATE UNIQUE INDEX "content_lenses_conceptId_lens_level_key" ON "content_lenses"("conceptId", "lens", "level");

-- CreateIndex
CREATE INDEX "misconceptions_conceptId_idx" ON "misconceptions"("conceptId");

-- CreateIndex
CREATE UNIQUE INDEX "misconceptions_conceptId_code_key" ON "misconceptions"("conceptId", "code");

-- CreateIndex
CREATE INDEX "questions_conceptId_idx" ON "questions"("conceptId");

-- CreateIndex
CREATE INDEX "questions_conceptId_difficultyB_idx" ON "questions"("conceptId", "difficultyB");

-- CreateIndex
CREATE INDEX "question_options_questionId_idx" ON "question_options"("questionId");

-- CreateIndex
CREATE UNIQUE INDEX "question_options_questionId_position_key" ON "question_options"("questionId", "position");

-- CreateIndex
CREATE INDEX "question_hints_questionId_idx" ON "question_hints"("questionId");

-- CreateIndex
CREATE UNIQUE INDEX "question_hints_questionId_level_key" ON "question_hints"("questionId", "level");

-- CreateIndex
CREATE INDEX "assessment_sessions_userId_status_idx" ON "assessment_sessions"("userId", "status");

-- CreateIndex
CREATE INDEX "assessment_sessions_userId_type_startedAt_idx" ON "assessment_sessions"("userId", "type", "startedAt");

-- CreateIndex
CREATE INDEX "assessment_items_sessionId_idx" ON "assessment_items"("sessionId");

-- CreateIndex
CREATE INDEX "assessment_items_questionId_idx" ON "assessment_items"("questionId");

-- CreateIndex
CREATE UNIQUE INDEX "assessment_items_sessionId_position_key" ON "assessment_items"("sessionId", "position");

-- CreateIndex
CREATE INDEX "knowledge_states_userId_status_idx" ON "knowledge_states"("userId", "status");

-- CreateIndex
CREATE INDEX "knowledge_states_userId_pMastery_idx" ON "knowledge_states"("userId", "pMastery");

-- CreateIndex
CREATE UNIQUE INDEX "knowledge_states_userId_conceptId_key" ON "knowledge_states"("userId", "conceptId");

-- CreateIndex
CREATE INDEX "knowledge_state_events_userId_createdAt_idx" ON "knowledge_state_events"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "knowledge_state_events_userId_conceptId_createdAt_idx" ON "knowledge_state_events"("userId", "conceptId", "createdAt");

-- CreateIndex
CREATE INDEX "learner_misconceptions_userId_resolvedAt_idx" ON "learner_misconceptions"("userId", "resolvedAt");

-- CreateIndex
CREATE UNIQUE INDEX "learner_misconceptions_userId_misconceptionId_key" ON "learner_misconceptions"("userId", "misconceptionId");

-- CreateIndex
CREATE INDEX "review_schedules_userId_dueAt_idx" ON "review_schedules"("userId", "dueAt");

-- CreateIndex
CREATE UNIQUE INDEX "review_schedules_userId_conceptId_key" ON "review_schedules"("userId", "conceptId");

-- CreateIndex
CREATE INDEX "learning_paths_userId_idx" ON "learning_paths"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "learning_paths_userId_goalId_key" ON "learning_paths"("userId", "goalId");

-- CreateIndex
CREATE INDEX "learning_path_nodes_pathId_position_idx" ON "learning_path_nodes"("pathId", "position");

-- CreateIndex
CREATE UNIQUE INDEX "learning_path_nodes_pathId_conceptId_key" ON "learning_path_nodes"("pathId", "conceptId");

-- CreateIndex
CREATE INDEX "recommendations_userId_consumedAt_score_idx" ON "recommendations"("userId", "consumedAt", "score");

-- CreateIndex
CREATE INDEX "tutor_sessions_userId_createdAt_idx" ON "tutor_sessions"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "tutor_messages_tutorSessionId_createdAt_idx" ON "tutor_messages"("tutorSessionId", "createdAt");

-- CreateIndex
CREATE INDEX "ai_generations_conceptId_lens_idx" ON "ai_generations"("conceptId", "lens");

-- CreateIndex
CREATE UNIQUE INDEX "ai_generations_promptHash_model_key" ON "ai_generations"("promptHash", "model");

-- CreateIndex
CREATE INDEX "cohorts_instructorId_idx" ON "cohorts"("instructorId");

-- CreateIndex
CREATE INDEX "cohort_members_userId_idx" ON "cohort_members"("userId");

-- CreateIndex
CREATE INDEX "activity_events_userId_createdAt_idx" ON "activity_events"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "activity_events_type_createdAt_idx" ON "activity_events"("type", "createdAt");

-- CreateIndex
CREATE INDEX "rate_limits_windowStart_idx" ON "rate_limits"("windowStart");

-- CreateIndex
CREATE INDEX "audit_logs_actorId_createdAt_idx" ON "audit_logs"("actorId", "createdAt");

-- CreateIndex
CREATE INDEX "audit_logs_action_createdAt_idx" ON "audit_logs"("action", "createdAt");

-- AddForeignKey
ALTER TABLE "learner_profiles" ADD CONSTRAINT "learner_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "learner_profiles" ADD CONSTRAINT "learner_profiles_activeGoalId_fkey" FOREIGN KEY ("activeGoalId") REFERENCES "goals"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "concepts" ADD CONSTRAINT "concepts_domainId_fkey" FOREIGN KEY ("domainId") REFERENCES "domains"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "concept_edges" ADD CONSTRAINT "concept_edges_prerequisiteId_fkey" FOREIGN KEY ("prerequisiteId") REFERENCES "concepts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "concept_edges" ADD CONSTRAINT "concept_edges_conceptId_fkey" FOREIGN KEY ("conceptId") REFERENCES "concepts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "goals" ADD CONSTRAINT "goals_domainId_fkey" FOREIGN KEY ("domainId") REFERENCES "domains"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "goal_concepts" ADD CONSTRAINT "goal_concepts_goalId_fkey" FOREIGN KEY ("goalId") REFERENCES "goals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "goal_concepts" ADD CONSTRAINT "goal_concepts_conceptId_fkey" FOREIGN KEY ("conceptId") REFERENCES "concepts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "concept_layouts" ADD CONSTRAINT "concept_layouts_goalId_fkey" FOREIGN KEY ("goalId") REFERENCES "goals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "concept_layouts" ADD CONSTRAINT "concept_layouts_conceptId_fkey" FOREIGN KEY ("conceptId") REFERENCES "concepts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "content_lenses" ADD CONSTRAINT "content_lenses_conceptId_fkey" FOREIGN KEY ("conceptId") REFERENCES "concepts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "misconceptions" ADD CONSTRAINT "misconceptions_conceptId_fkey" FOREIGN KEY ("conceptId") REFERENCES "concepts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "questions" ADD CONSTRAINT "questions_conceptId_fkey" FOREIGN KEY ("conceptId") REFERENCES "concepts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "questions" ADD CONSTRAINT "questions_misconceptionId_fkey" FOREIGN KEY ("misconceptionId") REFERENCES "misconceptions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "question_options" ADD CONSTRAINT "question_options_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "question_options" ADD CONSTRAINT "question_options_misconceptionId_fkey" FOREIGN KEY ("misconceptionId") REFERENCES "misconceptions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "question_hints" ADD CONSTRAINT "question_hints_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assessment_sessions" ADD CONSTRAINT "assessment_sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assessment_sessions" ADD CONSTRAINT "assessment_sessions_goalId_fkey" FOREIGN KEY ("goalId") REFERENCES "goals"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assessment_sessions" ADD CONSTRAINT "assessment_sessions_conceptId_fkey" FOREIGN KEY ("conceptId") REFERENCES "concepts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assessment_items" ADD CONSTRAINT "assessment_items_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "assessment_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assessment_items" ADD CONSTRAINT "assessment_items_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "knowledge_states" ADD CONSTRAINT "knowledge_states_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "knowledge_states" ADD CONSTRAINT "knowledge_states_conceptId_fkey" FOREIGN KEY ("conceptId") REFERENCES "concepts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "knowledge_state_events" ADD CONSTRAINT "knowledge_state_events_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "knowledge_state_events" ADD CONSTRAINT "knowledge_state_events_conceptId_fkey" FOREIGN KEY ("conceptId") REFERENCES "concepts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "learner_misconceptions" ADD CONSTRAINT "learner_misconceptions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "learner_misconceptions" ADD CONSTRAINT "learner_misconceptions_misconceptionId_fkey" FOREIGN KEY ("misconceptionId") REFERENCES "misconceptions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "review_schedules" ADD CONSTRAINT "review_schedules_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "review_schedules" ADD CONSTRAINT "review_schedules_conceptId_fkey" FOREIGN KEY ("conceptId") REFERENCES "concepts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "learning_paths" ADD CONSTRAINT "learning_paths_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "learning_paths" ADD CONSTRAINT "learning_paths_goalId_fkey" FOREIGN KEY ("goalId") REFERENCES "goals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "learning_path_nodes" ADD CONSTRAINT "learning_path_nodes_pathId_fkey" FOREIGN KEY ("pathId") REFERENCES "learning_paths"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "learning_path_nodes" ADD CONSTRAINT "learning_path_nodes_conceptId_fkey" FOREIGN KEY ("conceptId") REFERENCES "concepts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recommendations" ADD CONSTRAINT "recommendations_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recommendations" ADD CONSTRAINT "recommendations_conceptId_fkey" FOREIGN KEY ("conceptId") REFERENCES "concepts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tutor_sessions" ADD CONSTRAINT "tutor_sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tutor_sessions" ADD CONSTRAINT "tutor_sessions_conceptId_fkey" FOREIGN KEY ("conceptId") REFERENCES "concepts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tutor_sessions" ADD CONSTRAINT "tutor_sessions_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "questions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tutor_messages" ADD CONSTRAINT "tutor_messages_tutorSessionId_fkey" FOREIGN KEY ("tutorSessionId") REFERENCES "tutor_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_generations" ADD CONSTRAINT "ai_generations_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_generations" ADD CONSTRAINT "ai_generations_conceptId_fkey" FOREIGN KEY ("conceptId") REFERENCES "concepts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cohorts" ADD CONSTRAINT "cohorts_instructorId_fkey" FOREIGN KEY ("instructorId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cohort_members" ADD CONSTRAINT "cohort_members_cohortId_fkey" FOREIGN KEY ("cohortId") REFERENCES "cohorts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cohort_members" ADD CONSTRAINT "cohort_members_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_events" ADD CONSTRAINT "activity_events_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
