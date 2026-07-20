// Type definitions for the Wisconsin Card Sorting Test (WCST).
// Based on the Heaton et al. (1993) scoring specification.

export type Dimension = "color" | "shape" | "number";

export interface Card {
  id: string | number;
  color: string;
  shape: string;
  number: number;
}

// Raw per-trial data captured during test administration.
// The scorer must never need to infer missing information from this record.
export interface RawTrial {
  trialNumber: number;
  responseCard: Card;
  selectedStimulusIndex: number;
  activeRule: Dimension;
  isCorrect: boolean;
  isUnambiguous: boolean;
  dimensionUsedIfUnambiguous: Dimension | null;
  allMatchingDimensions: Dimension[];
}

// A trial after the scoring passes have annotated it.
export interface ProcessedResponse {
  trialNumber: number;
  responseCard: Card;
  selectedStimulusIndex: number;
  activeRule: Dimension;
  isCorrect: boolean;
  isUnambiguous: boolean;
  dimensionUsedIfUnambiguous: Dimension | null;
  allMatchingDimensions: Dimension[];
  perseverative: boolean;
  tendencyAtTrial: Dimension | null;
}

export interface CategoryAttempt {
  categoryNumber: number; // 1-based
  startIndex: number; // index into the trial array
  endIndex: number; // inclusive
  totalTrials: number;
  errorCount: number;
  completed: boolean; // true if the 10th consecutive correct ended this attempt
}

export interface WCSTScores {
  totalTrials: number;
  totalCorrect: number;
  totalErrors: number;
  categoriesCompleted: number;
  trialsToFirstCategory: number | null;
  conceptualLevelResponses: number;
  failureToMaintainSet: number;
  perseverativeResponses: number;
  perseverativeErrors: number;
  nonPerseverativeErrors: number;
  percentErrors: number;
  percentPerseverativeResponses: number;
  percentPerseverativeErrors: number;
  percentNonPerseverativeErrors: number;
  percentConceptualLevelResponses: number;
  learningToLearn: number | null;
  processedResponses: ProcessedResponse[];
}
