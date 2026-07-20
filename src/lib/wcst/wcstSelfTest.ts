// Internal self-tests for the WCST scorer.
// These verify the 8 spec-mandated cases and can be run from a Node/tsx context
// or imported in development. They are deterministic and exercise scoreWCST
// directly with hand-built raw trials.

import { scoreWCST } from "./wcstScoring";
import type { Card, RawTrial } from "./wcstTypes";

const baseCard: Card = { id: 0, color: "red", shape: "triangle", number: 1 };

// Build a raw trial quickly for tests. Only the fields the scorer reads need to
// be specified; defaults cover the rest.
function t(
  trialNumber: number,
  partial: Partial<RawTrial> & {
    isCorrect: boolean;
    isUnambiguous: boolean;
  }
): RawTrial {
  return {
    trialNumber,
    responseCard: baseCard,
    selectedStimulusIndex: 0,
    activeRule: partial.activeRule ?? "color",
    isCorrect: partial.isCorrect,
    isUnambiguous: partial.isUnambiguous,
    dimensionUsedIfUnambiguous: partial.dimensionUsedIfUnambiguous ?? null,
    allMatchingDimensions: partial.allMatchingDimensions ?? [],
  };
}

interface CaseResult {
  name: string;
  passed: boolean;
  detail: string;
}

function assert(
  name: string,
  cond: boolean,
  detail: string
): CaseResult {
  return { name, passed: cond, detail };
}

// Case 1: trial 1 unambiguous error establishes tendency and is not perseverative.
function case1(): CaseResult {
  const trials: RawTrial[] = [
    t(1, {
      isCorrect: false,
      isUnambiguous: true,
      dimensionUsedIfUnambiguous: "color",
      allMatchingDimensions: ["color"],
    }),
    t(2, {
      isCorrect: false,
      isUnambiguous: true,
      dimensionUsedIfUnambiguous: "color",
      allMatchingDimensions: ["color"],
    }),
  ];
  const s = scoreWCST(trials);
  const p1 = s.processedResponses[0];
  const p2 = s.processedResponses[1];
  const ok =
    p1.tendencyAtTrial === null &&
    !p1.perseverative &&
    p2.tendencyAtTrial === "color" &&
    p2.perseverative;
  return assert(
    "Case 1: first unambiguous error establishes tendency, not perseverative",
    ok,
    `t1 tendency=${p1.tendencyAtTrial} persev=${p1.perseverative}; t2 tendency=${p2.tendencyAtTrial} persev=${p2.perseverative}`
  );
}

// Case 2: rule of 3 with a reset: error A, error B, error A, error A, error A.
// The intervening error B starts a candidate (shape), but the return to A
// resets it. The trailing A errors match the current tendency (color) so they
// are perseverative, but NO rule-of-3 shift to shape occurs. This verifies the
// reset behavior: the shape candidate does NOT survive the non-matching trial.
function case2(): CaseResult {
  const trials: RawTrial[] = [
    // Trial 1: color error -> establishes tendency=color, NOT perseverative.
    t(1, { isCorrect: false, isUnambiguous: true, dimensionUsedIfUnambiguous: "color", allMatchingDimensions: ["color"] }),
    // Trial 2: shape error -> starts candidate shape (count=1), NOT perseverative.
    t(2, { isCorrect: false, isUnambiguous: true, dimensionUsedIfUnambiguous: "shape", allMatchingDimensions: ["shape"] }),
    // Trial 3: color error -> resets candidate; matches tendency -> perseverative.
    t(3, { isCorrect: false, isUnambiguous: true, dimensionUsedIfUnambiguous: "color", allMatchingDimensions: ["color"] }),
    // Trial 4: color error -> perseverative (matches tendency).
    t(4, { isCorrect: false, isUnambiguous: true, dimensionUsedIfUnambiguous: "color", allMatchingDimensions: ["color"] }),
    // Trial 5: color error -> perseverative (matches tendency).
    t(5, { isCorrect: false, isUnambiguous: true, dimensionUsedIfUnambiguous: "color", allMatchingDimensions: ["color"] }),
  ];
  const s = scoreWCST(trials);
  const p = s.processedResponses.map((r) => r.perseverative);
  // Tendency stays color throughout (no shift to shape); trials 3-5 are persev.
  const ok = !p[0] && !p[1] && p[2] && p[3] && p[4];
  return assert(
    "Case 2: rule of 3 with reset (A,B,A,A,A) - no shift, A errors perseverative",
    ok,
    `persev flags: ${JSON.stringify(p)} tendency at end: ${s.processedResponses[4].tendencyAtTrial}`
  );
}

