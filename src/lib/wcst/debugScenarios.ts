// Named debug scenarios for exercising the REAL scoring pipeline (scoreWCST)
// via a URL query param instead of manually clicking through a full test.
//
// Usage: append ?debug=<name> to the URL, e.g. ?debug=ltlPathB
// Available names are the keys of DEBUG_SCENARIOS below.
//
// Each scenario returns a RawTrial[] that gets passed straight into
// finishTest(), so it runs through the exact same scoreWCST code path a real
// test would — this is not a hand-built fake scores object, so it can never
// silently drift out of sync with the actual scoring logic.

import type { Card, RawTrial, Dimension } from '@/lib/wcst/wcstTypes';

const baseCard: Card = { id: 0, color: 'red', shape: 'triangle', number: 1 };

function t(
  trialNumber: number,
  partial: Partial<RawTrial> & { isCorrect: boolean; isUnambiguous: boolean }
): RawTrial {
  return {
    trialNumber,
    responseCard: baseCard,
    selectedStimulusIndex: 0,
    activeRule: partial.activeRule ?? 'color',
    isCorrect: partial.isCorrect,
    isUnambiguous: partial.isUnambiguous,
    dimensionUsedIfUnambiguous: partial.dimensionUsedIfUnambiguous ?? null,
    allMatchingDimensions: partial.allMatchingDimensions ?? [],
  };
}

// --- full: a realistic 6-category run with decreasing error rates. ---
// Good for eyeballing the whole completion screen at once — every field
// (perseverative counts, CLR, FMS, LTL via Path A) gets a non-trivial value.
function buildFullRun(): RawTrial[] {
  const trials: RawTrial[] = [];
  let n = 0;
  const errorCounts = [6, 4, 3, 2, 1, 0]; // decreasing -> positive LTL trend
  const rules: Dimension[] = ['color', 'shape', 'number', 'color', 'shape', 'number'];

  errorCounts.forEach((errCount, catIdx) => {
    const rule = rules[catIdx];
    const wrongDim: Dimension = rule === 'color' ? 'shape' : 'color';
    for (let i = 0; i < errCount; i++) {
      n++;
      trials.push(
        t(n, {
          isCorrect: false,
          isUnambiguous: true,
          dimensionUsedIfUnambiguous: wrongDim,
          allMatchingDimensions: [wrongDim],
          activeRule: rule,
        })
      );
    }
    for (let i = 0; i < 10; i++) {
      n++;
      trials.push(
        t(n, {
          isCorrect: true,
          isUnambiguous: true,
          dimensionUsedIfUnambiguous: rule,
          allMatchingDimensions: [rule],
          activeRule: rule,
        })
      );
    }
  });
  return trials;
}

// --- ruleOf3: isolated 3-consecutive-error shift, no category completion. ---
function buildRuleOf3Shift(): RawTrial[] {
  return [
    t(1, { isCorrect: false, isUnambiguous: true, dimensionUsedIfUnambiguous: 'color', allMatchingDimensions: ['color'] }),
    t(2, { isCorrect: false, isUnambiguous: true, dimensionUsedIfUnambiguous: 'shape', allMatchingDimensions: ['shape'] }),
    t(3, { isCorrect: false, isUnambiguous: true, dimensionUsedIfUnambiguous: 'shape', allMatchingDimensions: ['shape'] }),
    t(4, { isCorrect: false, isUnambiguous: true, dimensionUsedIfUnambiguous: 'shape', allMatchingDimensions: ['shape'] }),
  ];
}

// --- sandwich: chained ambiguous trials (P-A-A-A-P), all should flag. ---
function buildSandwichChain(): RawTrial[] {
  return [
    t(1, { isCorrect: false, isUnambiguous: true, dimensionUsedIfUnambiguous: 'color', allMatchingDimensions: ['color'] }),
    t(2, { isCorrect: false, isUnambiguous: true, dimensionUsedIfUnambiguous: 'color', allMatchingDimensions: ['color'] }),
    t(3, { isCorrect: false, isUnambiguous: false, allMatchingDimensions: ['color', 'shape'] }),
    t(4, { isCorrect: false, isUnambiguous: false, allMatchingDimensions: ['color', 'shape'] }),
    t(5, { isCorrect: false, isUnambiguous: false, allMatchingDimensions: ['color', 'shape'] }),
    t(6, { isCorrect: false, isUnambiguous: true, dimensionUsedIfUnambiguous: 'color', allMatchingDimensions: ['color'] }),
  ];
}

