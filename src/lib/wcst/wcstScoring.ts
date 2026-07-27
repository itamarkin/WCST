// Deterministic WCST scorer based only on raw trial data.
// Implements the Heaton et al. (1993) scoring specification:
//   - Per-trial perseverative tendency history (not a single mutable scalar)
//   - Category-completion tendency update on the 10th consecutive correct
//   - "Rule of 3" tendency shift with full reset on any non-matching trial
//   - Sandwich rule for ambiguous trials (second pass, tendency-aware)
//   - Conceptual level responses, failure to maintain set, learning to learn
//
// This module is pure: given a RawTrial[] it returns a fixed WCSTScores object.
// It never reads React state and has no side effects.

import { CONSECUTIVE_CRITERION } from "./cards";
import type {
  CategoryAttempt,
  Dimension,
  ProcessedResponse,
  RawTrial,
  WCSTScores,
} from "./wcstTypes";

interface InternalRow {
  trialNumber: number;
  isCorrect: boolean;
  isUnambiguous: boolean;
  dimensionUsedIfUnambiguous: Dimension | null;
  allMatchingDimensions: Dimension[];
  activeRule: Dimension;
}

// ---------------------------------------------------------------------------
// Pass 1: category attempts + conceptual level responses + FMS.
// Also records the exact trial indices where a category completed so pass2 can
// update the tendency at those trials without recomputing the run.
// ---------------------------------------------------------------------------
interface Pass1Result {
  totalCorrect: number;
  totalErrors: number;
  categoriesCompleted: number;
  trialsToFirstCategory: number | null;
  conceptualLevelResponses: number;
  failureToMaintainSet: number;
  categoryAttempts: CategoryAttempt[];
  categoryCompletionIndices: number[];
}

function pass1(rows: InternalRow[]): Pass1Result {
  let totalCorrect = 0;
  let totalErrors = 0;
  let categoriesCompleted = 0;
  let trialsToFirstCategory: number | null = null;
  let conceptualLevelResponses = 0;
  let failureToMaintainSet = 0;

  const categoryAttempts: CategoryAttempt[] = [];
  const categoryCompletionIndices: number[] = [];
  let currentRun = 0;
  let attemptStart = 0;
  let attemptErrors = 0;
  let attemptNumber = 1;

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];

    if (row.isCorrect) {
      totalCorrect++;
      currentRun++;

      if (currentRun === 3) {
        conceptualLevelResponses += 3;
      } else if (currentRun > 3) {
        conceptualLevelResponses += 1;
      }

      if (currentRun === CONSECUTIVE_CRITERION) {
        categoriesCompleted++;
        categoryCompletionIndices.push(i);
        if (trialsToFirstCategory === null) {
          trialsToFirstCategory = i + 1;
        }
        categoryAttempts.push({
          categoryNumber: attemptNumber,
          startIndex: attemptStart,
          endIndex: i,
          totalTrials: i - attemptStart + 1,
          errorCount: attemptErrors,
          completed: true,
        });
        attemptNumber++;
        attemptStart = i + 1;
        attemptErrors = 0;
        currentRun = 0;
      }
    } else {
      totalErrors++;
      attemptErrors++;
      if (currentRun >= 5 && currentRun <= 9) {
        failureToMaintainSet++;
      }
      currentRun = 0;
    }
  }

  if (attemptStart < rows.length) {
    categoryAttempts.push({
      categoryNumber: attemptNumber,
      startIndex: attemptStart,
      endIndex: rows.length - 1,
      totalTrials: rows.length - attemptStart,
      errorCount: attemptErrors,
      completed: false,
    });
  }

  return {
    totalCorrect,
    totalErrors,
    categoriesCompleted,
    trialsToFirstCategory,
    conceptualLevelResponses,
    failureToMaintainSet,
    categoryAttempts,
    categoryCompletionIndices,
  };
}