// Case 3: rule of 3 interrupted by a correct response resets the count.
function case3(): CaseResult {
  const trials: RawTrial[] = [
    t(1, { isCorrect: false, isUnambiguous: true, dimensionUsedIfUnambiguous: "color", allMatchingDimensions: ["color"] }),
    t(2, { isCorrect: false, isUnambiguous: true, dimensionUsedIfUnambiguous: "shape", allMatchingDimensions: ["shape"] }),
    t(3, { isCorrect: false, isUnambiguous: true, dimensionUsedIfUnambiguous: "shape", allMatchingDimensions: ["shape"] }),
    // Correct response resets the candidate.
    t(4, { isCorrect: true, isUnambiguous: true, dimensionUsedIfUnambiguous: "color", allMatchingDimensions: ["color"] }),
    t(5, { isCorrect: false, isUnambiguous: true, dimensionUsedIfUnambiguous: "shape", allMatchingDimensions: ["shape"] }),
    // Only one shape error after the reset: no shift, trial 5 not perseverative.
  ];
  const s = scoreWCST(trials);
  const p5 = s.processedResponses[4];
  const ok = !p5.perseverative;
  return assert(
    "Case 3: rule of 3 interrupted by correct response resets count",
    ok,
    `trial 5 persev=${p5.perseverative} tendency=${p5.tendencyAtTrial}`
  );
}

// Case 4: category completion (10th correct) updates tendency immediately.
function case4(): CaseResult {
  const trials: RawTrial[] = [];
  // First establish a tendency via an unambiguous shape error.
  trials.push(t(1, { isCorrect: false, isUnambiguous: true, dimensionUsedIfUnambiguous: "shape", allMatchingDimensions: ["shape"] }));
  // Then 10 consecutive correct under color rule -> category completes.
  for (let i = 2; i <= 11; i++) {
    trials.push(t(i, { isCorrect: true, isUnambiguous: true, dimensionUsedIfUnambiguous: "color", allMatchingDimensions: ["color"], activeRule: "color" }));
  }
  // Trial 12: a shape error. After category completion tendency should be color,
  // so this shape error is NOT perseverative (tendency is now color).
  trials.push(t(12, { isCorrect: false, isUnambiguous: true, dimensionUsedIfUnambiguous: "shape", allMatchingDimensions: ["shape"] }));
  const s = scoreWCST(trials);
  const completing = s.processedResponses[9]; // trial 11
  const after = s.processedResponses[11]; // trial 12
  // Tendency after the completing trial should be color.
  const ok =
    s.categoriesCompleted === 1 &&
    after.tendencyAtTrial === "color" &&
    !after.perseverative;
  return assert(
    "Case 4: 10th correct updates tendency immediately",
    ok,
    `cats=${s.categoriesCompleted} t12 tendency=${after.tendencyAtTrial} persev=${after.perseverative} completingTendency=${completing.tendencyAtTrial}`
  );
}

