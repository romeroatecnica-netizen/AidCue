import React, {useEffect, useState} from 'react';
import {AlertCircle, PhoneCall} from 'lucide-react';
import {PROTOCOLS} from '../data/protocols';
import {pickText} from '../i18n/helpers';
import type {UiStrings} from '../i18n/uiStrings';
import type {AgeGroup, LangCode, ProtocolId} from '../types';
import {FirstAidVisualStage} from './FirstAidVisualStage';

interface GuidesModeProps {
  lang: LangCode;
  ui: UiStrings;
  onReviewProtocol: (protocolId: ProtocolId) => void;
}

export const GuidesMode: React.FC<GuidesModeProps> = ({
  lang,
  ui,
  onReviewProtocol,
}) => {
  const [activeId, setActiveId] = useState<ProtocolId>('cpr');
  const [ageGroup, setAgeGroup] = useState<AgeGroup>('adult');
  const [stepIndex, setStepIndex] = useState(0);

  const protocol = PROTOCOLS.find((p) => p.id === activeId) ?? PROTOCOLS[0];
  const activeStep = protocol.steps[stepIndex] ?? protocol.steps[0];

  useEffect(() => {
    onReviewProtocol(activeId);
  }, [activeId, onReviewProtocol]);

  const handleSelectProtocol = (id: ProtocolId) => {
    setActiveId(id);
    setStepIndex(0);
  };

  return (
    <div className="space-y-6">
      {/* Protocol Selector Tabs */}
      <div className="flex flex-wrap gap-2" role="tablist">
        {PROTOCOLS.map((p) => {
          const active = p.id === protocol.id;
          return (
            <button
              key={p.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => handleSelectProtocol(p.id)}
              className={`whitespace-nowrap shrink-0 rounded-lg border px-3.5 py-2 text-xs font-semibold transition-colors ${
                active
                  ? 'border-slate-900 bg-slate-900 text-white'
                  : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
              }`}
            >
              {pickText(p.title, lang)}
            </button>
          );
        })}
      </div>

      {/* Interactive Stage + Step Deck */}
      <div className="grid gap-6 lg:grid-cols-12 items-start">
        <div className="lg:col-span-7">
          <FirstAidVisualStage
            protocolId={protocol.id}
            ageGroup={ageGroup}
            onAgeChange={setAgeGroup}
            stepIndex={stepIndex}
            totalSteps={protocol.steps.length}
            onStepChange={setStepIndex}
            supportsAgeToggle={protocol.supportsAgeToggle}
            lang={lang}
            ui={ui}
          />
        </div>

        <div className="lg:col-span-5 space-y-4">
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <h2 className="font-display text-lg font-bold text-slate-900">
              {pickText(protocol.title, lang)}
            </h2>
            <p className="mt-1.5 text-sm text-slate-600 leading-relaxed">
              {pickText(protocol.summary, lang)}
            </p>

            <h3 className="mt-5 text-xs font-bold text-slate-500">
              {ui.protocolStepsHeading}
            </h3>

            <div className="mt-2.5 space-y-2">
              {protocol.steps.map((st, idx) => {
                const isSelected = idx === stepIndex;
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setStepIndex(idx)}
                    className={`w-full text-start rounded-xl border p-3.5 transition-colors ${
                      isSelected
                        ? 'border-blue-600 bg-blue-50/40'
                        : 'border-slate-200 bg-white hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span
                        className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-xs font-bold tabular-nums ${
                          isSelected
                            ? 'bg-blue-700 text-white'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {idx + 1}
                      </span>
                      <span className="font-display text-sm font-bold text-slate-900">
                        {pickText(st.title, lang)}
                      </span>
                    </div>

                    {isSelected && (
                      <div className="mt-3 space-y-2.5 text-sm text-slate-700">
                        <p className="leading-relaxed">
                          {pickText(st.instruction, lang)}
                        </p>
                        <div className="rounded-lg border border-blue-200 bg-blue-50/70 px-3 py-2 text-xs text-blue-900">
                          <strong className="font-semibold">{ui.protocolAgeNoteLabel}:</strong>{' '}
                          {pickText(st.ageNotes[ageGroup], lang)}
                        </div>
                        <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50/80 px-3 py-2 text-xs text-amber-900">
                          <AlertCircle className="h-4 w-4 shrink-0 text-amber-600 mt-0.5" />
                          <span>
                            <strong className="font-semibold">{ui.protocolCautionLabel}:</strong>{' '}
                            {pickText(st.caution, lang)}
                          </span>
                        </div>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Emergency Call Triggers */}
          <div className="rounded-xl border border-red-200 bg-red-50/60 p-4">
            <div className="flex items-center gap-2 text-xs font-bold text-red-800">
              <PhoneCall className="h-4 w-4 text-red-600 shrink-0" />
              <span>{ui.protocolCallEmergencyHeading}</span>
            </div>
            <ul className="mt-2 space-y-1.5 text-xs text-red-950 leading-relaxed">
              {protocol.callEmergencyWhen.map((item, idx) => (
                <li key={idx}>• {pickText(item, lang)}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Adult vs Child vs Infant Comparison Table */}
      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
        <div className="border-b border-slate-200 bg-slate-50/70 px-5 py-3.5">
          <h3 className="font-display text-sm font-bold text-slate-900">
            {ui.protocolComparisonHeading} — {pickText(protocol.title, lang)}
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-start border-collapse text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/40 text-xs font-bold text-slate-600">
                <th className="py-3 px-4 text-start">{ui.comparisonFeatureCol}</th>
                <th className="py-3 px-4 text-start">{ui.ageAdult}</th>
                <th className="py-3 px-4 text-start">{ui.ageChild}</th>
                <th className="py-3 px-4 text-start">{ui.ageInfant}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-xs sm:text-sm text-slate-700">
              <tr>
                <td className="py-3 px-4 font-semibold text-slate-900">
                  {ui.comparisonTargetRow}
                </td>
                <td className="py-3 px-4">{pickText(protocol.ageComparison.compressionTarget.adult, lang)}</td>
                <td className="py-3 px-4">{pickText(protocol.ageComparison.compressionTarget.child, lang)}</td>
                <td className="py-3 px-4">{pickText(protocol.ageComparison.compressionTarget.infant, lang)}</td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-semibold text-slate-900">
                  {ui.comparisonDepthRow}
                </td>
                <td className="py-3 px-4 tabular-nums">{pickText(protocol.ageComparison.compressionDepth.adult, lang)}</td>
                <td className="py-3 px-4 tabular-nums">{pickText(protocol.ageComparison.compressionDepth.child, lang)}</td>
                <td className="py-3 px-4 tabular-nums">{pickText(protocol.ageComparison.compressionDepth.infant, lang)}</td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-semibold text-slate-900">
                  {ui.comparisonAirwayRow}
                </td>
                <td className="py-3 px-4">{pickText(protocol.ageComparison.ventilationOrAirway.adult, lang)}</td>
                <td className="py-3 px-4">{pickText(protocol.ageComparison.ventilationOrAirway.child, lang)}</td>
                <td className="py-3 px-4">{pickText(protocol.ageComparison.ventilationOrAirway.infant, lang)}</td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-semibold text-slate-900">
                  {ui.comparisonRuleRow}
                </td>
                <td className="py-3 px-4 font-medium text-red-700">{pickText(protocol.ageComparison.criticalRule.adult, lang)}</td>
                <td className="py-3 px-4 font-medium text-red-700">{pickText(protocol.ageComparison.criticalRule.child, lang)}</td>
                <td className="py-3 px-4 font-medium text-red-700">{pickText(protocol.ageComparison.criticalRule.infant, lang)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Hidden usage guard for activeStep so TS unused variable doesn't trigger */}
      <span className="sr-only">{pickText(activeStep.title, lang)}</span>
    </div>
  );
};