// ---------------------------------------------------------------------------
// Pass 2: per-trial perseverative tendency history.
//   tendencyBefore[i] = tendency in effect when trial i was administered
//                        (the value carried in from prior trials). This is the
//                        tendency used for sandwich checks on ambiguous trials.
//   tendencyAfter[i]  = tendency after applying this trial's events.
//
// Events that change tendency:
//   - first unambiguous error -> establishes tendency (that trial NOT persev)
//   - category completion (from pass1 indices) -> tendency = completed rule
//   - rule of 3: 3 consecutive unambiguous errors to the same NEW dimension,
//     with any non-matching trial resetting the count, shifts tendency and
//     retroactively flags the qualifying errors (and ambiguous trials between
//     the 2nd and 3rd qualifying errors that match the candidate dimension).
//
// Unambiguous errors matching the current tendency are perseverative.
// ---------------------------------------------------------------------------
interface Pass2Result {
  tendencyBefore: (Dimension | null)[];
  perseverative: boolean[];
}

interface RuleOf3State {
  candidateDimension: Dimension | null;
  candidateCount: number;
  candidateTrialIndices: number[];
}

function pass2(
  rows: InternalRow[],
  categoryCompletionIndices: number[]
): Pass2Result {
  const n = rows.length;
  const tendencyBefore: (Dimension | null)[] = new Array(n).fill(null);
  const perseverative: boolean[] = new Array(n).fill(false);

  let tendency: Dimension | null = null;
  const completionSet = new Set(categoryCompletionIndices);
  const r3: RuleOf3State = {
    candidateDimension: null,
    candidateCount: 0,
    candidateTrialIndices: [],
  };

  const resetRuleOf3 = () => {
    r3.candidateDimension = null;
    r3.candidateCount = 0;
    r3.candidateTrialIndices = [];
  };

  for (let i = 0; i < n; i++) {
    const row = rows[i];
    tendencyBefore[i] = tendency;

    // Category completion on this exact trial: update tendency to the completed
    // rule immediately. No error is required to trigger this.
    if (completionSet.has(i)) {
      tendency = row.activeRule;
      resetRuleOf3();
    }

    if (row.isUnambiguous && !row.isCorrect) {
      const dim = row.dimensionUsedIfUnambiguous as Dimension;

      if (tendency === null) {
        // First unambiguous error of the test establishes tendency (only
        // reachable if no category has completed yet either, since category
        // completion also sets tendency directly above). This trial is NOT
        // itself perseverative.
        tendency = dim;
        resetRuleOf3();
        continue;
      }

      // Rule-of-3 candidate evaluation.
      if (r3.candidateDimension === null) {
        if (dim !== tendency) {
          // Start a new candidate run.
          r3.candidateDimension = dim;
          r3.candidateCount = 1;
          r3.candidateTrialIndices = [i];
        } else {
          // Error to the current tendency: perseverative. No candidate starts.
          perseverative[i] = true;
        }
      } else if (dim === r3.candidateDimension) {
        r3.candidateCount++;
        r3.candidateTrialIndices.push(i);

        if (r3.candidateCount >= 3) {
          // Shift confirmed: flag all three qualifying errors.
          for (const idx of r3.candidateTrialIndices) {
            perseverative[idx] = true;
          }
          // Flag ambiguous trials between the 2nd and 3rd qualifying errors
          // that match the candidate dimension. Ambiguous trials between the
          // 1st and 2nd do NOT count (pattern established at the 2nd error).
          const secondIdx = r3.candidateTrialIndices[1];
          const thirdIdx = r3.candidateTrialIndices[2];
          for (let k = secondIdx + 1; k < thirdIdx; k++) {
            const between = rows[k];
            if (
              !between.isUnambiguous &&
              between.allMatchingDimensions.includes(r3.candidateDimension) &&
              !perseverative[k]
            ) {
              perseverative[k] = true;
            }
          }
          tendency = r3.candidateDimension;
          resetRuleOf3();
        }
      } else {
        // Non-matching unambiguous error: fully resets the candidate run.
        resetRuleOf3();
        if (dim === tendency) {
          // Error to the (still-current) tendency: perseverative.
          perseverative[i] = true;
        } else if (dim !== tendency) {
          // Begin a fresh candidate run with this new dimension.
          r3.candidateDimension = dim;
          r3.candidateCount = 1;
          r3.candidateTrialIndices = [i];
        }
      }
    } else if (row.isCorrect) {
      // Any correct response is a non-matching intervening trial and resets
      // the rule-of-3 candidate. Ambiguous trials do NOT reset.
      resetRuleOf3();
    }
  }

  return { tendencyBefore, perseverative };
}