// Case 5: sandwich P-A-A-A-P. All ambiguous middle trials become perseverative.
function case5(): CaseResult {
  // Tendency color (established trial 1). Trials 2 and 6 are unambiguous color
  // errors (perseverative). Trials 3,4,5 are ambiguous and match color.
  const trials: RawTrial[] = [
    t(1, { isCorrect: false, isUnambiguous: true, dimensionUsedIfUnambiguous: "color", allMatchingDimensions: ["color"] }),
    t(2, { isCorrect: false, isUnambiguous: true, dimensionUsedIfUnambiguous: "color", allMatchingDimensions: ["color"] }),
    t(3, { isCorrect: false, isUnambiguous: false, allMatchingDimensions: ["color", "shape"] }),
    t(4, { isCorrect: false, isUnambiguous: false, allMatchingDimensions: ["color", "shape"] }),
    t(5, { isCorrect: false, isUnambiguous: false, allMatchingDimensions: ["color", "shape"] }),
    t(6, { isCorrect: false, isUnambiguous: true, dimensionUsedIfUnambiguous: "color", allMatchingDimensions: ["color"] }),
  ];
  const s = scoreWCST(trials);
  const p = s.processedResponses.map((r) => r.perseverative);
  const ok = p[1] && p[2] && p[3] && p[4] && p[5];
  return assert(
    "Case 5: sandwich P-A-A-A-P flags all ambiguous trials",
    ok,
    `persev flags: ${JSON.stringify(p)}`
  );
}

// Case 6: ambiguous correct response satisfying sandwich becomes perseverative.
function case6(): CaseResult {
  const trials: RawTrial[] = [
    t(1, { isCorrect: false, isUnambiguous: true, dimensionUsedIfUnambiguous: "color", allMatchingDimensions: ["color"] }),
    t(2, { isCorrect: false, isUnambiguous: true, dimensionUsedIfUnambiguous: "color", allMatchingDimensions: ["color"] }),
    // Ambiguous correct response matching color (active rule is color, and it
    // also matches shape, so it is ambiguous). Sandwich should flag it.
    t(3, { isCorrect: true, isUnambiguous: false, allMatchingDimensions: ["color", "shape"], activeRule: "color" }),
    t(4, { isCorrect: false, isUnambiguous: true, dimensionUsedIfUnambiguous: "color", allMatchingDimensions: ["color"] }),
  ];
  const s = scoreWCST(trials);
  const p3 = s.processedResponses[2];
  const ok = p3.perseverative && p3.isCorrect;
  return assert(
    "Case 6: ambiguous correct response satisfying sandwich is perseverative",
    ok,
    `trial 3 correct=${p3.isCorrect} persev=${p3.perseverative} tendency=${p3.tendencyAtTrial}`
  );
}

// Case 7: LTL with an incomplete third category (Path B).
function case7(): CaseResult {
  const trials: RawTrial[] = [];
  // Category 1 (color): 6 errors then 10 correct -> completes at trial 16.
  // 16 trials total, 6 errors -> 37.5% (matches the shape of the worked example).
  for (let i = 1; i <= 6; i++) {
    trials.push(t(i, { isCorrect: false, isUnambiguous: true, dimensionUsedIfUnambiguous: "shape", allMatchingDimensions: ["shape"] }));
  }
  for (let i = 7; i <= 16; i++) {
    trials.push(t(i, { isCorrect: true, isUnambiguous: true, dimensionUsedIfUnambiguous: "color", allMatchingDimensions: ["color"], activeRule: "color" }));
  }
  // Category 2 (shape): 4 errors then 10 correct -> completes at trial 30.
  // 14 trials total, 4 errors -> 28.57%.
  for (let i = 17; i <= 20; i++) {
    trials.push(t(i, { isCorrect: false, isUnambiguous: true, dimensionUsedIfUnambiguous: "color", allMatchingDimensions: ["color"], activeRule: "shape" }));
  }
  for (let i = 21; i <= 30; i++) {
    trials.push(t(i, { isCorrect: true, isUnambiguous: true, dimensionUsedIfUnambiguous: "shape", allMatchingDimensions: ["shape"], activeRule: "shape" }));
  }
  // Incomplete 3rd attempt (number rule): 12 trials, 2 errors, no 10-run so the
  // category stays incomplete. Interleave errors so no 10 consecutive correct.
  // Errors on trials 31 and 32, then 10 correct -> no 10-run before the errors
  // would start the run, so we place errors to break it: 2 errors then 10 correct
  // would actually complete. Use errors at positions that break the run.
  for (let i = 31; i <= 36; i++) {
    trials.push(t(i, { isCorrect: true, isUnambiguous: true, dimensionUsedIfUnambiguous: "number", allMatchingDimensions: ["number"], activeRule: "number" }));
  }
  trials.push(t(37, { isCorrect: false, isUnambiguous: true, dimensionUsedIfUnambiguous: "color", allMatchingDimensions: ["color"], activeRule: "number" }));
  trials.push(t(38, { isCorrect: false, isUnambiguous: true, dimensionUsedIfUnambiguous: "color", allMatchingDimensions: ["color"], activeRule: "number" }));
  for (let i = 39; i <= 42; i++) {
    trials.push(t(i, { isCorrect: true, isUnambiguous: true, dimensionUsedIfUnambiguous: "number", allMatchingDimensions: ["number"], activeRule: "number" }));
  }
  // 3rd attempt: 12 trials, 2 errors -> 16.67%.
  const s = scoreWCST(trials);
  // cat1=37.5%, cat2=28.57%, cat3=16.67%
  // diffs: 37.5-28.57=8.93; 28.57-16.67=11.9; LTL=(8.93+11.9)/2=10.41
  const ok =
    s.categoriesCompleted === 2 &&
    s.learningToLearn !== null &&
    Math.abs(s.learningToLearn - 10.41) < 0.02;
  return assert(
    "Case 7: LTL with incomplete third category (Path B)",
    ok,
    `cats=${s.categoriesCompleted} LTL=${s.learningToLearn} (expected ~10.41)`
  );
}

