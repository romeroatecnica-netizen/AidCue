import React, {useEffect, useMemo, useState} from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Eye,
  EyeOff,
  Pause,
  Play,
  Volume2,
  VolumeX,
} from 'lucide-react';
import {KIT_COMPARTMENTS} from '../data/kitItems';
import {pickText} from '../i18n/helpers';
import type {UiStrings} from '../i18n/uiStrings';
import type {AgeGroup, LangCode, ProtocolId} from '../types';
import {playMetronomeTick} from '../utils/audio';

interface FirstAidVisualStageProps {
  protocolId: ProtocolId;
  ageGroup: AgeGroup;
  onAgeChange: (age: AgeGroup) => void;
  stepIndex: number;
  totalSteps: number;
  onStepChange: (nextStep: number) => void;
  supportsAgeToggle: boolean;
  lang: LangCode;
  ui: UiStrings;
}

export const FirstAidVisualStage: React.FC<FirstAidVisualStageProps> = ({
  protocolId,
  ageGroup,
  onAgeChange,
  stepIndex,
  totalSteps,
  onStepChange,
  supportsAgeToggle,
  lang,
  ui,
}) => {
  const [isPlaying, setIsPlaying] = useState(true);
  const [showLabels, setShowLabels] = useState(true);
  const [bpm, setBpm] = useState(110);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [beatCount, setBeatCount] = useState(0);
  const [selectedKitId, setSelectedKitId] = useState<string>('trauma');

  const showMetronome =
    protocolId === 'cpr' || (protocolId === 'water' && stepIndex >= 2);

  useEffect(() => {
    if (!isPlaying || !showMetronome) {
      return;
    }
    const intervalMs = Math.round(60000 / bpm);
    const id = window.setInterval(() => {
      setBeatCount((prev) => {
        const next = (prev + 1) % 30;
        if (soundEnabled) {
          playMetronomeTick(next === 0);
        }
        return next;
      });
    }, intervalMs);

    return () => window.clearInterval(id);
  }, [bpm, isPlaying, showMetronome, soundEnabled]);

  const cycleMs = Math.round(60000 / bpm);

  const selectedCompartment = useMemo(
    () => KIT_COMPARTMENTS.find((c) => c.id === selectedKitId) ?? KIT_COMPARTMENTS[0],
    [selectedKitId],
  );

  const stageStyle = {
    '--cpr-cycle-ms': `${cycleMs}ms`,
  } as React.CSSProperties;

  return (
    <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
      {/* Top Stage Bar: Age Selector & Step Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-slate-50/70 px-4 py-3">
        {supportsAgeToggle ? (
          <div className="flex items-center gap-1 rounded-lg bg-slate-200/70 p-1" role="group" aria-label={ui.ageSelectorLabel}>
            {(['adult', 'child', 'infant'] as AgeGroup[]).map((age) => {
              const active = ageGroup === age;
              const label =
                age === 'adult' ? ui.ageAdult : age === 'child' ? ui.ageChild : ui.ageInfant;
              return (
                <button
                  key={age}
                  type="button"
                  onClick={() => onAgeChange(age)}
                  className={`whitespace-nowrap shrink-0 rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${
                    active
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        ) : (
          <span className="text-xs font-medium text-slate-600">{ui.kitSelectHint}</span>
        )}

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setShowLabels((v) => !v)}
            className={`inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors ${
              showLabels
                ? 'border-blue-200 bg-blue-50 text-blue-700'
                : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
            }`}
          >
            {showLabels ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
            <span>{ui.stageLabelsToggle}</span>
          </button>

          <button
            type="button"
            onClick={() => setIsPlaying((p) => !p)}
            className="inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
          >
            {isPlaying ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
            <span>{isPlaying ? ui.stagePause : ui.stagePlay}</span>
          </button>

          <div className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-1.5 py-1">
            <button
              type="button"
              onClick={() => onStepChange(Math.max(0, stepIndex - 1))}
              disabled={stepIndex === 0}
              aria-label={ui.stagePrev}
              className="rounded p-1 text-slate-600 hover:bg-slate-100 disabled:opacity-35"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </button>
            <span className="px-2 text-xs font-semibold text-slate-700 tabular-nums whitespace-nowrap">
              {ui.stageStepLabel} {stepIndex + 1}/{totalSteps}
            </span>
            <button
              type="button"
              onClick={() => onStepChange(Math.min(totalSteps - 1, stepIndex + 1))}
              disabled={stepIndex >= totalSteps - 1}
              aria-label={ui.stageNext}
              className="rounded p-1 text-slate-600 hover:bg-slate-100 disabled:opacity-35"
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Main SVG Viewport */}
      <div
        style={stageStyle}
        className={`relative bg-[#F8FAFC] px-3 py-4 sm:px-5 ${!isPlaying ? 'anim-paused' : ''}`}
      >
        <svg
          viewBox="0 0 640 360"
          className="mx-auto block h-auto w-full max-w-[680px] select-none"
          role="img"
          aria-label={`${protocolId} ${ageGroup} step ${stepIndex + 1}`}
        >
          <defs>
            <pattern id="aidcue-grid" width="32" height="32" patternUnits="userSpaceOnUse">
              <path d="M 32 0 L 0 0 0 32" fill="none" stroke="#E2E8F0" strokeWidth="0.7" />
            </pattern>
            <marker id="arrow-red" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 1 L 10 5 L 0 9 z" fill="#DC2626" />
            </marker>
            <marker id="arrow-blue" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 1 L 10 5 L 0 9 z" fill="#1D4ED8" />
            </marker>
            <marker id="arrow-amber" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 1 L 10 5 L 0 9 z" fill="#D97706" />
            </marker>
            <marker id="arrow-emerald" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 1 L 10 5 L 0 9 z" fill="#059669" />
            </marker>
          </defs>

          <rect x="0" y="0" width="640" height="360" rx="14" fill="#FFFFFF" stroke="#E2E8F0" />
          <rect x="12" y="12" width="616" height="336" rx="10" fill="url(#aidcue-grid)" opacity="0.55" />

          {protocolId === 'cpr' && (
            <CprScene
              ageGroup={ageGroup}
              stepIndex={stepIndex}
              showLabels={showLabels}
              bpm={bpm}
            />
          )}

          {protocolId === 'choking' && (
            <ChokingScene
              ageGroup={ageGroup}
              stepIndex={stepIndex}
              showLabels={showLabels}
            />
          )}

          {protocolId === 'water' && (
            <WaterScene
              ageGroup={ageGroup}
              stepIndex={stepIndex}
              showLabels={showLabels}
            />
          )}

          {protocolId === 'recovery' && (
            <RecoveryScene
              ageGroup={ageGroup}
              stepIndex={stepIndex}
              showLabels={showLabels}
            />
          )}

          {protocolId === 'bleeding' && (
            <BleedingScene
              ageGroup={ageGroup}
              stepIndex={stepIndex}
              showLabels={showLabels}
            />
          )}

          {protocolId === 'burns' && (
            <BurnsScene
              ageGroup={ageGroup}
              stepIndex={stepIndex}
              showLabels={showLabels}
            />
          )}

          {protocolId === 'fainting_seizure' && (
            <SeizureScene
              ageGroup={ageGroup}
              stepIndex={stepIndex}
              showLabels={showLabels}
            />
          )}

          {protocolId === 'first_aid_kit' && (
            <KitScene
              selectedKitId={selectedKitId}
              onSelectKit={setSelectedKitId}
              lang={lang}
              showLabels={showLabels}
            />
          )}
        </svg>

        {/* First Aid Kit Selected Compartment Inspector */}
        {protocolId === 'first_aid_kit' && (
          <div className="mt-4 rounded-xl border border-slate-200 bg-white p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h4 className="font-display text-sm font-bold text-slate-900">
                {pickText(selectedCompartment.title, lang)}
              </h4>
              <span
                className="text-xs font-semibold"
                style={{color: selectedCompartment.color}}
              >
                {ui.kitContentsLabel}
              </span>
            </div>
            <p className="mt-1.5 text-sm text-slate-600 leading-relaxed">
              {pickText(selectedCompartment.purpose, lang)}
            </p>
            <ul className="mt-3 grid gap-2 sm:grid-cols-2">
              {selectedCompartment.items.map((item, idx) => (
                <li
                  key={idx}
                  className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-800"
                >
                  {pickText(item, lang)}
                </li>
              ))}
            </ul>
            <p className="mt-3 text-xs text-amber-800 bg-amber-50/80 border border-amber-200 rounded-lg px-3 py-2">
              <strong className="font-semibold">{ui.kitPediatricLabel}:</strong>{' '}
              {pickText(selectedCompartment.pediatricNote, lang)}
            </p>
          </div>
        )}
      </div>

      {/* Interactive CPR Metronome Bar */}
      {showMetronome && (
        <div className="flex flex-wrap items-center justify-between gap-4 border-t border-slate-200 bg-slate-50/70 px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="relative flex h-9 w-9 items-center justify-center rounded-full border border-red-200 bg-red-50">
              {isPlaying && (
                <span
                  key={beatCount}
                  className="anim-pulse-ring absolute inset-0 rounded-full border-2 border-red-500"
                />
              )}
              <span className="font-display text-xs font-bold text-red-700 tabular-nums">
                {beatCount + 1}
              </span>
            </div>
            <div>
              <div className="text-xs font-semibold text-slate-900">
                {ui.metronomeTitle}:{' '}
                <span className="text-red-600 tabular-nums">
                  {bpm} {ui.metronomeBpmUnit}
                </span>
              </div>
              <div className="text-[11px] text-slate-500">{ui.metronomeTargetHint}</div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <label className="flex items-center gap-2 text-xs text-slate-600">
              <span className="tabular-nums font-medium">100</span>
              <input
                type="range"
                min={100}
                max={120}
                step={2}
                value={bpm}
                onChange={(e) => setBpm(Number(e.target.value))}
                className="h-1.5 w-28 cursor-pointer accent-red-600"
                aria-label={ui.metronomeTitle}
              />
              <span className="tabular-nums font-medium">120</span>
            </label>

            <button
              type="button"
              onClick={() => {
                const next = !soundEnabled;
                setSoundEnabled(next);
                if (next) {
                  playMetronomeTick(true);
                }
              }}
              className={`inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors ${
                soundEnabled
                  ? 'border-red-200 bg-red-50 text-red-700'
                  : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
              }`}
            >
              {soundEnabled ? (
                <Volume2 className="h-3.5 w-3.5" />
              ) : (
                <VolumeX className="h-3.5 w-3.5" />
              )}
              <span>{soundEnabled ? ui.metronomeSoundOn : ui.metronomeSoundOff}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

/* ============================================================================
 * 1. CPR & CHEST COMPRESSIONS SCENE
 * ========================================================================== */
const CprScene: React.FC<{
  ageGroup: AgeGroup;
  stepIndex: number;
  showLabels: boolean;
  bpm: number;
}> = ({ageGroup, stepIndex, showLabels, bpm}) => {
  const isVentilationStep = stepIndex === 3;
  const depthText = ageGroup === 'adult' ? '5–6 cm' : ageGroup === 'child' ? '~5 cm (1/3)' : '~4 cm (1/3)';
  const handText =
    ageGroup === 'adult'
      ? '2 Hands · Center Sternum'
      : ageGroup === 'child'
      ? '1 Hand Heel · Lower Sternum'
      : '2 Fingers · Below Nipple Line';

  return (
    <g>
      {/* Firm Surface */}
      <rect x="44" y="292" width="552" height="14" rx="5" fill="#CBD5E1" />
      <text x="56" y="324" fontSize="11" fill="#64748B" fontWeight="600">
        {ageGroup === 'infant' ? 'Firm Flat Surface · Neutral Sniff Position' : 'Firm Flat Surface · Supine'}
      </text>

      {ageGroup === 'infant' ? (
        <g>
          {/* Infant Silhouette */}
          <circle
            cx="188"
            cy="242"
            r="34"
            fill="#F1F5F9"
            stroke="#334155"
            strokeWidth="2.5"
            transform={isVentilationStep ? 'rotate(-3 188 242)' : undefined}
          />
          {/* Neutral Airway Line */}
          <path d="M 218 250 L 244 252" stroke="#94A3B8" strokeWidth="6" strokeLinecap="round" />
          {/* Infant Torso with animated compression */}
          <g className={!isVentilationStep && stepIndex !== 0 ? 'anim-cpr-chest' : ''}>
            <rect x="238" y="218" width="164" height="68" rx="30" fill="#E2E8F0" stroke="#334155" strokeWidth="2.5" />
            {/* Sternum Landmark */}
            <line x1="296" y1="226" x2="296" y2="274" stroke="#94A3B8" strokeDasharray="3 3" strokeWidth="1.5" />
            <circle cx="308" cy="244" r="9" fill="#FCA5A5" stroke="#DC2626" strokeWidth="2" />
            {isVentilationStep && (
              <ellipse cx="308" cy="246" rx="40" ry="18" fill="#60A5FA" opacity="0.5" className="anim-lung-expand" />
            )}
          </g>
          {/* Infant Legs */}
          <path d="M 398 246 Q 446 244 468 266" fill="none" stroke="#334155" strokeWidth="16" strokeLinecap="round" opacity="0.22" />
          <path d="M 398 246 Q 446 244 468 266" fill="none" stroke="#334155" strokeWidth="2.5" strokeLinecap="round" />

          {/* Rescuer 2-Finger Placement */}
          {!isVentilationStep && stepIndex !== 0 && (
            <g className="anim-cpr-hand">
              <path d="M 304 114 L 304 196 M 316 114 L 316 196" stroke="#1E293B" strokeWidth="10" strokeLinecap="round" />
              <path d="M 304 114 L 304 196 M 316 114 L 316 196" stroke="#F8FAFC" strokeWidth="4" strokeLinecap="round" />
              <line x1="340" y1="162" x2="340" y2="206" stroke="#DC2626" strokeWidth="2.5" markerEnd="url(#arrow-red)" />
            </g>
          )}

          {/* Infant Gentle Puff Breath */}
          {isVentilationStep && (
            <g>
              <path d="M 150 175 Q 176 205 190 226" fill="none" stroke="#1D4ED8" strokeWidth="3" strokeDasharray="5 4" markerEnd="url(#arrow-blue)" />
              <rect x="128" y="138" width="128" height="28" rx="6" fill="#EFF6FF" stroke="#BFDBFE" />
              <text x="192" y="156" textAnchor="middle" fontSize="11" fontWeight="700" fill="#1D4ED8">
                Mouth + Nose Seal (1s)
              </text>
            </g>
          )}
        </g>
      ) : (
        <g>
          {/* Adult / Child Proportions */}
          <circle
            cx={ageGroup === 'child' ? 168 : 148}
            cy="240"
            r={ageGroup === 'child' ? 32 : 38}
            fill="#F1F5F9"
            stroke="#334155"
            strokeWidth="2.5"
            transform={isVentilationStep ? 'rotate(-16 168 240)' : undefined}
          />
          <rect
            x={ageGroup === 'child' ? 196 : 184}
            y="246"
            width="30"
            height="28"
            rx="8"
            fill="#F1F5F9"
            stroke="#334155"
            strokeWidth="2"
          />

          {/* Chest & Torso */}
          <g className={!isVentilationStep && stepIndex !== 0 ? 'anim-cpr-chest' : ''}>
            <path
              d={
                ageGroup === 'child'
                  ? 'M 222 214 L 388 218 Q 410 220 412 252 L 412 288 L 222 288 Z'
                  : 'M 212 204 L 416 210 Q 440 214 442 250 L 442 288 L 212 288 Z'
              }
              fill="#E2E8F0"
              stroke="#334155"
              strokeWidth="2.5"
            />
            {/* Lung / Heart Target */}
            {isVentilationStep ? (
              <ellipse
                cx={ageGroup === 'child' ? 294 : 302}
                cy="244"
                rx={ageGroup === 'child' ? 46 : 58}
                ry="22"
                fill="#60A5FA"
                opacity="0.45"
                className="anim-lung-expand"
              />
            ) : (
              <circle
                cx={ageGroup === 'child' ? 292 : 298}
                cy="240"
                r="13"
                fill="#FCA5A5"
                stroke="#DC2626"
                strokeWidth="2.2"
              />
            )}
          </g>

          {/* Pelvis & Legs */}
          <path
            d={
              ageGroup === 'child'
                ? 'M 412 238 L 538 258 L 538 286 L 412 286 Z'
                : 'M 442 234 L 574 256 L 574 286 L 442 286 Z'
            }
            fill="#F1F5F9"
            stroke="#334155"
            strokeWidth="2.5"
          />

          {/* Rescuer Hands / Arms */}
          {!isVentilationStep && stepIndex !== 0 && (
            <g className="anim-cpr-hand">
              <line
                x1={ageGroup === 'child' ? 292 : 298}
                y1="72"
                x2={ageGroup === 'child' ? 292 : 298}
                y2="188"
                stroke="#1E293B"
                strokeWidth={ageGroup === 'child' ? '14' : '18'}
                strokeLinecap="round"
              />
              <rect
                x={ageGroup === 'child' ? 272 : 272}
                y="182"
                width={ageGroup === 'child' ? 40 : 52}
                height="20"
                rx="8"
                fill="#DC2626"
              />
              <line
                x1={ageGroup === 'child' ? 338 : 352}
                y1="142"
                x2={ageGroup === 'child' ? 338 : 352}
                y2="198"
                stroke="#DC2626"
                strokeWidth="2.8"
                markerEnd="url(#arrow-red)"
              />
            </g>
          )}

          {/* Rescue Breath / AED Indicator on Step 4 */}
          {isVentilationStep && (
            <g>
              <path
                d="M 118 148 Q 146 184 156 204"
                fill="none"
                stroke="#1D4ED8"
                strokeWidth="3"
                strokeDasharray="5 4"
                markerEnd="url(#arrow-blue)"
              />
              <rect x="400" y="96" width="176" height="72" rx="10" fill="#EFF6FF" stroke="#1D4ED8" strokeWidth="1.8" />
              <text x="488" y="120" textAnchor="middle" fontSize="12" fontWeight="700" fill="#1E3A8A">
                AED + 30:2 Cycle
              </text>
              <text x="488" y="140" textAnchor="middle" fontSize="11" fill="#1D4ED8">
                {ageGroup === 'child' ? 'Pediatric Pads (<25 kg)' : 'Adult Pads (Upper R / Lower L)'}
              </text>
              <text x="488" y="156" textAnchor="middle" fontSize="10" fill="#3B82F6">
                2 Breaths (1s each)
              </text>
            </g>
          )}
        </g>
      )}

      {/* Step 1 Tap & Shout Indicator */}
      {stepIndex === 0 && (
        <g>
          <circle cx="195" cy="182" r="24" fill="none" stroke="#D97706" strokeWidth="2.2" strokeDasharray="4 4" />
          <rect x="78" y="84" width="234" height="44" rx="8" fill="#FFFBEB" stroke="#F59E0B" />
          <text x="195" y="104" textAnchor="middle" fontSize="11.5" fontWeight="700" fill="#92400E">
            {ageGroup === 'infant' ? 'Tap Foot Sole · Check Breathing ≤10s' : 'Tap Shoulders & Shout · Check ≤10s'}
          </text>
          <text x="195" y="120" textAnchor="middle" fontSize="10.5" fill="#B45309">
            Call EMS &amp; Request AED Immediately
          </text>
        </g>
      )}

      {/* Anatomical & Vector Overlay Callouts */}
      {showLabels && (
        <g>
          <rect x="28" y="28" width="238" height="40" rx="8" fill="#FEF2F2" stroke="#FECACA" />
          <text x="40" y="46" fontSize="11" fontWeight="700" fill="#991B1B">
            {handText}
          </text>
          <text x="40" y="61" fontSize="10.5" fontWeight="600" fill="#DC2626">
            Depth: {depthText} · Rate: {bpm} BPM
          </text>
        </g>
      )}
    </g>
  );
};

/* ============================================================================
 * 2. CHOKING / AIRWAY OBSTRUCTION SCENE
 * ========================================================================== */
const ChokingScene: React.FC<{
  ageGroup: AgeGroup;
  stepIndex: number;
  showLabels: boolean;
}> = ({ageGroup, stepIndex, showLabels}) => {
  const isBackBlows = stepIndex <= 1;

  return (
    <g>
      {ageGroup === 'infant' ? (
        <g>
          {/* Rescuer Seated Thigh & Forearm Support */}
          <path d="M 80 310 L 210 290 L 340 296" fill="none" stroke="#94A3B8" strokeWidth="28" strokeLinecap="round" opacity="0.3" />
          {isBackBlows ? (
            <g>
              {/* Infant Face-Down Head Lower Than Chest */}
              <g transform="rotate(14 310 215)">
                <rect x="220" y="196" width="166" height="46" rx="22" fill="#E2E8F0" stroke="#334155" strokeWidth="2.5" />
                <circle cx="196" cy="216" r="26" fill="#F1F5F9" stroke="#334155" strokeWidth="2.5" />
                <ellipse cx="290" cy="206" rx="14" ry="8" fill="#FDE68A" stroke="#D97706" strokeWidth="2" />
              </g>
              {/* Animated Back Slap Hand */}
              <g className="anim-back-slap">
                <rect x="278" y="98" width="44" height="22" rx="10" fill="#D97706" />
                <line x1="296" y1="128" x2="282" y2="176" stroke="#D97706" strokeWidth="3" markerEnd="url(#arrow-amber)" />
              </g>
              {showLabels && (
                <g>
                  <rect x="36" y="34" width="286" height="46" rx="8" fill="#FFFBEB" stroke="#FDE68A" />
                  <text x="48" y="54" fontSize="11.5" fontWeight="700" fill="#92400E">
                    5 Back Slaps · Forearm Support (Head Lower)
                  </text>
                  <text x="48" y="70" fontSize="10.5" fill="#B45309">
                    Support jaw firmly — do NOT squeeze neck
                  </text>
                </g>
              )}
            </g>
          ) : (
            <g>
              {/* Infant Face-Up for 5 Chest Thrusts */}
              <g transform="rotate(12 310 220)">
                <rect x="224" y="198" width="166" height="48" rx="22" fill="#E2E8F0" stroke="#334155" strokeWidth="2.5" />
                <circle cx="196" cy="216" r="26" fill="#F1F5F9" stroke="#334155" strokeWidth="2.5" />
                <circle cx="294" cy="216" r="10" fill="#FCA5A5" stroke="#DC2626" strokeWidth="2" />
              </g>
              <g className="anim-cpr-hand">
                <path d="M 290 102 L 290 178 M 302 102 L 302 178" stroke="#DC2626" strokeWidth="9" strokeLinecap="round" />
                <line x1="330" y1="138" x2="324" y2="184" stroke="#DC2626" strokeWidth="2.8" markerEnd="url(#arrow-red)" />
              </g>
              {showLabels && (
                <g>
                  <rect x="36" y="34" width="318" height="46" rx="8" fill="#FEF2F2" stroke="#FECACA" />
                  <text x="48" y="54" fontSize="11.5" fontWeight="700" fill="#991B1B">
                    5 Two-Finger Chest Thrusts (NEVER Abdominal)
                  </text>
                  <text x="48" y="70" fontSize="10.5" fill="#DC2626">
                    Lower half of sternum · Alternate 5 + 5 until clear
                  </text>
                </g>
              )}
            </g>
          )}
        </g>
      ) : (
        <g>
          {/* Adult or Child Upright/Leaning Choking Posture */}
          <line x1="120" y1="322" x2="520" y2="322" stroke="#CBD5E1" strokeWidth="4" strokeLinecap="round" />
          {/* Victim Torso Leaning Forward */}
          <g transform={isBackBlows ? 'rotate(-20 330 220)' : 'rotate(-6 330 220)'}>
            <circle cx="330" cy="112" r={ageGroup === 'child' ? 24 : 28} fill="#F1F5F9" stroke="#334155" strokeWidth="2.5" />
            <rect
              x={ageGroup === 'child' ? 304 : 298}
              y="144"
              width={ageGroup === 'child' ? 52 : 64}
              height={ageGroup === 'child' ? 92 : 108}
              rx="18"
              fill="#E2E8F0"
              stroke="#334155"
              strokeWidth="2.5"
            />
            <line x1="316" y1="252" x2="310" y2="320" stroke="#334155" strokeWidth="14" strokeLinecap="round" opacity="0.25" />
            <line x1="344" y1="252" x2="348" y2="320" stroke="#334155" strokeWidth="14" strokeLinecap="round" opacity="0.25" />
          </g>

          {isBackBlows ? (
            <g>
              <g className="anim-back-slap">
                <rect x="386" y="128" width="46" height="22" rx="10" fill="#D97706" />
                <line x1="406" y1="154" x2="366" y2="178" stroke="#D97706" strokeWidth="3.2" markerEnd="url(#arrow-amber)" />
              </g>
              {showLabels && (
                <g>
                  <rect x="36" y="34" width="290" height="46" rx="8" fill="#FFFBEB" stroke="#FDE68A" />
                  <text x="48" y="54" fontSize="11.5" fontWeight="700" fill="#92400E">
                    {ageGroup === 'child' ? 'Kneel & Lean Child Forward: 5 Back Blows' : 'Lean Adult Forward: 5 Back Blows'}
                  </text>
                  <text x="48" y="70" fontSize="10.5" fill="#B45309">
                    Strike between shoulder blades with heel of hand
                  </text>
                </g>
              )}
            </g>
          ) : (
            <g>
              {/* Rescuer Behind Giving Inward & Upward Abdominal Thrusts */}
              <circle cx="408" cy="126" r="24" fill="#DBEAFE" stroke="#1D4ED8" strokeWidth="2" />
              <rect x="386" y="152" width="44" height="96" rx="16" fill="#DBEAFE" stroke="#1D4ED8" strokeWidth="2" />
              <path d="M 386 186 L 324 206" stroke="#1D4ED8" strokeWidth="10" strokeLinecap="round" />
              <circle cx="322" cy="206" r="11" fill="#DC2626" />
              <g className="anim-thrust-arrow">
                <line x1="316" y1="224" x2="344" y2="186" stroke="#DC2626" strokeWidth="3.5" markerEnd="url(#arrow-red)" />
              </g>
              {showLabels && (
                <g>
                  <rect x="36" y="34" width="318" height="46" rx="8" fill="#FEF2F2" stroke="#FECACA" />
                  <text x="48" y="54" fontSize="11.5" fontWeight="700" fill="#991B1B">
                    5 Abdominal Thrusts (Inward &amp; Upward J-Motion)
                  </text>
                  <text x="48" y="70" fontSize="10.5" fill="#DC2626">
                    Fist above navel, below breastbone · CPR if unresponsive
                  </text>
                </g>
              )}
            </g>
          )}
        </g>
      )}
    </g>
  );
};

/* ============================================================================
 * 3. WATER & DROWNING EMERGENCIES SCENE
 * ========================================================================== */
const WaterScene: React.FC<{
  ageGroup: AgeGroup;
  stepIndex: number;
  showLabels: boolean;
}> = ({ageGroup, stepIndex, showLabels}) => {
  const isShorePhase = stepIndex === 0;
  const isExtraction = stepIndex === 1;

  return (
    <g>
      {isShorePhase ? (
        <g>
          {/* Pool Deck / Shore */}
          <rect x="24" y="210" width="230" height="126" rx="8" fill="#E2E8F0" stroke="#94A3B8" strokeWidth="2" />
          {/* Water Surface */}
          <rect x="254" y="226" width="362" height="110" rx="8" fill="#DBEAFE" />
          <path
            d="M 254 236 Q 300 226 346 236 T 438 236 T 530 236 T 616 236"
            fill="none"
            stroke="#1D4ED8"
            strokeWidth="3"
            className="anim-wave-drift"
          />

          {/* Rescuer Braced Low on Safe Ground Extending Pole / Throw Ring */}
          <circle cx="152" cy="146" r="22" fill="#F1F5F9" stroke="#1D4ED8" strokeWidth="2.5" />
          <path d="M 152 168 L 122 210 L 180 210 Z" fill="#1D4ED8" opacity="0.85" />
          <line x1="164" y1="176" x2="430" y2="224" stroke="#D97706" strokeWidth="5" strokeLinecap="round" />
          <circle cx="436" cy="226" r="14" fill="none" stroke="#DC2626" strokeWidth="6" />

          {/* Person in Water */}
          <circle cx="476" cy="224" r={ageGroup === 'infant' ? 16 : 20} fill="#F1F5F9" stroke="#334155" strokeWidth="2.5" />

          {showLabels && (
            <g>
              <rect x="34" y="34" width="320" height="46" rx="8" fill="#EFF6FF" stroke="#BFDBFE" />
              <text x="48" y="54" fontSize="11.5" fontWeight="700" fill="#1E3A8A">
                {ageGroup === 'infant'
                  ? 'Bathtub/Shallow Water: Lift Out Immediately'
                  : 'Reach or Throw Aid from Braced Safe Ground'}
              </text>
              <text x="48" y="70" fontSize="10.5" fill="#1D4ED8">
                Call lifeguards/EMS first · Avoid entering deep current
              </text>
            </g>
          )}
        </g>
      ) : (
        <g>
          {/* Dry Ground Extraction & Hypoxia Breaths / Dry Chest AED */}
          <rect x="44" y="290" width="552" height="16" rx="5" fill="#CBD5E1" />
          <circle cx="164" cy="240" r={ageGroup === 'infant' ? 28 : 34} fill="#F1F5F9" stroke="#334155" strokeWidth="2.5" />
          <g className={stepIndex === 2 ? 'anim-lung-expand' : ''}>
            <rect x="206" y="216" width="210" height="66" rx="26" fill="#DBEAFE" stroke="#1D4ED8" strokeWidth="2.5" />
          </g>
          <path d="M 416 244 L 548 258 L 548 286 L 416 286 Z" fill="#F1F5F9" stroke="#334155" strokeWidth="2.5" />

          {stepIndex === 2 && (
            <g>
              <path
                d="M 122 152 Q 148 188 158 206"
                fill="none"
                stroke="#1D4ED8"
                strokeWidth="3.2"
                strokeDasharray="5 4"
                markerEnd="url(#arrow-blue)"
              />
              <rect x="40" y="34" width="320" height="46" rx="8" fill="#EFF6FF" stroke="#BFDBFE" />
              <text x="54" y="54" fontSize="11.5" fontWeight="700" fill="#1E3A8A">
                5 Initial Rescue Breaths (Hypoxia Priority)
              </text>
              <text x="54" y="70" fontSize="10.5" fill="#1D4ED8">
                Then 30:2 CPR · NEVER press abdomen to drain water
              </text>
            </g>
          )}

          {(isExtraction || stepIndex === 3) && showLabels && (
            <g>
              <rect x="40" y="34" width="330" height="46" rx="8" fill="#ECFDF5" stroke="#A7F3D0" />
              <text x="54" y="54" fontSize="11.5" fontWeight="700" fill="#065F46">
                {isExtraction
                  ? 'Flat on Dry Surface · Shield from Wind & Cold'
                  : 'Wipe Chest Dry Before AED · PLS if Breathing Returns'}
              </text>
              <text x="54" y="70" fontSize="10.5" fill="#059669">
                Mandatory medical check after any water submersion
              </text>
            </g>
          )}
        </g>
      )}
    </g>
  );
};

/* ============================================================================
 * 4. RECOVERY POSITION (PLS) SCENE
 * ========================================================================== */
const RecoveryScene: React.FC<{
  ageGroup: AgeGroup;
  stepIndex: number;
  showLabels: boolean;
}> = ({ageGroup, stepIndex, showLabels}) => {
  return (
    <g>
      <rect x="44" y="292" width="552" height="14" rx="5" fill="#CBD5E1" />

      {ageGroup === 'infant' ? (
        <g>
          {/* Rescuer Cradling Infant Laterally */}
          <path d="M 160 220 Q 310 296 460 220" fill="none" stroke="#94A3B8" strokeWidth="26" strokeLinecap="round" opacity="0.35" />
          <rect x="220" y="182" width="188" height="72" rx="34" fill="#ECFDF5" stroke="#059669" strokeWidth="2.5" />
          <circle cx="204" cy="218" r="34" fill="#F1F5F9" stroke="#059669" strokeWidth="2.5" />
          <line x1="176" y1="226" x2="150" y2="236" stroke="#059669" strokeWidth="2.5" markerEnd="url(#arrow-emerald)" />
          {showLabels && (
            <g>
              <rect x="36" y="34" width="330" height="46" rx="8" fill="#ECFDF5" stroke="#A7F3D0" />
              <text x="50" y="54" fontSize="11.5" fontWeight="700" fill="#065F46">
                Infant Lateral Cradle · Head Neutral &amp; Slightly Low
              </text>
              <text x="50" y="70" fontSize="10.5" fill="#059669">
                Drains fluids safely · Keep warm &amp; watch chest rise
              </text>
            </g>
          )}
        </g>
      ) : (
        <g>
          {stepIndex < 2 ? (
            /* Steps 1-2: Supine Alignment + Far Hand Under Cheek + Bent Knee */
            <g>
              <circle cx="152" cy="236" r="36" fill="#F1F5F9" stroke="#334155" strokeWidth="2.5" />
              <rect x="194" y="212" width="184" height="70" rx="22" fill="#E2E8F0" stroke="#334155" strokeWidth="2.5" />
              {/* Near Arm at 90 deg */}
              <path d="M 224 212 L 224 148 L 184 148" fill="none" stroke="#059669" strokeWidth="10" strokeLinecap="round" />
              {/* Far Hand on Cheek */}
              {stepIndex === 1 && (
                <path d="M 264 252 Q 214 218 176 234" fill="none" stroke="#1D4ED8" strokeWidth="8" strokeLinecap="round" />
              )}
              {/* Legs / Bent Far Knee */}
              <path
                d={stepIndex === 1 ? 'M 378 242 L 456 188 L 520 284' : 'M 378 244 L 548 260'}
                fill="none"
                stroke="#334155"
                strokeWidth="18"
                strokeLinecap="round"
                opacity="0.35"
              />
              {stepIndex === 1 && (
                <path d="M 456 172 Q 456 130 426 118" fill="none" stroke="#059669" strokeWidth="3" markerEnd="url(#arrow-emerald)" />
              )}
            </g>
          ) : (
            /* Steps 3-4: Stable Side Position with 90 deg Knee Lock & Tilted Head */
            <g>
              <circle cx="164" cy="242" r="34" fill="#F1F5F9" stroke="#059669" strokeWidth="2.8" transform="rotate(-14 164 242)" />
              <ellipse cx="294" cy="246" rx="96" ry="38" fill="#ECFDF5" stroke="#059669" strokeWidth="2.5" />
              {/* Hand under Cheek */}
              <circle cx="182" cy="264" r="11" fill="#1D4ED8" opacity="0.8" />
              {/* Upper Knee 90 deg Stability Lock */}
              <path d="M 372 240 L 424 196 L 444 282" fill="none" stroke="#059669" strokeWidth="16" strokeLinecap="round" opacity="0.65" />
              <path d="M 384 264 L 540 274" fill="none" stroke="#334155" strokeWidth="16" strokeLinecap="round" opacity="0.3" />
              <line x1="142" y1="254" x2="112" y2="274" stroke="#059669" strokeWidth="2.8" markerEnd="url(#arrow-emerald)" />
            </g>
          )}

          {showLabels && (
            <g>
              <rect x="36" y="34" width="330" height="46" rx="8" fill="#ECFDF5" stroke="#A7F3D0" />
              <text x="50" y="54" fontSize="11.5" fontWeight="700" fill="#065F46">
                {stepIndex < 2
                  ? 'Near Arm 90° · Far Hand on Cheek · Bend Far Knee'
                  : 'Stable Side Roll · 90° Knee Lock · Mouth Downward'}
              </text>
              <text x="50" y="70" fontSize="10.5" fill="#059669">
                Only for unresponsive victims who ARE breathing normally
              </text>
            </g>
          )}
        </g>
      )}
    </g>
  );
};

/* ============================================================================
 * 5. SEVERE BLEEDING SCENE
 * ========================================================================== */
const BleedingScene: React.FC<{
  ageGroup: AgeGroup;
  stepIndex: number;
  showLabels: boolean;
}> = ({ageGroup, stepIndex, showLabels}) => {
  return (
    <g>
      {/* Injured Limb Representation */}
      <rect x="110" y="196" width="420" height="72" rx="36" fill="#F1F5F9" stroke="#334155" strokeWidth="2.5" />
      {/* Wound Site */}
      <ellipse cx="320" cy="212" rx="34" ry="12" fill="#FECACA" stroke="#DC2626" strokeWidth="2" />

      {/* Stacked Sterile Gauze */}
      <rect x="276" y="178" width="88" height="26" rx="5" fill="#FFFFFF" stroke="#64748B" strokeWidth="2" />
      {stepIndex >= 1 && (
        <rect x="272" y="156" width="96" height="20" rx="5" fill="#F8FAFC" stroke="#DC2626" strokeWidth="2" />
      )}

      {/* Roller Bandage Wrap on Step 2+ */}
      {stepIndex >= 2 && (
        <g>
          <rect x="266" y="190" width="108" height="84" rx="8" fill="#1D4ED8" opacity="0.2" stroke="#1D4ED8" strokeWidth="2" strokeDasharray="5 3" />
          <circle cx="508" cy="232" r="12" fill="#10B981" opacity="0.85" />
          <text x="508" y="266" textAnchor="middle" fontSize="10.5" fontWeight="700" fill="#065F46">
            Distal Warmth OK
          </text>
        </g>
      )}

      {/* Direct Pressure Arrows */}
      <g className="anim-cpr-hand">
        <line x1="300" y1="92" x2="300" y2="148" stroke="#DC2626" strokeWidth="3.5" markerEnd="url(#arrow-red)" />
        <line x1="340" y1="92" x2="340" y2="148" stroke="#DC2626" strokeWidth="3.5" markerEnd="url(#arrow-red)" />
      </g>

      {showLabels && (
        <g>
          <rect x="36" y="34" width="352" height="46" rx="8" fill="#FEF2F2" stroke="#FECACA" />
          <text x="50" y="54" fontSize="11.5" fontWeight="700" fill="#991B1B">
            {ageGroup === 'infant'
              ? 'Infant: Localized 2-Finger Gauze Pressure (No Tight Bands)'
              : 'Firm Direct Pressure 10+ Min · Stack Pads, Never Lift First'}
          </text>
          <text x="50" y="70" fontSize="10.5" fill="#DC2626">
            {stepIndex === 3 ? 'Lay flat, cover with thermal blanket, nothing by mouth' : 'Check finger/toe warmth after bandaging'}
          </text>
        </g>
      )}
    </g>
  );
};

/* ============================================================================
 * 6. THERMAL BURNS SCENE
 * ========================================================================== */
const BurnsScene: React.FC<{
  ageGroup: AgeGroup;
  stepIndex: number;
  showLabels: boolean;
}> = ({ageGroup, stepIndex, showLabels}) => {
  return (
    <g>
      {/* Forearm under Tap vs Cling Film */}
      <rect x="130" y="216" width="380" height="62" rx="30" fill="#F1F5F9" stroke="#334155" strokeWidth="2.5" />
      <ellipse cx="320" cy="228" rx="56" ry="18" fill="#FCA5A5" stroke="#DC2626" strokeWidth="2" />

      {stepIndex <= 1 ? (
        <g>
          {/* Running Water Tap Stream */}
          <path d="M 240 94 L 306 94 Q 320 94 320 112 L 320 124" fill="none" stroke="#64748B" strokeWidth="14" strokeLinecap="round" />
          <g className="anim-water-stream">
            <line x1="306" y1="130" x2="306" y2="218" stroke="#0284C7" strokeWidth="3" />
            <line x1="320" y1="130" x2="320" y2="218" stroke="#0284C7" strokeWidth="3" />
            <line x1="334" y1="130" x2="334" y2="218" stroke="#0284C7" strokeWidth="3" />
          </g>
          <rect x="410" y="138" width="142" height="44" rx="8" fill="#EFF6FF" stroke="#BFDBFE" />
          <text x="481" y="158" textAnchor="middle" fontSize="12" fontWeight="700" fill="#1E3A8A">
            20 Minutes
          </text>
          <text x="481" y="173" textAnchor="middle" fontSize="10" fill="#1D4ED8">
            15–20 °C Running Water
          </text>
        </g>
      ) : (
        <g>
          {/* Loose Clean Cling Film Lengthwise */}
          <rect
            x="244"
            y="204"
            width="152"
            height="48"
            rx="10"
            fill="#E0F2FE"
            opacity="0.72"
            stroke="#0284C7"
            strokeWidth="2"
            strokeDasharray="6 3"
          />
          <text x="320" y="188" textAnchor="middle" fontSize="11.5" fontWeight="700" fill="#0369A1">
            Loose Cling Film (Never Tight Around Limb)
          </text>
        </g>
      )}

      {showLabels && (
        <g>
          <rect x="36" y="34" width="356" height="46" rx="8" fill="#FFFBEB" stroke="#FDE68A" />
          <text x="50" y="54" fontSize="11.5" fontWeight="700" fill="#92400E">
            {ageGroup === 'infant'
              ? 'Infant/Child: Lukewarm-Cool Water + Keep Rest of Body Warm'
              : 'Cool 20 Min · Remove Jewelry · Never Use Ice, Butter, or Toothpaste'}
          </text>
          <text x="50" y="70" fontSize="10.5" fill="#B45309">
            Never pop blisters or peel stuck clothing
          </text>
        </g>
      )}
    </g>
  );
};

/* ============================================================================
 * 7. FAINTING & SEIZURES SCENE
 * ========================================================================== */
const SeizureScene: React.FC<{
  ageGroup: AgeGroup;
  stepIndex: number;
  showLabels: boolean;
}> = ({ageGroup, stepIndex, showLabels}) => {
  return (
    <g>
      <rect x="44" y="292" width="552" height="14" rx="5" fill="#CBD5E1" />
      {/* Soft Head Cushion */}
      <rect x="114" y="264" width="84" height="24" rx="10" fill="#DBEAFE" stroke="#1D4ED8" strokeWidth="2" />
      <circle cx="156" cy="236" r={ageGroup === 'infant' ? 28 : 34} fill="#F1F5F9" stroke="#334155" strokeWidth="2.5" />
      <rect x="196" y="218" width="214" height="66" rx="26" fill="#E2E8F0" stroke="#334155" strokeWidth="2.5" />
      <path d="M 410 248 L 538 262 L 538 286 L 410 286 Z" fill="#F1F5F9" stroke="#334155" strokeWidth="2.5" />

      {/* Cleared Hazard Furniture (Moved Away) */}
      <g opacity="0.65">
        <rect x="504" y="136" width="82" height="46" rx="8" fill="#FEF3C7" stroke="#D97706" strokeDasharray="4 3" />
        <text x="545" y="163" textAnchor="middle" fontSize="10.5" fontWeight="700" fill="#92400E">
          Clear Hazards
        </text>
        <line x1="466" y1="158" x2="498" y2="158" stroke="#D97706" strokeWidth="2.5" markerEnd="url(#arrow-amber)" />
      </g>

      {/* Timer Badge Inside Diagram */}
      <rect x="260" y="128" width="136" height="44" rx="10" fill="#EFF6FF" stroke="#1D4ED8" strokeWidth="1.8" />
      <text x="328" y="148" textAnchor="middle" fontSize="11.5" fontWeight="700" fill="#1E3A8A">
        Time Episode
      </text>
      <text x="328" y="164" textAnchor="middle" fontSize="10.5" fill="#1D4ED8">
        &gt;5 min = Call EMS
      </text>

      {showLabels && (
        <g>
          <rect x="36" y="34" width="368" height="46" rx="8" fill="#EFF6FF" stroke="#BFDBFE" />
          <text x="50" y="54" fontSize="11.5" fontWeight="700" fill="#1E3A8A">
            {stepIndex >= 2
              ? 'After Jerking Stops: Roll Gently to Recovery Position (PLS)'
              : 'Pad Head · Do NOT Restrain Limbs · NOTHING in Mouth'}
          </text>
          <text x="50" y="70" fontSize="10.5" fill="#1D4ED8">
            No food/drink until completely alert and swallowing normally
          </text>
        </g>
      )}
    </g>
  );
};

/* ============================================================================
 * 8. INTERACTIVE FIRST AID KIT COMPARTMENTS SCENE
 * ========================================================================== */
const KitScene: React.FC<{
  selectedKitId: string;
  onSelectKit: (id: string) => void;
  lang: LangCode;
  showLabels: boolean;
}> = ({selectedKitId, onSelectKit, lang, showLabels}) => {
  return (
    <g>
      {/* Outer Case */}
      <rect x="26" y="42" width="588" height="304" rx="18" fill="#F1F5F9" stroke="#475569" strokeWidth="2.5" />
      <rect x="245" y="20" width="150" height="22" rx="11" fill="#DC2626" />
      <text x="320" y="35" textAnchor="middle" fontSize="11" fontWeight="700" fill="#FFFFFF">
        FIRST AID KIT
      </text>

      {KIT_COMPARTMENTS.map((comp) => {
        const selected = comp.id === selectedKitId;
        return (
          <g
            key={comp.id}
            onClick={() => onSelectKit(comp.id)}
            className="cursor-pointer"
            role="button"
            tabIndex={0}
            aria-label={pickText(comp.title, lang)}
          >
            <rect
              x={comp.x}
              y={comp.y}
              width={comp.w}
              height={comp.h}
              rx="12"
              fill="#FFFFFF"
              stroke={selected ? comp.color : '#CBD5E1'}
              strokeWidth={selected ? 3 : 1.8}
            />
            <rect x={comp.x + 12} y={comp.y + 12} width="10" height="28" rx="4" fill={comp.color} />
            <text x={comp.x + 32} y={comp.y + 30} fontSize="13" fontWeight="700" fill="#0F172A">
              {pickText(comp.title, lang).slice(0, 28)}
            </text>
            {showLabels && (
              <text x={comp.x + 32} y={comp.y + 58} fontSize="11" fill="#475569">
                {pickText(comp.items[0], lang).slice(0, 34)}
              </text>
            )}
            <text x={comp.x + 32} y={comp.y + 94} fontSize="11" fontWeight="600" fill={comp.color}>
              {selected ? 'Active Selection' : 'Click to inspect'}
            </text>
          </g>
        );
      })}
    </g>
  );
};