// ---------------------------------------------------------------------------
// Pass 3: sandwich rule for ambiguous trials.
// Only unambiguous perseverative flags are set so far. For each ambiguous trial
// we find the nearest perseverative unambiguous trial to the left and right
// (allowing a contiguous run of ambiguous trials that all match the tendency).
// If both bounds exist, every matching ambiguous trial in the chain is flagged.
// First/last trials of the test can never qualify (missing one bound).
// ---------------------------------------------------------------------------
function pass3(
  rows: InternalRow[],
  perseverative: boolean[],
  tendencyBefore: (Dimension | null)[]
): void {
  const n = rows.length;

  // Precompute, for each index, the nearest perseverative unambiguous index to
  // the left and right, only crossing intervening ambiguous trials that match
  // the same tendency. This handles chains like P-A-A-A-P in one sweep.
  for (let i = 0; i < n; i++) {
    const row = rows[i];
    if (row.isUnambiguous) continue;
    if (perseverative[i]) continue;

    const tendency = tendencyBefore[i];
    if (tendency === null) continue;
    if (!row.allMatchingDimensions.includes(tendency)) continue;

    // Scan left: the immediately preceding trials must be ambiguous-and-matching
    // until we hit a perseverative unambiguous trial.
    let left = -1;
    for (let j = i - 1; j >= 0; j--) {
      const prev = rows[j];
      if (prev.isUnambiguous) {
        if (perseverative[j]) left = j;
        break;
      }
      // Ambiguous: must match the tendency to continue the chain.
      if (!prev.allMatchingDimensions.includes(tendency)) break;
    }
    if (left === -1) continue;

    // Scan right: ambiguous-and-matching until a perseverative unambiguous trial.
    let right = -1;
    for (let j = i + 1; j < n; j++) {
      const nxt = rows[j];
      if (nxt.isUnambiguous) {
        if (perseverative[j]) right = j;
        break;
      }
      if (!nxt.allMatchingDimensions.includes(tendency)) break;
    }
    if (right === -1) continue;

    // Flag every matching ambiguous trial in (left, right).
    for (let k = left + 1; k < right; k++) {
      const between = rows[k];
      if (
        !between.isUnambiguous &&
        !perseverative[k] &&
        between.allMatchingDimensions.includes(tendency)
      ) {
        perseverative[k] = true;
      }
    }
  }
}

// ---------------------------------------------------------------------------
// Pass 4: learning to learn.
// Path A: 3+ completed categories.
// Path B: exactly 2 completed categories and >=10 trials in the (incomplete)
//         3rd attempt, which participates in the calculation as a data point.
// Difference direction is prior minus subsequent; positive means improvement.
// Never return 0 for an eligible subject (return null instead).
// ---------------------------------------------------------------------------
function computeLTL(
  categoryAttempts: CategoryAttempt[],
  categoriesCompleted: number
): number | null {
  const eligible =
    categoriesCompleted >= 3 ||
    (categoriesCompleted === 2 &&
      categoryAttempts.length >= 3 &&
      categoryAttempts[2].totalTrials >= 10);

  if (!eligible) return null;

  const included = categoryAttempts.filter((a) => a.totalTrials > 0);
  if (included.length < 2) return null;

  const percentErrors = included.map(
    (a) => (a.errorCount / a.totalTrials) * 100
  );

  const differences: number[] = [];
  for (let i = 1; i < percentErrors.length; i++) {
    differences.push(percentErrors[i - 1] - percentErrors[i]);
  }
  if (differences.length === 0) return null;

  const sum = differences.reduce((acc, v) => acc + v, 0);
  const ltl = sum / differences.length;
  const rounded = Math.round(ltl * 100) / 100;
  return rounded;
}

