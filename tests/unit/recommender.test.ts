import { describe, expect, it } from 'vitest';
import {
  scoreCandidate,
  rankRecommendations,
  classifyKind,
  type RecommendationCandidate,
} from '@/engine/recommender';

describe('engine/recommender', () => {
  const baseCandidate: RecommendationCandidate = {
    conceptId: 'concept-1',
    conceptTitle: 'Hash Tables',
    goalWeight: 0.9,
    unmetPrerequisiteIds: [],
    unmetPrerequisiteTitles: [],
    openMisconceptions: 0,
    blocksGoalProgress: false,
    knowledge: {
      conceptId: 'concept-1',
      rawMastery: 0.5,
      effectiveMastery: 0.5,
      retrievability: 1.0,
      stabilityDays: 10,
      band: 'IN_PROGRESS',
      attempts: 2,
      correct: 1,
      lastInteractionAt: new Date(),
    },
  };

  it('classifies REVIEW_PROBE when recall has decayed', () => {
    const decaying: RecommendationCandidate = {
      ...baseCandidate,
      knowledge: {
        conceptId: 'concept-1',
        rawMastery: 0.85,
        effectiveMastery: 0.55,
        retrievability: 0.65, // below 0.70 threshold
        stabilityDays: 5,
        band: 'FRAGILE',
        attempts: 4,
        correct: 3,
        lastInteractionAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7),
      },
    };
    expect(classifyKind(decaying)).toBe('REVIEW_PROBE');
    const scored = scoreCandidate(decaying);
    expect(scored.kind).toBe('REVIEW_PROBE');
    expect(scored.rationale).toContain('recall has dropped to 65%');
  });

  it('classifies MISCONCEPTION_DRILL when open misconceptions exist with prerequisites met', () => {
    const candidate: RecommendationCandidate = {
      ...baseCandidate,
      openMisconceptions: 2,
    };
    expect(classifyKind(candidate)).toBe('MISCONCEPTION_DRILL');
    const scored = scoreCandidate(candidate);
    expect(scored.rationale).toContain('2 recurring misconceptions');
  });

  it('classifies PREREQ_BRIDGE when blocking downstream nodes and ready', () => {
    const candidate: RecommendationCandidate = {
      ...baseCandidate,
      blocksGoalProgress: true,
    };
    expect(classifyKind(candidate)).toBe('PREREQ_BRIDGE');
    const scored = scoreCandidate(candidate);
    expect(scored.rationale).toContain('blocking later concepts');
  });

  it('filters out settled mastered concepts from ranked results', () => {
    const mastered: RecommendationCandidate = {
      ...baseCandidate,
      conceptId: 'mastered-1',
      knowledge: {
        conceptId: 'mastered-1',
        rawMastery: 0.95,
        effectiveMastery: 0.95,
        retrievability: 0.98,
        stabilityDays: 30,
        band: 'MASTERED',
        attempts: 5,
        correct: 5,
        lastInteractionAt: new Date(),
      },
    };

    const inProgress: RecommendationCandidate = {
      ...baseCandidate,
      conceptId: 'progress-1',
    };

    const ranked = rankRecommendations([mastered, inProgress]);
    expect(ranked.some((r) => r.conceptId === 'mastered-1')).toBe(false);
    expect(ranked.some((r) => r.conceptId === 'progress-1')).toBe(true);
  });
});
