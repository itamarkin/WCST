"use client";

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Info, Download, Database, CircleAlert as AlertCircle } from 'lucide-react';
import { saveWCSTResult, type WCSTResult } from '@/lib/supabase';
import {
  STIMULUS_CARDS,
  createResponseDeck,
} from '@/lib/wcst/cards';
import {
  administerTrial,
  createInitialEngineState,
  type EngineState,
} from '@/lib/wcst/wcstEngine';
import { scoreWCST } from '@/lib/wcst/wcstScoring';
import type { RawTrial } from '@/lib/wcst/wcstTypes';

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
    percentPerseverativeResponses: 19.5,
    percentPerseverativeErrors: 40.0,
    percentNonPerseverativeErrors: 60.0,
    percentConceptualLevelResponses: 50.8,
    learningToLearn: 1.54,
  },
  processedResponses: [
    { trialNumber: 1, isCorrect: true, perseverative: false, tendencyAtTrial: null },
    { trialNumber: 2, isCorrect: true, perseverative: false, tendencyAtTrial: null },
    { trialNumber: 3, isCorrect: false, perseverative: true, tendencyAtTrial: 'color' },
  ],
};

interface WCSTProps {
  onComplete?: (data: any) => void;
}

export default function WCST({ onComplete }: WCSTProps) {
  // Deck and trial collection state
  const [responseDeck, setResponseDeck] = useState(() => createResponseDeck());
  const [currentCard, setCurrentCard] = useState(() => responseDeck[0]);
  const [responses, setResponses] = useState<RawTrial[]>([]);
  const [completed, setCompleted] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [showInstructions, setShowInstructions] = useState(true);
  const [finalScores, setFinalScores] = useState<any>({});
  const [finalProcessedResponses, setFinalProcessedResponses] = useState<any[]>([]);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [participantId, setParticipantId] = useState<string>('');

  // Engine state drives rule sequence / category completion. Kept in a ref so
  // the callback closure always reads the latest value without stale state.
  const engineRef = useRef<EngineState>(createInitialEngineState());

  // --- Debug Mode Initialization ---
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const isDebugMode = searchParams.get('debug') === 'true';

    if (isDebugMode) {
      console.log("DEBUG MODE: Skipping to completion screen with mock data.");
      setFinalScores(MOCK_DEBUG_DATA.scores);
      setFinalProcessedResponses(MOCK_DEBUG_DATA.processedResponses);
      setCompleted(true);
      setShowInstructions(false);
    }
  }, []);

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

    let sizeClass = 'text-5xl';
    if (shape === 'cross') {
      sizeClass = 'text-6xl';
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

    const positionClasses = [
      [],
      ['top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2'],
      ['top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2', 'bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2'],
      [
        'bottom-2 left-1/2 -translate-x-1/2',
        'top-2 left-0 -translate-x-0',
        'top-2 right-0 -translate-x-0'
      ],
      ['top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2', 'top-1/4 right-1/4 translate-x-1/2 -translate-y-1/2', 'bottom-1/4 left-1/4 -translate-x-1/2 translate-y-1/2', 'bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2']
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

  // Core logic for handling card selection. The component only collects raw
  // trial data via the engine; all scoring happens later in scoreWCST.
  const handleCardSelection = useCallback((chosenStimulusId: number) => {
    if (completed || feedback) return;

    const stimulusCard = STIMULUS_CARDS[chosenStimulusId];
    const state = engineRef.current;
    const trialNumber = responses.length + 1;

    // Engine builds the raw trial and advances state (rule/category logic).
    const { trial, state: nextState, testFinishedThisTrial } =
      administerTrial(currentCard, chosenStimulusId, stimulusCard, state, trialNumber);

    engineRef.current = nextState;
    const newResponses = [...responses, trial];
    setResponses(newResponses);

    if (testFinishedThisTrial) {
      finishTest(newResponses);
      return;
    }

    setFeedback(trial.isCorrect ? 'נכון' : 'לא נכון');

    // Clear feedback and advance to next card
    setTimeout(() => {
      setFeedback(null);
      setResponseDeck((prevDeck) => {
        const newDeck = prevDeck.slice(1);
        if (newDeck.length === 0) {
          finishTest(newResponses);
          return prevDeck;
        }
        setCurrentCard(newDeck[0]);
        return newDeck;
      });
    }, 1500);
  }, [completed, feedback, currentCard, responses]);

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

  // Finish test: score the raw trials deterministically (no React state used).
  const finishTest = (finalRawResponses: RawTrial[]) => {
    try {
      setCompleted(true);
      const scores = scoreWCST(finalRawResponses);
      setFinalScores(scores);
      setFinalProcessedResponses(scores.processedResponses);

      saveToDatabase(scores, scores.processedResponses);

      if (onComplete) {
        onComplete({
          raw_data: { responses: scores.processedResponses },
          scores
        });
      }
    } catch (error) {
      console.error("Critical error in finishTest:", error);
      setSaveStatus('error');
    }
  };

  // Export to CSV with enhanced data
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
                <div className="flex justify-between items-baseline p-2 border-b"><span className="text-gray-600">Categories completed</span><span className="font-bold text-lg text-teal-600">{finalScores.categoriesCompleted || 0}</span></div>
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
              onClick={() => handleCardSelection(card.id as number)}
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
