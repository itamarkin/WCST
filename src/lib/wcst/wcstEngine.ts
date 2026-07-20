// WCST test administration engine.
// Collects raw trial data and enforces the rule-sequence / category-completion
// logic defined by Heaton et al. (1993). The UI calls this engine; the engine
// never scores. Scoring happens only in wcstScoring.ts after the test ends.

import {
  CONSECUTIVE_CRITERION,
  MAX_CATEGORIES,
  RULE_SEQUENCE,
  getMatchingDimensions,
} from "./cards";
import type { Card, Dimension, RawTrial } from "./wcstTypes";

export interface EngineState {
  consecutiveCorrect: number;
  categoriesCompleted: number;
  currentRuleIndex: number;
  finished: boolean;
}

export interface TrialResult {
  trial: RawTrial;
  state: EngineState;
  // True when this trial's 10th consecutive correct completed a category.
  categoryCompletedThisTrial: boolean;
  // True when this trial caused the test to finish (6th category or 128th card).
  testFinishedThisTrial: boolean;
}

export function createInitialEngineState(): EngineState {
  return {
    consecutiveCorrect: 0,
    categoriesCompleted: 0,
    currentRuleIndex: 0,
    finished: false,
  };
}

export function getActiveRule(state: EngineState): Dimension {
  return RULE_SEQUENCE[state.currentRuleIndex % RULE_SEQUENCE.length];
}

// Build a raw trial record from a participant's stimulus choice.
// Pure function: no React state, no side effects.
export function recordTrial(
  responseCard: Card,
  selectedStimulusIndex: number,
  stimulus: Card,
  state: EngineState,
  trialNumber: number
): RawTrial {
  const activeRule = getActiveRule(state);
  const allMatchingDimensions = getMatchingDimensions(responseCard, stimulus);
  const isUnambiguous = allMatchingDimensions.length === 1;
  const dimensionUsedIfUnambiguous = isUnambiguous
    ? allMatchingDimensions[0]
    : null;
  const isCorrect = responseCard[activeRule] === stimulus[activeRule];

  return {
    trialNumber,
    responseCard: { ...responseCard },
    selectedStimulusIndex,
    activeRule,
    isCorrect,
    isUnambiguous,
    dimensionUsedIfUnambiguous,
    allMatchingDimensions: [...allMatchingDimensions],
  };
}

// Advance the engine state given a newly recorded trial.
// Returns the post-trial state plus flags describing what happened.
export function advanceState(
  trial: RawTrial,
  state: EngineState,
  trialsAdministered: number
): TrialResult {
  if (state.finished) {
    return { trial, state, categoryCompletedThisTrial: false, testFinishedThisTrial: false };
  }

  const next: EngineState = { ...state };
  let categoryCompletedThisTrial = false;
  let testFinishedThisTrial = false;

  if (trial.isCorrect) {
    next.consecutiveCorrect = state.consecutiveCorrect + 1;

    if (next.consecutiveCorrect === CONSECUTIVE_CRITERION) {
      next.categoriesCompleted = state.categoriesCompleted + 1;
      categoryCompletedThisTrial = true;
      // Tendency is updated by the scorer at this exact trial; the engine only
      // advances the active sorting rule and resets the streak.
      next.currentRuleIndex = state.currentRuleIndex + 1;
      next.consecutiveCorrect = 0;

      if (next.categoriesCompleted >= MAX_CATEGORIES) {
        next.finished = true;
        testFinishedThisTrial = true;
      }
    }
  } else {
    next.consecutiveCorrect = 0;
  }

  // Stop at 128 administered cards regardless of categories.
  if (!next.finished && trialsAdministered + 1 >= 128) {
    next.finished = true;
    testFinishedThisTrial = true;
  }

  return {
    trial,
    state: next,
    categoryCompletedThisTrial,
    testFinishedThisTrial,
  };
}

// Convenience: record a trial and advance the state in one call.
export function administerTrial(
  responseCard: Card,
  selectedStimulusIndex: number,
  stimulus: Card,
  state: EngineState,
  trialNumber: number
): TrialResult {
  const trial = recordTrial(
    responseCard,
    selectedStimulusIndex,
    stimulus,
    state,
    trialNumber
  );
  return advanceState(trial, state, trialNumber);
}

export const ENGINE_CONSTANTS = {
  CONSECUTIVE_CRITERION,
  MAX_CATEGORIES,
  MAX_CARDS: 128,
};