// --- ltlPathB: 2 completed categories + a 12-trial incomplete 3rd attempt. ---
function buildLtlPathB(): RawTrial[] {
  const trials: RawTrial[] = [];
  let n = 0;
  const push = (partial: Partial<RawTrial> & { isCorrect: boolean; isUnambiguous: boolean }) => {
    n++;
    trials.push(t(n, partial));
  };

  for (let i = 0; i < 6; i++) push({ isCorrect: false, isUnambiguous: true, dimensionUsedIfUnambiguous: 'shape', allMatchingDimensions: ['shape'] });
  for (let i = 0; i < 10; i++) push({ isCorrect: true, isUnambiguous: true, dimensionUsedIfUnambiguous: 'color', allMatchingDimensions: ['color'], activeRule: 'color' });
  for (let i = 0; i < 4; i++) push({ isCorrect: false, isUnambiguous: true, dimensionUsedIfUnambiguous: 'color', allMatchingDimensions: ['color'], activeRule: 'shape' });
  for (let i = 0; i < 10; i++) push({ isCorrect: true, isUnambiguous: true, dimensionUsedIfUnambiguous: 'shape', allMatchingDimensions: ['shape'], activeRule: 'shape' });

  // 3rd attempt (number rule): 12 trials, 2 errors, MUST stay incomplete —
  // interleave the errors partway through so no run of 10 consecutive
  // correct ever occurs (a naive "10 correct then errors" ordering would
  // complete the category by accident, as an earlier version of this
  // scenario did).
  for (let i = 0; i < 6; i++) push({ isCorrect: true, isUnambiguous: true, dimensionUsedIfUnambiguous: 'number', allMatchingDimensions: ['number'], activeRule: 'number' });
  push({ isCorrect: false, isUnambiguous: true, dimensionUsedIfUnambiguous: 'color', allMatchingDimensions: ['color'], activeRule: 'number' });
  push({ isCorrect: false, isUnambiguous: true, dimensionUsedIfUnambiguous: 'color', allMatchingDimensions: ['color'], activeRule: 'number' });
  for (let i = 0; i < 4; i++) push({ isCorrect: true, isUnambiguous: true, dimensionUsedIfUnambiguous: 'number', allMatchingDimensions: ['number'], activeRule: 'number' });

  return trials; // categoriesCompleted=2, 3rd attempt has 12 trials (2 errors) -> LTL eligible via Path B
}

// --- ineligible: too few trials/categories -> learningToLearn must be null. ---
function buildIneligible(): RawTrial[] {
  const trials: RawTrial[] = [];
  for (let i = 1; i <= 8; i++) {
    trials.push(t(i, { isCorrect: false, isUnambiguous: true, dimensionUsedIfUnambiguous: 'color', allMatchingDimensions: ['color'] }));
  }
  return trials;
}

// --- perfect: zero errors in every category. Confirms LTL=0 is the correct
// mathematical result (no error-rate variance to measure), not a bug. ---
function buildPerfectPlay(): RawTrial[] {
  const trials: RawTrial[] = [];
  let n = 0;
  const rules: Dimension[] = ['color', 'shape', 'number'];
  rules.forEach((rule) => {
    for (let i = 0; i < 10; i++) {
      n++;
      trials.push(
        t(n, {
          isCorrect: true,
          isUnambiguous: true,
          dimensionUsedIfUnambiguous: rule,
          allMatchingDimensions: [rule],
          activeRule: rule,
        })
      );
    }
  });
  return trials;
}

export const DEBUG_SCENARIOS: Record<string, () => RawTrial[]> = {
  full: buildFullRun,
  ruleOf3: buildRuleOf3Shift,
  sandwich: buildSandwichChain,
  ltlPathB: buildLtlPathB,
  ineligible: buildIneligible,
  perfect: buildPerfectPlay,
};
