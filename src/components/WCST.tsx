"use client";

import React, { useState, useCallback, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Info, Download, Database, CircleAlert as AlertCircle } from 'lucide-react';
import { saveWCSTResult, type WCSTResult } from '@/lib/supabase';

// Stimulus Cards - The four fixed key cards
const STIMULUS_CARDS = [
  { id: 0, color: "red", shape: "triangle", number: 1 },
  { id: 1, color: "green", shape: "star", number: 2 },
  { id: 2, color: "yellow", shape: "cross", number: 3 },
  { id: 3, color: "blue", shape: "circle", number: 4 }
];

// Rules and test criteria
const RULES = ["color", "shape", "number", "color", "shape", "number"];
const CONSECUTIVE_CRITERION = 10;
const MAX_CARDS = 128;

// Standard 64-card deck (will be used twice for 128 total)
const STANDARD_DECK = [
  { id: 'deck1-0', color: "green", shape: "triangle", number: 1 },
  { id: 'deck1-1', color: "red", shape: "cross", number: 4 },
  { id: 'deck1-2', color: "blue", shape: "triangle", number: 2 },
  { id: 'deck1-3', color: "yellow", shape: "star", number: 3 },
  { id: 'deck1-4', color: "red", shape: "triangle", number: 3 },
  { id: 'deck1-5', color: "green", shape: "cross", number: 2 },
  { id: 'deck1-6', color: "blue", shape: "star", number: 1 },
  { id: 'deck1-7', color: "yellow", shape: "circle", number: 4 },
  { id: 'deck1-8', color: "red", shape: "star", number: 2 },
  { id: 'deck1-9', color: "green", shape: "circle", number: 3 },
  { id: 'deck1-10', color: "blue", shape: "cross", number: 4 },
  { id: 'deck1-11', color: "yellow", shape: "triangle", number: 1 },
  { id: 'deck1-12', color: "red", shape: "circle", number: 1 },
  { id: 'deck1-13', color: "green", shape: "star", number: 4 },
  { id: 'deck1-14', color: "blue", shape: "circle", number: 3 },
  { id: 'deck1-15', color: "yellow", shape: "cross", number: 2 },
  { id: 'deck1-16', color: "red", shape: "triangle", number: 4 },
  { id: 'deck1-17', color: "green", shape: "cross", number: 1 },
  { id: 'deck1-18', color: "blue", shape: "star", number: 2 },
  { id: 'deck1-19', color: "yellow", shape: "circle", number: 3 },
  { id: 'deck1-20', color: "red", shape: "star", number: 3 },
  { id: 'deck1-21', color: "green", shape: "circle", number: 4 },
  { id: 'deck1-22', color: "blue", shape: "cross", number: 1 },
  { id: 'deck1-23', color: "yellow", shape: "triangle", number: 2 },
  { id: 'deck1-24', color: "red", shape: "cross", number: 2 },
  { id: 'deck1-25', color: "green", shape: "triangle", number: 3 },
  { id: 'deck1-26', color: "blue", shape: "star", number: 4 },
  { id: 'deck1-27', color: "yellow", shape: "circle", number: 1 },
  { id: 'deck1-28', color: "red", shape: "circle", number: 3 },
  { id: 'deck1-29', color: "green", shape: "star", number: 1 },
  { id: 'deck1-30', color: "blue", shape: "triangle", number: 4 },
  { id: 'deck1-31', color: "yellow", shape: "cross", number: 2 },
  { id: 'deck1-32', color: "red", shape: "star", number: 1 },
  { id: 'deck1-33', color: "green", shape: "cross", number: 4 },
  { id: 'deck1-34', color: "blue", shape: "circle", number: 2 },
  { id: 'deck1-35', color: "yellow", shape: "triangle", number: 3 },
  { id: 'deck1-36', color: "red", shape: "triangle", number: 2 },
  { id: 'deck1-37', color: "green", shape: "circle", number: 1 },
  { id: 'deck1-38', color: "blue", shape: "cross", number: 3 },
  { id: 'deck1-39', color: "yellow", shape: "star", number: 4 },
  { id: 'deck1-40', color: "red", shape: "cross", number: 3 },
  { id: 'deck1-41', color: "green", shape: "triangle", number: 4 },
  { id: 'deck1-42', color: "blue", shape: "star", number: 1 },
  { id: 'deck1-43', color: "yellow", shape: "circle", number: 2 },
  { id: 'deck1-44', color: "red", shape: "circle", number: 4 },
  { id: 'deck1-45', color: "green", shape: "star", number: 3 },
  { id: 'deck1-46', color: "blue", shape: "triangle", number: 1 },
  { id: 'deck1-47', color: "yellow", shape: "cross", number: 2 },
  { id: 'deck1-48', color: "red", shape: "star", number: 4 },
  { id: 'deck1-49', color: "green", shape: "cross", number: 2 },
  { id: 'deck1-50', color: "blue", shape: "circle", number: 1 },
  { id: 'deck1-51', color: "yellow", shape: "triangle", number: 3 },
  { id: 'deck1-52', color: "red", shape: "triangle", number: 1 },
  { id: 'deck1-53', color: "green", shape: "circle", number: 2 },
  { id: 'deck1-54', color: "blue", shape: "cross", number: 4 },
  { id: 'deck1-55', color: "yellow", shape: "star", number: 3 },
  { id: 'deck1-56', color: "red", shape: "cross", number: 1 },
  { id: 'deck1-57', color: "green", shape: "triangle", number: 4 },
  { id: 'deck1-58', color: "blue", shape: "star", number: 3 },
  { id: 'deck1-59', color: "yellow", shape: "circle", number: 2 },
  { id: 'deck1-60', color: "red", shape: "circle", number: 2 },
  { id: 'deck1-61', color: "green", shape: "star", number: 1 },
  { id: 'deck1-62', color: "blue", shape: "triangle", number: 3 },
  { id: 'deck1-63', color: "green", shape: "cross", number: 1 }
];

