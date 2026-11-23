import React, {useState} from 'react';
import {AlertTriangle, CheckCircle2, RotateCcw, ShieldAlert} from 'lucide-react';
import {PROTOCOLS} from '../data/protocols';
import {SCENARIOS} from '../data/scenarios';
import {pickText} from '../i18n/helpers';
import type {UiStrings} from '../i18n/uiStrings';
import type {AgeGroup, LangCode, ProfileData, ProtocolId} from '../types';
import {FirstAidVisualStage} from './FirstAidVisualStage';

interface SimulatorModeProps {
  lang: LangCode;
  ui: UiStrings;
  profile: ProfileData;
  onRecordAnswer: (opts: {
    itemId: string;
    protocolId: ProtocolId;
    ageGroup: AgeGroup;
    isCorrect: boolean;
    xpDelta: number;
  }) => void;
  onCompleteScenario: (scenarioId: string, score: number, totalSteps: number) => void;
}

export const SimulatorMode: React.FC<SimulatorModeProps> = ({
  lang,
  ui,
  profile,
  onRecordAnswer,
  onCompleteScenario,
}) => {
  const [selectedScenarioId, setSelectedScenarioId] = useState<string>(SCENARIOS[0].id);
  const [stepIdx, setStepIdx] = useState(0);
  const [chosenId, setChosenId] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);

  const scenario =
    SCENARIOS.find((s) => s.id === selectedScenarioId) ?? SCENARIOS[0];
  const currentStep = scenario.steps[stepIdx];
  const chosenChoice = currentStep?.choices.find((c) => c.id === chosenId) ?? null;
  const protocolMeta =
    PROTOCOLS.find((p) => p.id === scenario.protocolId) ?? PROTOCOLS[0];

  const handleSelectScenario = (id: string) => {
    setSelectedScenarioId(id);
    setStepIdx(0);
    setChosenId(null);
    setScore(0);
    setFinished(false);
  };

  const handleChoose = (choiceId: string) => {
    if (chosenId) return;
    const choice = currentStep.choices.find((c) => c.id === choiceId);
    if (!choice) return;
    setChosenId(choiceId);
    if (choice.isCorrect) {
      setScore((s) => s + 1);
    }
    onRecordAnswer({
      itemId: `${scenario.id}:${currentStep.id}`,
      protocolId: scenario.protocolId,
      ageGroup: scenario.ageGroup,
      isCorrect: choice.isCorrect,
      xpDelta: choice.isCorrect ? 20 : 5,
    });
  };

  const handleNext = () => {
    if (stepIdx + 1 < scenario.steps.length) {
      setStepIdx((i) => i + 1);
      setChosenId(null);
    } else {
      setFinished(true);
      onCompleteScenario(scenario.id, score, scenario.steps.length);
    }
  };

  const handleRestart = () => {
    setStepIdx(0);
    setChosenId(null);
    setScore(0);
    setFinished(false);
  };

  const ageLabel =
    scenario.ageGroup === 'adult'
      ? ui.ageAdult
      : scenario.ageGroup === 'child'
      ? ui.ageChild
      : ui.ageInfant;

  return (
    <div className="space-y-6">
      {/* Scenario Selector Strip */}
      <div>
        <h2 className="font-display text-sm font-bold text-slate-700 mb-3">
          {ui.scenarioChooseHeading}
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {SCENARIOS.map((sc) => {
            const active = sc.id === scenario.id;
            const prev = profile.completedScenarios[sc.id];
            return (
              <button
                key={sc.id}
                type="button"
                onClick={() => handleSelectScenario(sc.id)}
                className={`text-start rounded-xl border p-3.5 transition-colors ${
                  active
                    ? 'border-red-600 bg-red-50/40'
                    : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/70'
                }`}
              >
                <div className="text-[11px] font-medium text-slate-500">
                  {pickText(sc.environmentTag, lang)}
                </div>
                <div className="mt-1 font-display text-sm font-bold text-slate-900 leading-snug">
                  {pickText(sc.title, lang)}
                </div>
                {prev && (
                  <div className="mt-2 text-[11px] font-semibold text-emerald-700 tabular-nums">
                    {prev.bestScore}/{prev.totalSteps}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Split Workspace: Visual Stage + Interactive Branching Decisions */}
      <div className="grid gap-6 lg:grid-cols-12 items-start">
        <div className="lg:col-span-7">
          <FirstAidVisualStage
            protocolId={scenario.protocolId}
            ageGroup={scenario.ageGroup}
            onAgeChange={() => {}}
            stepIndex={Math.min(stepIdx, protocolMeta.steps.length - 1)}
            totalSteps={protocolMeta.steps.length}
            onStepChange={() => {}}
            supportsAgeToggle={false}
            lang={lang}
            ui={ui}
          />
        </div>

        <div className="lg:col-span-5 rounded-xl border border-slate-200 bg-white p-5">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
            <span className="text-xs font-semibold text-blue-700">
              {ageLabel} · {pickText(scenario.environmentTag, lang)}
            </span>
            <span className="text-xs font-semibold text-slate-500 tabular-nums">
              {ui.stageStepLabel} {Math.min(stepIdx + 1, scenario.steps.length)}/{scenario.steps.length}
            </span>
          </div>

          {!finished ? (
            <div className="mt-4 space-y-4">
              {stepIdx === 0 && !chosenId && (
                <p className="rounded-lg bg-slate-50 p-3 text-xs leading-relaxed text-slate-600 border border-slate-200">
                  {pickText(scenario.brief, lang)}
                </p>
              )}

              <div>
                <div className="text-xs font-semibold text-slate-500">
                  {pickText(currentStep.visualStateLabel, lang)}
                </div>
                <h3 className="mt-1 font-display text-base font-bold text-slate-900 leading-snug">
                  {pickText(currentStep.situation, lang)}
                </h3>
              </div>

              <div className="space-y-2.5">
                {currentStep.choices.map((choice) => {
                  const isSelected = chosenId === choice.id;
                  const showState = Boolean(chosenId);
                  let btnStyle =
                    'border-slate-200 bg-white text-slate-800 hover:border-slate-300 hover:bg-slate-50';
                  if (showState) {
                    if (choice.isCorrect) {
                      btnStyle = 'border-emerald-500 bg-emerald-50/70 text-emerald-950';
                    } else if (isSelected) {
                      btnStyle = 'border-red-500 bg-red-50/70 text-red-950';
                    } else {
                      btnStyle = 'border-slate-200 bg-slate-50 text-slate-400';
                    }
                  }

                  return (
                    <button
                      key={choice.id}
                      type="button"
                      disabled={Boolean(chosenId)}
                      onClick={() => handleChoose(choice.id)}
                      className={`w-full text-start rounded-xl border p-3.5 text-sm font-medium leading-snug transition-colors ${btnStyle}`}
                    >
                      {pickText(choice.label, lang)}
                    </button>
                  );
                })}
              </div>

              {chosenChoice && (
                <div
                  className={`rounded-xl border p-4 space-y-2 ${
                    chosenChoice.isCorrect
                      ? 'border-emerald-200 bg-emerald-50/60'
                      : 'border-red-200 bg-red-50/60'
                  }`}
                >
                  <div className="flex items-center gap-2 text-xs font-bold">
                    {chosenChoice.isCorrect ? (
                      <>
                        <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                        <span className="text-emerald-800">{ui.scenarioCorrectTag}</span>
                      </>
                    ) : (
                      <>
                        <AlertTriangle className="h-4 w-4 text-red-600 shrink-0" />
                        <span className="text-red-800">{ui.scenarioWarningTag}</span>
                      </>
                    )}
                  </div>
                  <p className="text-sm text-slate-800 leading-relaxed">
                    {pickText(chosenChoice.feedback, lang)}
                  </p>
                  {chosenChoice.criticalErrorReason && (
                    <p className="text-xs font-semibold text-red-800 flex items-start gap-1.5">
                      <ShieldAlert className="h-4 w-4 shrink-0 mt-0.5" />
                      <span>
                        {ui.scenarioCriticalErrorLabel}:{' '}
                        {pickText(chosenChoice.criticalErrorReason, lang)}
                      </span>
                    </p>
                  )}
                  <p className="text-xs text-slate-600 pt-1 border-t border-slate-200/70">
                    <strong className="font-semibold text-slate-800">
                      {ui.scenarioOutcomeLabel}:
                    </strong>{' '}
                    {pickText(chosenChoice.outcomeImpact, lang)}
                  </p>

                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={handleNext}
                      className="w-full rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 transition-colors"
                    >
                      {stepIdx + 1 < scenario.steps.length
                        ? ui.scenarioNextStepBtn
                        : ui.scenarioFinishBtn}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="mt-5 space-y-4">
              <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-4 text-center">
                <div className="text-xs font-semibold text-emerald-800">
                  {ui.scenarioCompletedTitle}
                </div>
                <div className="mt-1 font-display text-3xl font-extrabold text-emerald-700 tabular-nums">
                  {score} / {scenario.steps.length}
                </div>
                <div className="mt-1 text-xs text-slate-600">{ui.scenarioScoreLabel}</div>
              </div>

              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={handleRestart}
                  className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 hover:bg-slate-50 transition-colors"
                >
                  <RotateCcw className="h-4 w-4" />
                  <span>{ui.scenarioRestartBtn}</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const idx = SCENARIOS.findIndex((s) => s.id === scenario.id);
                    const nextSc = SCENARIOS[(idx + 1) % SCENARIOS.length];
                    handleSelectScenario(nextSc.id);
                  }}
                  className="flex-1 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700 transition-colors"
                >
                  {ui.scenarioNextStepBtn}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