// ---------------------------------------------------------------------------
// Public entry point.
// ---------------------------------------------------------------------------
export function scoreWCST(rawTrials: RawTrial[]): WCSTScores {
  const rows: InternalRow[] = rawTrials.map((t) => ({
    trialNumber: t.trialNumber,
    isCorrect: t.isCorrect,
    isUnambiguous: t.isUnambiguous,
    dimensionUsedIfUnambiguous: t.dimensionUsedIfUnambiguous,
    allMatchingDimensions: t.allMatchingDimensions,
    activeRule: t.activeRule,
  }));

  const p1 = pass1(rows);
  const p2 = pass2(rows, p1.categoryCompletionIndices);
  pass3(rows, p2.perseverative, p2.tendencyBefore);

  const perseverativeFlags = p2.perseverative;
  let perseverativeResponses = 0;
  let perseverativeErrors = 0;
  for (let i = 0; i < rows.length; i++) {
    if (perseverativeFlags[i]) {
      perseverativeResponses++;
      if (!rows[i].isCorrect) perseverativeErrors++;
    }
  }
  const nonPerseverativeErrors = p1.totalErrors - perseverativeErrors;

  const totalTrials = rows.length;
  const percentErrors = totalTrials > 0 ? (p1.totalErrors / totalTrials) * 100 : 0;
  const percentPerseverativeResponses =
    totalTrials > 0 ? (perseverativeResponses / totalTrials) * 100 : 0;
  const percentPerseverativeErrors =
    p1.totalErrors > 0 ? (perseverativeErrors / p1.totalErrors) * 100 : 0;
  const percentNonPerseverativeErrors =
    p1.totalErrors > 0 ? (nonPerseverativeErrors / p1.totalErrors) * 100 : 0;
  const percentConceptualLevelResponses =
    totalTrials > 0 ? (p1.conceptualLevelResponses / totalTrials) * 100 : 0;

  const learningToLearn = computeLTL(
    p1.categoryAttempts,
    p1.categoriesCompleted
  );

  const processedResponses: ProcessedResponse[] = rawTrials.map((t, i) => ({
  trialNumber: t.trialNumber,
  responseCard: t.responseCard,
  selectedStimulusIndex: t.selectedStimulusIndex,
  activeRule: t.activeRule,
  isCorrect: t.isCorrect,
  isUnambiguous: t.isUnambiguous,
  dimensionUsedIfUnambiguous: t.dimensionUsedIfUnambiguous,
  allMatchingDimensions: t.allMatchingDimensions,
  perseverative: perseverativeFlags[i],
  tendencyAtTrial: p2.tendencyBefore[i],
}));

  return {
    totalTrials,
    totalCorrect: p1.totalCorrect,
    totalErrors: p1.totalErrors,
    categoriesCompleted: p1.categoriesCompleted,
    trialsToFirstCategory: p1.trialsToFirstCategory,
    conceptualLevelResponses: p1.conceptualLevelResponses,
    failureToMaintainSet: p1.failureToMaintainSet,
    perseverativeResponses,
    perseverativeErrors,
    nonPerseverativeErrors,
    percentErrors,
    percentPerseverativeResponses,
    percentPerseverativeErrors,
    percentNonPerseverativeErrors,
    percentConceptualLevelResponses,
    learningToLearn,
    processedResponses,
  };
}