// Mock results for debug mode
const MOCK_DEBUG_DATA = {
  scores: {
    totalTrials: 128,
    totalCorrect: 78,
    totalErrors: 50,
    categoriesCompleted: 6,
    trialsToFirstCategory: 15,
    conceptualLevelResponses: 65,
    failureToMaintainSet: 2,
    perseverativeResponses: 25,
    perseverativeErrors: 20,
    nonPerseverativeErrors: 30,
    percentErrors: 39.1,
    percentPerseverativeErrors: 40.0,
    percentConceptualLevelResponses: 50.8,
    learningToLearn: 1.54,
  },
  processedResponses: [
    { trial: 1, responseCard: { color: 'green', shape: 'triangle', number: 1 }, stimulusChosen: 1, activeRule: 'color', isCorrect: true, isUnambiguous: true, dimensionUsedIfUnambiguous: 'color', perseverative: false, allMatchingDimensions: ['color', 'shape', 'number'] },
    { trial: 2, responseCard: { color: 'red', shape: 'cross', number: 4 }, stimulusChosen: 0, activeRule: 'color', isCorrect: true, isUnambiguous: true, dimensionUsedIfUnambiguous: 'color', perseverative: false, allMatchingDimensions: ['color'] },
    { trial: 3, responseCard: { color: 'blue', shape: 'triangle', number: 2 }, stimulusChosen: 0, activeRule: 'color', isCorrect: false, isUnambiguous: false, dimensionUsedIfUnambiguous: null, perseverative: true, allMatchingDimensions: ['shape'] },
  ]
};

// Helper functions for perseveration logic (moved to top level)
const getPreviousConsecutiveCorrect = (responses: any[], endIndex: number) => {
  let count = 0;
  for (let i = endIndex; i >= 0 && responses[i].isCorrect; i--) {
    count++;
  }
  return count;
};

const areAllSame = (array: string[]) => {
  return array.every(item => item === array[0]);
};

const checkForInterruption = (responses: any[], startIndex: number, endIndex: number, newTendency: string) => {
  for (let i = startIndex; i < endIndex; i++) {
    const response = responses[i];
    if (response.isUnambiguous && response.dimensionUsedIfUnambiguous !== newTendency) {
      return true;
    }
  }
  return false;
};