// Case 8: ineligible LTL returns null.
function case8(): CaseResult {
  const trials: RawTrial[] = [];
  // 0 categories completed and only a handful of trials -> not eligible.
  for (let i = 1; i <= 8; i++) {
    trials.push(t(i, { isCorrect: false, isUnambiguous: true, dimensionUsedIfUnambiguous: "color", allMatchingDimensions: ["color"] }));
  }
  const s = scoreWCST(trials);
  const ok = s.learningToLearn === null;
  return assert(
    "Case 8: ineligible LTL returns null",
    ok,
    `cats=${s.categoriesCompleted} LTL=${s.learningToLearn}`
  );
}

// Case 9: rule of 3 confirmed shift (A,A,A) retroactively flags all three.
function case9(): CaseResult {
  const trials: RawTrial[] = [
    t(1, { isCorrect: false, isUnambiguous: true, dimensionUsedIfUnambiguous: "color", allMatchingDimensions: ["color"] }),
    // Three consecutive shape errors -> shift to shape, flag trials 2,3,4.
    t(2, { isCorrect: false, isUnambiguous: true, dimensionUsedIfUnambiguous: "shape", allMatchingDimensions: ["shape"] }),
    t(3, { isCorrect: false, isUnambiguous: true, dimensionUsedIfUnambiguous: "shape", allMatchingDimensions: ["shape"] }),
    t(4, { isCorrect: false, isUnambiguous: true, dimensionUsedIfUnambiguous: "shape", allMatchingDimensions: ["shape"] }),
  ];
  const s = scoreWCST(trials);
  const p = s.processedResponses.map((r) => r.perseverative);
  const ok = !p[0] && p[1] && p[2] && p[3];
  return assert(
    "Case 9: rule of 3 confirmed shift (A,A,A) flags all three",
    ok,
    `persev flags: ${JSON.stringify(p)}`
  );
}

export function runAllSelfTests(): CaseResult[] {
  return [
    case1(),
    case2(),
    case3(),
    case4(),
    case5(),
    case6(),
    case7(),
    case8(),
    case9(),
  ];
}

// Convenience for a Node entry point.
export function formatResults(results: CaseResult[]): string {
  const lines = results.map(
    (r) => `${r.passed ? "PASS" : "FAIL"} | ${r.name} | ${r.detail}`
  );
  const allPassed = results.every((r) => r.passed);
  lines.push(allPassed ? "ALL TESTS PASSED" : "SOME TESTS FAILED");
  return lines.join("\n");
}
