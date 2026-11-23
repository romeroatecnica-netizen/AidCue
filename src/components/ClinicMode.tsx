import React, {useMemo, useState} from 'react';
import {CheckCircle2, Target, XCircle} from 'lucide-react';
import {PROTOCOLS} from '../data/protocols';
import {TRIAGE_QUESTIONS} from '../data/triageQuiz';
import {pickText} from '../i18n/helpers';
import type {UiStrings} from '../i18n/uiStrings';
import type {AgeGroup, LangCode, ProfileData, ProtocolId, TriageQuestion} from '../types';

interface ClinicModeProps {
  lang: LangCode;
  ui: UiStrings;
  profile: ProfileData;
  onRecordAnswer: (opts: {
    itemId: string;
    protocolId: ProtocolId;
    ageGroup: AgeGroup;
    isCorrect: boolean;
    xpDelta: number;
    fromClinic: boolean;
  }) => void;
}

export const ClinicMode: React.FC<ClinicModeProps> = ({
  lang,
  ui,
  profile,
  onRecordAnswer,
}) => {
  const [activeRemedial, setActiveRemedial] = useState(false);
  const [deckIdx, setDeckIdx] = useState(0);
  const [selectedOpt, setSelectedOpt] = useState<number | null>(null);

  const weakQuestions: TriageQuestion[] = useMemo(() => {
    if (profile.mistakeLog.length === 0) return [];
    const missedIds = new Set(profile.mistakeLog.map((m) => m.itemId));
    const missedProtocols = new Set(profile.mistakeLog.map((m) => m.protocolId));

    const exact = TRIAGE_QUESTIONS.filter((q) => missedIds.has(q.id));
    const byProtocol = TRIAGE_QUESTIONS.filter(
      (q) => !missedIds.has(q.id) && missedProtocols.has(q.protocolId),
    );
    return [...exact, ...byProtocol];
  }, [profile.mistakeLog]);

  const currentQ = weakQuestions[deckIdx] ?? weakQuestions[0];

  const getProtocolName = (pid: ProtocolId) => {
    const p = PROTOCOLS.find((item) => item.id === pid);
    return p ? pickText(p.title, lang) : pid;
  };

  const getAgeLabel = (age: AgeGroup) =>
    age === 'adult' ? ui.ageAdult : age === 'child' ? ui.ageChild : ui.ageInfant;

  const handleChoose = (idx: number) => {
    if (selectedOpt !== null || !currentQ) return;
    setSelectedOpt(idx);
    const isCorrect = idx === currentQ.correctIndex;
    onRecordAnswer({
      itemId: currentQ.id,
      protocolId: currentQ.protocolId,
      ageGroup: currentQ.ageGroup,
      isCorrect,
      xpDelta: isCorrect ? 20 : 2,
      fromClinic: true,
    });
  };

  const handleNext = () => {
    setSelectedOpt(null);
    if (deckIdx + 1 < weakQuestions.length) {
      setDeckIdx((i) => i + 1);
    } else {
      setActiveRemedial(false);
      setDeckIdx(0);
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="font-display text-lg font-bold text-slate-900">{ui.clinicTitle}</h2>
        <p className="mt-1 text-sm text-slate-600">{ui.clinicSubtitle}</p>

        {/* Accuracy Breakdown */}
        <div className="mt-5 grid gap-6 md:grid-cols-2">
          <div>
            <h3 className="text-xs font-bold text-slate-500 mb-3">
              {ui.clinicAccuracyByAge}
            </h3>
            <div className="space-y-2.5">
              {(['adult', 'child', 'infant'] as AgeGroup[]).map((age) => {
                const stat = profile.accuracyByAge[age];
                const pct =
                  stat.attempts > 0
                    ? Math.round((stat.correct / stat.attempts) * 100)
                    : null;
                return (
                  <div
                    key={age}
                    className="flex items-center justify-between rounded-lg border border-slate-200 px-3.5 py-2.5 text-sm"
                  >
                    <span className="font-medium text-slate-800">{getAgeLabel(age)}</span>
                    <span className="font-semibold tabular-nums text-slate-700">
                      {pct !== null ? `${pct}% (${stat.correct}/${stat.attempts})` : '—'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <div>
            <h3 className="text-xs font-bold text-slate-500 mb-3">
              {ui.clinicAccuracyByProtocol}
            </h3>
            <div className="space-y-2">
              {PROTOCOLS.filter((p) => p.id !== 'first_aid_kit').map((p) => {
                const stat = profile.accuracyByCategory[p.id];
                const pct =
                  stat && stat.attempts > 0
                    ? Math.round((stat.correct / stat.attempts) * 100)
                    : null;
                return (
                  <div
                    key={p.id}
                    className="flex items-center justify-between rounded-lg border border-slate-200 px-3.5 py-2 text-xs sm:text-sm"
                  >
                    <span className="font-medium text-slate-800 truncate pe-3">
                      {pickText(p.title, lang)}
                    </span>
                    <span className="font-semibold tabular-nums text-slate-700 shrink-0">
                      {pct !== null ? `${pct}%` : '—'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Remedial Queue or Active Review */}
      {profile.mistakeLog.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-8 text-center">
          <Target className="mx-auto h-8 w-8 text-emerald-600" />
          <h3 className="mt-3 font-display text-base font-bold text-slate-900">
            {ui.clinicEmptyTitle}
          </h3>
          <p className="mt-1 text-sm text-slate-600 max-w-md mx-auto">
            {ui.clinicEmptyBody}
          </p>
        </div>
      ) : activeRemedial && currentQ ? (
        <div className="mx-auto max-w-3xl rounded-xl border border-slate-200 bg-white p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3 text-xs font-semibold text-slate-500">
            <span>
              {getProtocolName(currentQ.protocolId)} · {getAgeLabel(currentQ.ageGroup)}
            </span>
            <span className="tabular-nums">
              {deckIdx + 1} / {weakQuestions.length}
            </span>
          </div>

          <h3 className="font-display text-lg font-bold text-slate-900">
            {pickText(currentQ.prompt, lang)}
          </h3>

          <div className="grid gap-2.5">
            {currentQ.options.map((opt, idx) => {
              let cls =
                'border-slate-200 bg-white text-slate-800 hover:border-slate-300 hover:bg-slate-50';
              if (selectedOpt !== null) {
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
                  disabled={selectedOpt !== null}
                  onClick={() => handleChoose(idx)}
                  className={`w-full text-start rounded-xl border px-4 py-3 text-sm font-medium transition-colors ${cls}`}
                >
                  {pickText(opt, lang)}
                </button>
              );
            })}
          </div>

          {selectedOpt !== null && (
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-2.5">
              <div className="flex items-center gap-2 text-xs font-bold">
                {selectedOpt === currentQ.correctIndex ? (
                  <>
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    <span className="text-emerald-800">
                      {ui.drillCorrectFeedback} — {ui.clinicMasteredNotice}
                    </span>
                  </>
                ) : (
                  <>
                    <XCircle className="h-4 w-4 text-red-600" />
                    <span className="text-red-800">{ui.drillIncorrectFeedback}</span>
                  </>
                )}
              </div>
              <p className="text-sm text-slate-700">{pickText(currentQ.explanation, lang)}</p>
              <button
                type="button"
                onClick={handleNext}
                className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
              >
                {deckIdx + 1 < weakQuestions.length ? ui.drillNextBtn : ui.drillFinishBtn}
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h3 className="font-display text-base font-bold text-slate-900">
              {ui.clinicWeakAreasHeading}
            </h3>
            <button
              type="button"
              onClick={() => {
                setDeckIdx(0);
                setSelectedOpt(null);
                setActiveRemedial(true);
              }}
              className="rounded-lg bg-red-600 px-4 py-2 text-xs font-semibold text-white hover:bg-red-700 transition-colors"
            >
              {ui.clinicStartRemedialBtn}
            </button>
          </div>

          <div className="grid gap-2.5 sm:grid-cols-2">
            {profile.mistakeLog.map((m) => (
              <div
                key={m.itemId}
                className="flex items-center justify-between rounded-lg border border-amber-200 bg-amber-50/50 px-3.5 py-2.5 text-xs"
              >
                <div>
                  <div className="font-bold text-slate-900">
                    {getProtocolName(m.protocolId)}
                  </div>
                  <div className="text-slate-600">{getAgeLabel(m.ageGroup)}</div>
                </div>
                <div className="font-bold text-amber-800 tabular-nums">
                  {m.errorCount} {ui.clinicMissedCount}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