// Calculate comprehensive scores with multi-pass approach (moved to top level)
const calculateComprehensiveScores = (allRawResponses: any[]) => {
  const scores: any = {
    totalTrials: allRawResponses.length,
    totalCorrect: 0,
    totalErrors: 0,
    categoriesCompleted: 0,
    trialsToFirstCategory: null,
    conceptualLevelResponses: 0,
    failureToMaintainSet: 0,
    perseverativeResponses: 0,
    perseverativeErrors: 0,
    nonPerseverativeErrors: 0,
    categoryDataForLtL: []
  };

  // Pass 1: Basic scores and category boundaries
  let currentRun = 0;
  let categoryStartIndex = 0;
  
  allRawResponses.forEach((response, index) => {
    if (response.isCorrect) {
      scores.totalCorrect++;
      currentRun++;
      
      if (currentRun === 3) {
        // This is the 3rd consecutive correct response.
        // Add 3 to the score (for the 1st, 2nd, and 3rd responses in the run).
        scores.conceptualLevelResponses += 3;
      } else if (currentRun > 3) {
        // This is the 4th, 5th, etc., consecutive correct response.
        // Add 1 for each additional response.
        scores.conceptualLevelResponses++;
      }
      
      if (currentRun === CONSECUTIVE_CRITERION) {
        // Category completed
        scores.categoriesCompleted++;
        if (scores.categoriesCompleted === 1) {
          scores.trialsToFirstCategory = index + 1;
        }
        
        const totalTrials = index - categoryStartIndex + 1;
        scores.categoryDataForLtL.push({
          categoryNumber: scores.categoriesCompleted,
          startIndex: categoryStartIndex,
          endIndex: index,
          totalTrials: totalTrials,
          errorCount: 0
        });
        
        categoryStartIndex = index + 1;
        currentRun = 0;
      }
    } else {
      scores.totalErrors++;
      
      if (currentRun >= 5 && currentRun <= 9) {
        scores.failureToMaintainSet++;
      }
      
      currentRun = 0;
    }
  });

  // Pass 2: Category-specific error counts
  scores.categoryDataForLtL.forEach((category: any) => {
    for (let i = category.startIndex; i <= category.endIndex; i++) {
      if (!allRawResponses[i].isCorrect) {
        category.errorCount++;
      }
    }
  });

  // Pass 3: Perseveration scoring
  const processedResponses = allRawResponses.map(r => ({ ...r }));
  let perseverativeTendency: string | null = null;
  let firstUnambiguousErrorFound = false;
  let unambiguousErrorHistory: string[] = [];

  // Sub-pass 3a: Unambiguous errors
  processedResponses.forEach((response, index) => {
    // Rule 2: Check for category completion
    if (index > 0 && processedResponses[index - 1].isCorrect) {
      const prevConsecutive = getPreviousConsecutiveCorrect(processedResponses, index - 1);
      if (prevConsecutive === CONSECUTIVE_CRITERION) {
        perseverativeTendency = processedResponses[index - 1].activeRule;
        unambiguousErrorHistory = [];
      }
    }

    if (!response.isCorrect && response.isUnambiguous) {
      const dimension = response.dimensionUsedIfUnambiguous;
      
      if (!firstUnambiguousErrorFound) {
        // Rule 1: First unambiguous error sets tendency
        perseverativeTendency = dimension;
        firstUnambiguousErrorFound = true;
      } else {
        // Rule 3: Check for shift pattern
        unambiguousErrorHistory.push(dimension);
        
        if (unambiguousErrorHistory.length >= 3) {
          const last3 = unambiguousErrorHistory.slice(-3);
          if (areAllSame(last3) && last3[0] !== perseverativeTendency) {
            // Check for interruption
            const hasInterruption = checkForInterruption(processedResponses, index - 2, index, last3[0]);
            
            if (!hasInterruption) {
              perseverativeTendency = last3[0];
              // FIX: Mark ALL THREE responses as perseverative
              if (index >= 2) {
                processedResponses[index - 2].perseverative = true;
                processedResponses[index - 1].perseverative = true;
              }
              processedResponses[index].perseverative = true;
            }
          }
        }
        
        // Standard perseveration check
        if (dimension === perseverativeTendency && !processedResponses[index].perseverative) {
          processedResponses[index].perseverative = true;
        }
      }
    }
  });

  // Sub-pass 3b: Ambiguous errors (sandwich rule)
  processedResponses.forEach((response, index) => {
    if (!response.isUnambiguous && perseverativeTendency) {
      if (response.allMatchingDimensions.includes(perseverativeTendency)) {
        const prev = index > 0 ? processedResponses[index - 1] : null;
        const next = index < processedResponses.length - 1 ? processedResponses[index + 1] : null;
        
        if (prev?.perseverative && next?.perseverative) {
          response.perseverative = true;
        }
      }
    }
  });

  // Pass 4: Final aggregation
  processedResponses.forEach(response => {
    if (response.perseverative) {
      scores.perseverativeResponses++;
      if (!response.isCorrect) {
        scores.perseverativeErrors++;
      }
    }
  });

  scores.nonPerseverativeErrors = scores.totalErrors - scores.perseverativeErrors;

  // Calculate percentages
  scores.percentErrors = (scores.totalErrors / scores.totalTrials) * 100;
  scores.percentPerseverativeResponses = (scores.perseverativeResponses / scores.totalTrials) * 100;
  scores.percentPerseverativeErrors = scores.totalErrors > 0 ? (scores.perseverativeErrors / scores.totalErrors) * 100 : 0;
  scores.percentNonPerseverativeErrors = scores.totalErrors > 0 ? (scores.nonPerseverativeErrors / scores.totalErrors) * 100 : 0;
  scores.percentConceptualLevelResponses = (scores.conceptualLevelResponses / scores.totalTrials) * 100;

// --- REFINED LTL CALCULATION ---
  const LTLData = scores.categoryDataForLtL;
  scores.learningToLearn = null;

  // FIX: Restore strict Heaton eligibility criteria for LTL
  // Must have 3+ completed categories, OR 2 completed + >=10 trials in the 3rd attempt
  const isLTLEligible = scores.categoriesCompleted >= 3 || 
                       (scores.categoriesCompleted === 2 && LTLData[2] && LTLData[2].totalTrials >= 10);

  if (isLTLEligible) {
    const errorPercentages = LTLData
      .filter((cat: any) => cat.totalTrials > 0) 
      .map((cat: any) => (cat.errorCount / cat.totalTrials) * 100);

    if (errorPercentages.length >= 2) {
      const differences = [];
      for (let i = 1; i < errorPercentages.length; i++) {
        differences.push(errorPercentages[i - 1] - errorPercentages[i]);
      }
      
      if (differences.length > 0) {
        const sumOfDifferences = differences.reduce((sum, val) => sum + val, 0);
        scores.learningToLearn = parseFloat((sumOfDifferences / differences.length).toFixed(2));
      }
    }
  }

  return { scores, processedResponses };
};

