import React, {useEffect, useMemo, useState} from 'react';
import {CheckCircle2, Clock, RotateCcw, XCircle} from 'lucide-react';
import {TRIAGE_QUESTIONS} from '../data/triageQuiz';
import {pickText} from '../i18n/helpers';
import type {UiStrings} from '../i18n/uiStrings';
import type {AgeGroup, LangCode, ProtocolId, TriageQuestion} from '../types';

interface DrillModeProps {
  lang: LangCode;
  ui: UiStrings;
  onRecordAnswer: (opts: {
    itemId: string;
    protocolId: ProtocolId;
    ageGroup: AgeGroup;
    isCorrect: boolean;
    xpDelta: number;
  }) => void;
}

export const DrillMode: React.FC<DrillModeProps> = ({
  lang,
  ui,
  onRecordAnswer,
}) => {
  const [timerMode, setTimerMode] = useState<0 | 10 | 20>(20);
  const [ageFilter, setAgeFilter] = useState<'all' | AgeGroup>('all');
  const [qIdx, setQIdx] = useState(0);
  const [selectedOpt, setSelectedOpt] = useState<number | null>(null);
  const [timedOut, setTimedOut] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number>(20);
  const [correctCount, setCorrectCount] = useState(0);
  const [finished, setFinished] = useState(false);

  const deck: TriageQuestion[] = useMemo(() => {
    const filtered =
      ageFilter === 'all'
        ? TRIAGE_QUESTIONS
        : TRIAGE_QUESTIONS.filter((q) => q.ageGroup === ageFilter);
    return filtered.length > 0 ? filtered : TRIAGE_QUESTIONS;
  }, [ageFilter]);

  const currentQ = deck[qIdx] ?? deck[0];

  useEffect(() => {
    if (timerMode === 0 || selectedOpt !== null || timedOut || finished) {
      return;
    }
    const id = window.setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setTimedOut(true);
          onRecordAnswer({
            itemId: currentQ.id,
            protocolId: currentQ.protocolId,
            ageGroup: currentQ.ageGroup,
            isCorrect: false,
            xpDelta: 2,
          });
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => window.clearInterval(id);
  }, [timerMode, selectedOpt, timedOut, finished, currentQ, onRecordAnswer]);

  const resetSession = (nextTimer = timerMode, nextAge = ageFilter) => {
    setTimerMode(nextTimer);
    setAgeFilter(nextAge);
    setQIdx(0);
    setSelectedOpt(null);
    setTimedOut(false);
    setTimeLeft(nextTimer);
    setCorrectCount(0);
    setFinished(false);
  };

  const handleSelectOption = (idx: number) => {
    if (selectedOpt !== null || timedOut) return;
    setSelectedOpt(idx);
    const isCorrect = idx === currentQ.correctIndex;
    if (isCorrect) {
      setCorrectCount((c) => c + 1);
    }
    onRecordAnswer({
      itemId: currentQ.id,
      protocolId: currentQ.protocolId,
      ageGroup: currentQ.ageGroup,
      isCorrect,
      xpDelta: isCorrect ? 15 : 4,
    });
  };

  const handleNext = () => {
    if (qIdx + 1 < deck.length) {
      setQIdx((i) => i + 1);
      setSelectedOpt(null);
      setTimedOut(false);
      setTimeLeft(timerMode);
    } else {
      setFinished(true);
    }
  };

  const ageLabel =
    currentQ.ageGroup === 'adult'
      ? ui.ageAdult
      : currentQ.ageGroup === 'child'
      ? ui.ageChild
      : ui.ageInfant;

  const isRevealed = selectedOpt !== null || timedOut;
  const accuracy = deck.length > 0 ? Math.round((correctCount / deck.length) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Toolbar: Timer + Age Filter */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-4">
        <div className="flex flex-wrap items-center gap-1.5 rounded-lg bg-slate-100 p-1">
          {(
            [
              {val: 10 as const, label: ui.drillTimerTimed10},
              {val: 20 as const, label: ui.drillTimerTimed20},
              {val: 0 as const, label: ui.drillTimerUntimed},
            ]
          ).map((item) => (
            <button
              key={item.val}
              type="button"
              onClick={() => resetSession(item.val, ageFilter)}
              className={`whitespace-nowrap shrink-0 rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${
                timerMode === item.val
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-1.5 rounded-lg bg-slate-100 p-1">
          {(['all', 'adult', 'child', 'infant'] as const).map((age) => {
            const label =
              age === 'all'
                ? 'All'
                : age === 'adult'
                ? ui.ageAdult
                : age === 'child'
                ? ui.ageChild
                : ui.ageInfant;
            return (
              <button
                key={age}
                type="button"
                onClick={() => resetSession(timerMode, age)}
                className={`whitespace-nowrap shrink-0 rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${
                  ageFilter === age
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {!finished ? (
        <div className="mx-auto max-w-3xl rounded-xl border border-slate-200 bg-white p-6">
          <div className="flex items-center justify-between gap-4 border-b border-slate-100 pb-3">
            <div className="text-xs font-semibold text-slate-500 tabular-nums">
              {ui.drillQuestionCounter} {qIdx + 1} / {deck.length} ·{' '}
              <span className="text-blue-700">{ageLabel}</span>
            </div>

            {timerMode > 0 && (
              <div
                className={`inline-flex items-center gap-1.5 text-xs font-bold tabular-nums ${
                  timeLeft <= 5 ? 'text-red-600' : 'text-slate-700'
                }`}
              >
                <Clock className="h-4 w-4" />
                <span>{timeLeft}s</span>
              </div>
            )}
          </div>

          <h3 className="mt-5 font-display text-lg font-bold text-slate-900 leading-snug">
            {pickText(currentQ.prompt, lang)}
          </h3>

          <div className="mt-5 grid gap-3">
            {currentQ.options.map((opt, idx) => {
              let cls =
                'border-slate-200 bg-white text-slate-800 hover:border-slate-300 hover:bg-slate-50';
              if (isRevealed) {
                if (idx === currentQ.correctIndex) {
                  cls = 'border-emerald-500 bg-emerald-50/70 text-emerald-950';
                } else if (idx === selectedOpt) {
                  cls = 'border-red-500 bg-red-50/70 text-red-950';
                } else {
                  cls = 'border-slate-200 bg-slate-50 text-slate-400';
                }
              }

              return (
                <button
                  key={idx}
                  type="button"
                  disabled={isRevealed}
                  onClick={() => handleSelectOption(idx)}
                  className={`w-full text-start rounded-xl border px-4 py-3.5 text-sm font-medium transition-colors ${cls}`}
                >
                  {pickText(opt, lang)}
                </button>
              );
            })}
          </div>

          {isRevealed && (
            <div
              className={`mt-5 rounded-xl border p-4 space-y-3 ${
                selectedOpt === currentQ.correctIndex
                  ? 'border-emerald-200 bg-emerald-50/60'
                  : 'border-amber-200 bg-amber-50/60'
              }`}
            >
              <div className="flex items-center gap-2 text-xs font-bold">
                {selectedOpt === currentQ.correctIndex ? (
                  <>
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    <span className="text-emerald-800">{ui.drillCorrectFeedback}</span>
                  </>
                ) : (
                  <>
                    <XCircle className="h-4 w-4 text-red-600" />
                    <span className="text-red-800">
                      {timedOut ? ui.drillTimeExpired : ui.drillIncorrectFeedback}
                    </span>
                  </>
                )}
              </div>
              <p className="text-sm text-slate-800 leading-relaxed">
                {pickText(currentQ.explanation, lang)}
              </p>
              <button
                type="button"
                onClick={handleNext}
                className="rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 transition-colors"
              >
                {qIdx + 1 < deck.length ? ui.drillNextBtn : ui.drillFinishBtn}
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="mx-auto max-w-xl rounded-xl border border-slate-200 bg-white p-8 text-center space-y-4">
          <div className="text-xs font-bold text-slate-500">{ui.drillSummaryTitle}</div>
          <div className="font-display text-4xl font-extrabold text-emerald-600 tabular-nums">
            {accuracy}%
          </div>
          <div className="text-sm text-slate-600 tabular-nums">
            {ui.drillAccuracyLabel}: {correctCount} / {deck.length}
          </div>
          <button
            type="button"
            onClick={() => resetSession(timerMode, ageFilter)}
            className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 transition-colors"
          >
            <RotateCcw className="h-4 w-4" />
            <span>{ui.drillRestartBtn}</span>
          </button>
        </div>
      )}
    </div>
  );
};