interface WCSTProps {
  onComplete?: (data: any) => void;
}

export default function WCST({ onComplete }: WCSTProps) {
  // Create double deck for 128 cards
  const createResponseDeck = () => {
    const secondDeck = STANDARD_DECK.map(card => ({
      ...card,
      id: card.id.replace('deck1-', 'deck2-')
    }));
    return [...STANDARD_DECK, ...secondDeck];
  };

  // Main state management
  const [responseDeck, setResponseDeck] = useState(() => createResponseDeck());
  const [currentCard, setCurrentCard] = useState(() => responseDeck[0]);
  const [responses, setResponses] = useState<any[]>([]);
  const [completed, setCompleted] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [showInstructions, setShowInstructions] = useState(true);
  const [finalScores, setFinalScores] = useState<any>({});
  const [finalProcessedResponses, setFinalProcessedResponses] = useState<any[]>([]);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [participantId, setParticipantId] = useState<string>('');

  // Live test state
  const [currentRuleIndex, setCurrentRuleIndex] = useState(0);
  const [consecutiveCorrect, setConsecutiveCorrect] = useState(0);
  const [categoriesCompleted, setCategoriesCompleted] = useState(0);

  // --- Debug Mode Initialization (for Create React App) ---
  useEffect(() => {
    // Read URL parameters from the window object
    const searchParams = new URLSearchParams(window.location.search);
    const isDebugMode = searchParams.get('debug') === 'true';

    if (isDebugMode) {
      console.log("DEBUG MODE: Skipping to completion screen with mock data.");
      // Set state to immediately show the completion screen
      setFinalScores(MOCK_DEBUG_DATA.scores);
      setFinalProcessedResponses(MOCK_DEBUG_DATA.processedResponses);
      setCompleted(true);
      setShowInstructions(false); // Hide instructions
    }
  }, []); // The empty dependency array ensures this runs only once on mount

  // Helper function to render card symbols with proper positioning
  const renderCardSymbols = (card: any, size = 'w-8 h-8') => {
    const { color, shape, number } = card;
    
    const getShapeSymbol = (shape: string) => {
      switch (shape) {
        case 'triangle': return '▲';
        case 'star': return '★';
        case 'cross': return '+';
        case 'circle': return '●';
        default: return '●';
      }
    };

    const getColorClass = (color: string) => {
      switch (color) {
        case 'red': return 'text-red-500';
        case 'green': return 'text-green-500';
        case 'yellow': return 'text-yellow-500';
        case 'blue': return 'text-blue-500';
        default: return 'text-gray-500';
      }
    };

    let sizeClass = 'text-5xl'; // Default size for thin shapes (star, cross)
    if (shape === 'cross') {
      sizeClass = 'text-6xl'; // Use a smaller size for bulky shapes
    }
    
    const symbol = getShapeSymbol(shape);
    const colorClass = getColorClass(color);

    const symbols = [];
    for (let i = 0; i < number; i++) {
      symbols.push(
        <div key={i} className={`${size} ${colorClass} flex items-center justify-center ${sizeClass}  absolute font-bold`}>
          {symbol}
        </div>
      );
    }

    // Position symbols based on number
    const positionClasses = [
      [], // 0 (not used)
      ['top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2'], // 1: center
      ['top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2', 'bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2'], // 2: diagonal
      [
       'bottom-2 left-1/2 -translate-x-1/2',
       'top-2 left-0 -translate-x-0',
       'top-2 right-0 -translate-x-0'
      ], // 3: triangle
      ['top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2', 'top-1/4 right-1/4 translate-x-1/2 -translate-y-1/2', 'bottom-1/4 left-1/4 -translate-x-1/2 translate-y-1/2', 'bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2'] // 4: square
    ];

    return (
      <div className="relative w-full h-24">
        {symbols.map((symbol, index) => 
          React.cloneElement(symbol, {
            className: `${symbol.props.className} ${positionClasses[number][index] || ''}`
          })
        )}
      </div>
    );
  };

  // Core logic for handling card selection
  const handleCardSelection = useCallback((chosenStimulusId: number) => {
    if (completed || feedback) return;

    const currentRule = RULES[currentRuleIndex];
    const stimulusCard = STIMULUS_CARDS[chosenStimulusId];
    
    // Determine correctness and matching dimensions
    const isCorrect = currentCard[currentRule] === stimulusCard[currentRule];
    
    const allMatchingDimensions = [];
    if (currentCard.color === stimulusCard.color) allMatchingDimensions.push('color');
    if (currentCard.shape === stimulusCard.shape) allMatchingDimensions.push('shape');
    if (currentCard.number === stimulusCard.number) allMatchingDimensions.push('number');
    
    const isUnambiguous = allMatchingDimensions.length === 1;
    const dimensionUsedIfUnambiguous = isUnambiguous ? allMatchingDimensions[0] : null;

    // Create response data
    const responseData = {
      trial: responses.length + 1,
      responseCard: { ...currentCard },
      stimulusChosen: chosenStimulusId,
      activeRule: currentRule,
      isCorrect,
      isUnambiguous,
      dimensionUsedIfUnambiguous,
      allMatchingDimensions: [...allMatchingDimensions],
      perseverative: false // Will be calculated later
    };

    // Update live counters
    if (isCorrect) {
      const newConsecutiveCorrect = consecutiveCorrect + 1;
      setConsecutiveCorrect(newConsecutiveCorrect);
      
      if (newConsecutiveCorrect === CONSECUTIVE_CRITERION) {
        // Category completed
        const newCategoriesCompleted = categoriesCompleted + 1;
        setCategoriesCompleted(newCategoriesCompleted);
        setCurrentRuleIndex((currentRuleIndex + 1) % RULES.length);
        setConsecutiveCorrect(0);
        
        if (newCategoriesCompleted === 6) {
          // Test complete
          const finalResponses = [...responses, responseData];
          setResponses(finalResponses);
          finishTest(finalResponses);
          return;
        }
      }
    } else {
      setConsecutiveCorrect(0);
    }

    // Add response and show feedback
    const newResponses = [...responses, responseData];
    setResponses(newResponses);
    setFeedback(isCorrect ? 'נכון' : 'לא נכון');

    // Clear feedback and advance to next card
    setTimeout(() => {
      setFeedback(null);
      const newDeck = responseDeck.slice(1);
      
      if (newDeck.length === 0) {
        finishTest(newResponses);
      } else {
        setResponseDeck(newDeck);
        setCurrentCard(newDeck[0]);
      }
    }, 1500);
  }, [completed, feedback, currentCard, currentRuleIndex, consecutiveCorrect, categoriesCompleted, responses, responseDeck]);

  // Save results to database
  const saveToDatabase = async (scores: any, processedResponses: any[]) => {
    setSaveStatus('saving');
    
    try {
      const wcstResult: WCSTResult = {
        participant_id: participantId || null,
        test_date: new Date().toISOString().split('T')[0],
        total_trials: scores.totalTrials,
        total_correct: scores.totalCorrect,
        total_errors: scores.totalErrors,
        categories_completed: scores.categoriesCompleted,
        trials_to_first_category: scores.trialsToFirstCategory,
        conceptual_level_responses: scores.conceptualLevelResponses,
        failure_to_maintain_set: scores.failureToMaintainSet,
        perseverative_responses: scores.perseverativeResponses,
        perseverative_errors: scores.perseverativeErrors,
        nonperseverative_errors: scores.nonPerseverativeErrors,
        percent_errors: scores.percentErrors,
        percent_perseverative_responses: scores.percentPerseverativeResponses,
        percent_perseverative_errors: scores.percentPerseverativeErrors,
        percent_nonperseverative_errors: scores.percentNonPerseverativeErrors,
        percent_conceptual_level_responses: scores.percentConceptualLevelResponses,
        learning_to_learn: typeof scores.learningToLearn === 'number' ? scores.learningToLearn : null,
        raw_responses: processedResponses
      };

      const result = await saveWCSTResult(wcstResult);
      
      if (result.success) {
        setSaveStatus('saved');
      } else {
        setSaveStatus('error');
        console.error('Failed to save results:', result.error);
      }
    } catch (error) {
      setSaveStatus('error');
      console.error('Error in saveToDatabase:', error);
    }
  };

  // Finish test and calculate scores
  const finishTest = (finalRawResponses: any[]) => {
    try { 
      setCompleted(true);
      const { scores, processedResponses } = calculateComprehensiveScores(finalRawResponses);
      setFinalScores(scores);
      setFinalProcessedResponses(processedResponses);
      
      saveToDatabase(scores, processedResponses);
      
      if (onComplete) {
        onComplete({
          raw_data: { responses: processedResponses },
          scores
        });
      }
    } catch (error) { 
      console.error("Critical error in finishTest:", error);
      // You could even set a state here to show a critical error message to the user
      setSaveStatus('error'); 
    }
  };

  // Export to CSV with enhanced data
  const exportToCSV = () => {
    const headers = [
      "Trial",
      "Response Color",
      "Response Shape", 
      "Response Number",
      "Stimulus Chosen (ID)",
      "Active Rule",
      "Correct (1=Y | 0=N)",
      "Unambiguous (1=Y | 0=N)",
      "Dimension Used (if Unambiguous)",
      "Perseverative (1=Y | 0=N)",
      "All Matching Dimensions"
    ];

    // Add summary scores at the top
    const summaryRows = [
      ["WCST RESULTS SUMMARY"],
      [""],
      ["Metric", "Value"],
      ["Total Trials", finalScores.totalTrials],
      ["Total Correct", finalScores.totalCorrect],
      ["Total Errors", finalScores.totalErrors],
      ["Percent Errors", `${finalScores.percentErrors?.toFixed(1)}%`],
      ["Categories Completed", finalScores.categoriesCompleted],
      ["Trials to First Category", finalScores.trialsToFirstCategory || 'N/A'],
      ["Conceptual Level Responses", finalScores.conceptualLevelResponses],
      ["Percent Conceptual Level Responses", `${finalScores.percentConceptualLevelResponses?.toFixed(1)}%`],
      ["Perseverative Responses", finalScores.perseverativeResponses],
      ["Percent Perseverative Responses", `${finalScores.percentPerseverativeResponses?.toFixed(1)}%`],
      ["Perseverative Errors", finalScores.perseverativeErrors],
      ["Percent Perseverative Errors", `${finalScores.percentPerseverativeErrors?.toFixed(1)}%`],
      ["Non-perseverative Errors", finalScores.nonPerseverativeErrors],
      ["Percent Non-perseverative Errors", `${finalScores.percentNonPerseverativeErrors?.toFixed(1)}%`],
      ["Failure to Maintain Set", finalScores.failureToMaintainSet],
      ["Learning to Learn", typeof finalScores.learningToLearn === 'number' ? finalScores.learningToLearn.toFixed(2) : finalScores.learningToLearn || 'N/A'],
      [""],
      ["RAW TRIAL DATA"],
      [""]
    ];

    const csvContent = [
      ...summaryRows.map(row => row.join(',')),
      headers.join(','),
      ...finalProcessedResponses.map(response => [
        response.trial,
        response.responseCard.color,
        response.responseCard.shape,
        response.responseCard.number,
        response.stimulusChosen,
        response.activeRule,
        response.isCorrect ? 1 : 0,
        response.isUnambiguous ? 1 : 0,
        response.dimensionUsedIfUnambiguous || '',
        response.perseverative ? 1 : 0,
        (response.allMatchingDimensions || []).join(';')
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `wcst_results_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Instructions view
  if (showInstructions) {
    return (
      <div className="min-h-screen w-full bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="max-w-3xl p-10 shadow-2xl border-0 bg-white/95 backdrop-blur-sm">
          <div className="flex items-center gap-4 mb-8">
            <div className="p-3 bg-blue-100 rounded-full">
              <Info className="w-8 h-8 text-blue-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-800">Wisconsin Card Sorting Test</h1>
          </div>
          
          <div className="space-y-6 leading-relaxed text-right text-gray-800 text-lg" dir="rtl">
            <p>
              המבחן שאעביר לך עכשיו הוא קצת לא רגיל, כי אני לא הולך לתת לך הרבה מידע על מה שצריך לעשות.
            </p>

            <div className="space-y-4">
              <p>
                המשימה שלך היא להתאים את הקלף שיופיע במרכז המסך לאחד מארבעת הקלפים בשורה העליונה.
              </p>
              <p>
                בכל פעם, עליך לבחור את הקלף שלדעתך הוא הקלף המתאים לו.
              </p>
              <p>
                אני לא יכול להגיד לך לפי איזה עיקרון צריך להתאים את הקלפים, אבל אחרי כל קלף, אני אגיד לך אם עשית זאת 'נכון' או 'לא נכון
              </p>
              <p>
                אין הגבלת זמן למבחן הזה.
              </p>
            </div>

            <div className="bg-blue-50 p-6 rounded-lg border-r-4 border-blue-400">
              <p className="font-semibold">
                לחץ על "Start Test" כשאתה מוכן להתחיל.
              </p>
            </div>
          </div>

          <div className="mt-8 space-y-4">
            <div>
              <label htmlFor="participantId" className="block text-sm font-medium text-gray-700 mb-2">
                Participant ID (optional):
              </label>
              <input
                type="text"
                id="participantId"
                value={participantId}
                onChange={(e) => setParticipantId(e.target.value)}
                placeholder="Enter participant identifier"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            <div className="text-center">
              <Button 
                onClick={() => setShowInstructions(false)}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-12 py-4 text-xl font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
              >
                Start Test
              </Button>
            </div>
          </div>
        </Card>
      </div>
    );
  }

// Completion view
if (completed) {
  return (
    <div className="fixed inset-0 bg-gradient-to-br from-emerald-50 via-green-50 to-teal-100 overflow-y-auto flex justify-center items-start p-4 py-8 md:py-12">
      
      <div className="w-full max-w-6xl mx-auto">
        <Card className="p-8 shadow-2xl border-0 bg-white/95 backdrop-blur-sm">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-4">
              <div className="text-4xl">🎉</div>
            </div>
            <h1 className="text-4xl font-bold text-gray-800 mb-2">Test Completed!</h1>
            <p className="text-xl text-gray-600">Congratulations on completing the Wisconsin Card Sorting Test</p>
            
            {/* Database save status */}
            <div className="mt-4 flex items-center justify-center gap-2">
              {saveStatus === 'saving' && (
                <>
                  <Database className="w-5 h-5 text-blue-500 animate-spin" />
                  <span className="text-blue-600">Saving results to database...</span>
                </>
              )}
              {saveStatus === 'saved' && (
                <>
                  <Database className="w-5 h-5 text-green-500" />
                  <span className="text-green-600">Results saved successfully!</span>
                </>
              )}
              {saveStatus === 'error' && (
                <>
                  <AlertCircle className="w-5 h-5 text-red-500" />
                  <span className="text-red-600">Failed to save to database (check console for details)</span>
                </>
              )}
            </div>
          </div>
          
          <div className="grid md:grid-cols-2 gap-x-12 gap-y-8 mb-10">
            {/* COLUMN 1 */}
            <div className="space-y-3">
              <div className="flex justify-between items-baseline p-2 border-b"><span className="text-gray-600">Number of trials</span><span className="font-bold text-lg">{finalScores.totalTrials || 0}</span></div>
              <div className="flex justify-between items-baseline p-2 border-b"><span className="text-gray-600">Number correct</span><span className="font-bold text-lg text-green-600">{finalScores.totalCorrect || 0}</span></div>
              <div className="flex justify-between items-baseline p-2 border-b"><span className="text-gray-600">Total Number of Errors</span><span className="font-bold text-lg text-red-600">{finalScores.totalErrors || 0}</span></div>
              <div className="flex justify-between items-baseline p-2 border-b"><span className="text-gray-600">Percent errors</span><span className="font-bold text-lg text-red-600">{finalScores.percentErrors?.toFixed(1) || '0.0'}%</span></div>
              <div className="flex justify-between items-baseline p-2 border-b"><span className="text-gray-600">Perseverative responses</span><span className="font-bold text-lg text-orange-500">{finalScores.perseverativeResponses || 0}</span></div>
              <div className="flex justify-between items-baseline p-2 border-b"><span className="text-gray-600">Percent of perseverative responses</span><span className="font-bold text-lg text-orange-500">{finalScores.percentPerseverativeResponses?.toFixed(1) || '0.0'}%</span></div>
              <div className="flex justify-between items-baseline p-2 border-b"><span className="text-gray-600">Perseverative errors</span><span className="font-bold text-lg text-orange-600">{finalScores.perseverativeErrors || 0}</span></div>
              <div className="flex justify-between items-baseline p-2 border-b"><span className="text-gray-600">Percent of perseverative errors</span><span className="font-bold text-lg text-orange-600">{finalScores.percentPerseverativeErrors?.toFixed(1) || '0.0'}%</span></div>
              <div className="flex justify-between items-baseline p-2 border-b"><span className="text-gray-600">Nonperseverative errors</span><span className="font-bold text-lg text-red-500">{finalScores.nonPerseverativeErrors || 0}</span></div>
              <div className="flex justify-between items-baseline p-2 border-b"><span className="text-gray-600">Percent of Nonperseverative errors</span><span className="font-bold text-lg text-red-500">{finalScores.percentNonPerseverativeErrors?.toFixed(1) || '0.0'}%</span></div>
            </div>
            {/* COLUMN 2 */}
            <div className="space-y-3">
              <div className="flex justify-between items-baseline p-2 border-b"><span className="text-gray-600">Categories completed</span><span className="font-bold text-lg text-purple-600">{finalScores.categoriesCompleted || 0}</span></div>
              <div className="flex justify-between items-baseline p-2 border-b"><span className="text-gray-600">Trials to complete first category</span><span className="font-bold text-lg text-indigo-600">{finalScores.trialsToFirstCategory || 'N/A'}</span></div>
              <div className="flex justify-between items-baseline p-2 border-b"><span className="text-gray-600">Failures to maintain set</span><span className="font-bold text-lg text-yellow-600">{finalScores.failureToMaintainSet || 0}</span></div>
              <div className="flex justify-between items-baseline p-2 border-b"><span className="text-gray-600">Percent of conceptual level responses</span><span className="font-bold text-lg text-blue-600">{finalScores.percentConceptualLevelResponses?.toFixed(1) || '0.0'}%</span></div>
              <div className="flex justify-between items-baseline p-2 border-b">
                <span className="text-gray-600">Learning-to-learn score</span>
                <span className="font-bold text-lg text-teal-600">
                  {finalScores.learningToLearn !== null && finalScores.learningToLearn !== undefined 
                    ? (typeof finalScores.learningToLearn === 'number' ? finalScores.learningToLearn.toFixed(2) : finalScores.learningToLearn)
                    : 'N/A'
                  }
                </span>
              </div>
            </div>
          </div>

          <div className="text-center">
            <Button onClick={exportToCSV} className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-8 py-4 text-lg font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"><Download className="w-5 h-5 mr-3" />Export Complete Results to CSV</Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
  
// Main test view - Perfectly centered using modern Flexbox
return (
  <div className="fixed inset-0 bg-gradient-to-br from-slate-50 via-gray-50 to-blue-50 flex items-center justify-center overflow-hidden">
    {/* The content is now a direct child of the flex container */}
    <div className="flex flex-col items-center space-y-20">
      
      {/* Stimulus Cards - Top row */}
      <div className="grid grid-cols-4 gap-8">
        {STIMULUS_CARDS.map((card) => (
          <Card 
            key={card.id}
            className={`p-6 cursor-pointer transition-all duration-300 hover:shadow-xl hover:scale-105 h-40 w-36 bg-white border-2 border-gray-200 hover:border-blue-400 ${
              feedback ? 'pointer-events-none opacity-60' : 'hover:bg-blue-50'
            }`}
            onClick={() => handleCardSelection(card.id)}
          >
            <div className="flex items-center justify-center h-full">
              {renderCardSymbols(card)}
            </div>
          </Card>
        ))}
      </div>

      {/* Current Response Card - Bottom center */}
      <div className="w-36">
        <Card className="p-6 relative h-40 bg-white border-2 border-gray-300 shadow-xl">
          <div className="flex items-center justify-center h-full">
            {renderCardSymbols(currentCard)}
          </div>

          {feedback && (
            <div className={`absolute inset-0 flex items-center justify-center rounded-lg backdrop-blur-sm ${
              feedback === 'נכון' ? 'bg-green-100/90' : 'bg-red-100/90'
            }`}>
              <div className={`text-3xl font-bold px-6 py-3 rounded-xl shadow-lg transform scale-105 ${
                feedback === 'נכון' 
                  ? 'text-green-800 bg-green-200 border-2 border-green-400' 
                  : 'text-red-800 bg-red-200 border-2 border-red-400'
              }`}>
                {feedback}
              </div>
            </div>
          )}
        </Card>
      </div>

    </div>
  </div>
);
}