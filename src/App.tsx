import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {
  Activity,
  BookOpen,
  Globe,
  Stethoscope,
  User,
  Zap,
} from 'lucide-react';
import {ClinicMode} from './components/ClinicMode';
import {DrillMode} from './components/DrillMode';
import {
  EditorialAndMonetization,
  MediaNetAdSlot,
} from './components/EditorialAndMonetization';
import {GuidesMode} from './components/GuidesMode';
import {ProfileModal} from './components/ProfileModal';
import {SimulatorMode} from './components/SimulatorMode';
import {EDITORIAL_FAQS} from './data/editorial';
import {
  CANONICAL_ORIGIN,
  SUPPORTED_LANGUAGES,
  detectInitialLanguage,
  persistLanguagePreference,
} from './i18n/config';
import {pickText} from './i18n/helpers';
import {UI_STRINGS} from './i18n/uiStrings';
import type {
  AgeGroup,
  LangCode,
  ProfileData,
  ProfileStore,
  ProtocolId,
  TrainingMode,
} from './types';
import {syncDocumentSeo} from './utils/seo';
import {
  createDefaultProfile,
  evaluateBadges,
  loadProfileStore,
  recordLanguageVisit,
  recordPracticeResult,
  saveProfileStore,
  touchProfileActivity,
} from './utils/storage';

export default function App() {
  const [lang, setLang] = useState<LangCode>(() => detectInitialLanguage());
  const [mode, setMode] = useState<TrainingMode>('guides');
  const [store, setStore] = useState<ProfileStore>(() => loadProfileStore());
  const [profileModalOpen, setProfileModalOpen] = useState(false);

  const ui = UI_STRINGS[lang] ?? UI_STRINGS.en;

  const activeProfile: ProfileData = useMemo(() => {
    return (
      store.profiles.find((p) => p.id === store.activeProfileId) ??
      store.profiles[0]
    );
  }, [store]);

  useEffect(() => {
    saveProfileStore(store);
  }, [store]);

  useEffect(() => {
    persistLanguagePreference(lang);
    syncDocumentSeo(lang, {
      title: ui.seoTitle,
      description: ui.seoDescription,
      faqs: EDITORIAL_FAQS.map((f) => ({
        question: pickText(f.question, lang),
        answer: pickText(f.answer, lang),
      })),
    });
  }, [lang, ui.seoTitle, ui.seoDescription]);

  const updateActiveProfile = useCallback(
    (updater: (prev: ProfileData) => ProfileData) => {
      setStore((prevStore) => {
        const idx = prevStore.profiles.findIndex(
          (p) => p.id === prevStore.activeProfileId,
        );
        const targetIdx = idx >= 0 ? idx : 0;
        const nextProfiles = [...prevStore.profiles];
        nextProfiles[targetIdx] = updater(nextProfiles[targetIdx]);
        return {
          ...prevStore,
          profiles: nextProfiles,
        };
      });
    },
    [],
  );

  const handleLanguageChange = (nextLang: LangCode) => {
    setLang(nextLang);
    updateActiveProfile((p) => recordLanguageVisit(p, nextLang));
  };

  const handleReviewProtocol = useCallback(
    (protocolId: ProtocolId) => {
      updateActiveProfile((prev) => {
        if (prev.reviewedProtocols.includes(protocolId)) {
          return prev;
        }
        const touched = touchProfileActivity(prev);
        const updated: ProfileData = {
          ...touched,
          xp: touched.xp + 10,
          reviewedProtocols: [...touched.reviewedProtocols, protocolId],
        };
        return {
          ...updated,
          earnedBadges: evaluateBadges(updated),
        };
      });
    },
    [updateActiveProfile],
  );

  const handleRecordAnswer = useCallback(
    (opts: {
      itemId: string;
      protocolId: ProtocolId;
      ageGroup: AgeGroup;
      isCorrect: boolean;
      xpDelta: number;
      fromClinic?: boolean;
    }) => {
      updateActiveProfile((prev) => recordPracticeResult(prev, opts));
    },
    [updateActiveProfile],
  );

  const handleCompleteScenario = useCallback(
    (scenarioId: string, score: number, totalSteps: number) => {
      updateActiveProfile((prev) => {
        const touched = touchProfileActivity(prev);
        const existing = touched.completedScenarios[scenarioId];
        const bestScore = existing ? Math.max(existing.bestScore, score) : score;
        const updated: ProfileData = {
          ...touched,
          xp: touched.xp + 25,
          completedScenarios: {
            ...touched.completedScenarios,
            [scenarioId]: {
              bestScore,
              totalSteps,
              completedAt: new Date().toISOString(),
            },
          },
        };
        return {
          ...updated,
          earnedBadges: evaluateBadges(updated),
        };
      });
    },
    [updateActiveProfile],
  );

  const handleCreateProfile = (name: string) => {
    const created = createDefaultProfile(name);
    setStore((prev) => ({
      activeProfileId: created.id,
      profiles: [...prev.profiles, created],
    }));
  };

  const handleRenameProfile = (id: string, nextName: string) => {
    setStore((prev) => ({
      ...prev,
      profiles: prev.profiles.map((p) =>
        p.id === id ? {...p, name: nextName} : p,
      ),
    }));
  };

  const handleDeleteProfile = (id: string) => {
    setStore((prev) => {
      if (prev.profiles.length <= 1) return prev;
      const remaining = prev.profiles.filter((p) => p.id !== id);
      const nextActive =
        prev.activeProfileId === id ? remaining[0].id : prev.activeProfileId;
      return {
        activeProfileId: nextActive,
        profiles: remaining,
      };
    });
  };

  const handleImportProfile = (imported: ProfileData) => {
    setStore((prev) => ({
      activeProfileId: imported.id,
      profiles: [...prev.profiles, imported],
    }));
  };

  const switchToMode = (nextMode: TrainingMode) => {
    setMode(nextMode);
    const el = document.getElementById('trainer-workspace');
    if (el) {
      el.scrollIntoView({behavior: 'smooth', block: 'start'});
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC] text-slate-900">
      {/* Top Bar Contract: Brand — Single-line Nav — Compact Utility Controls */}
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3.5 sm:px-6">
          <a
            href={lang === 'en' ? '/' : `/?lang=${lang}`}
            onClick={(e) => {
              e.preventDefault();
              setMode('guides');
            }}
            className="font-display text-xl font-extrabold tracking-tight text-slate-900 whitespace-nowrap shrink-0"
          >
            Aid<span className="text-red-600">Cue</span>
          </a>

          <nav
            aria-label="Primary"
            className="hidden lg:flex items-center gap-6 text-sm font-medium text-slate-600"
          >
            <button
              type="button"
              onClick={() => switchToMode('simulator')}
              className={`whitespace-nowrap shrink-0 pb-0.5 transition-colors ${
                mode === 'simulator'
                  ? 'text-slate-900 border-b-2 border-red-600 font-semibold'
                  : 'hover:text-slate-900'
              }`}
            >
              {ui.navSimulator}
            </button>
            <button
              type="button"
              onClick={() => switchToMode('guides')}
              className={`whitespace-nowrap shrink-0 pb-0.5 transition-colors ${
                mode === 'guides'
                  ? 'text-slate-900 border-b-2 border-red-600 font-semibold'
                  : 'hover:text-slate-900'
              }`}
            >
              {ui.navGuides}
            </button>
            <button
              type="button"
              onClick={() => switchToMode('drill')}
              className={`whitespace-nowrap shrink-0 pb-0.5 transition-colors ${
                mode === 'drill'
                  ? 'text-slate-900 border-b-2 border-red-600 font-semibold'
                  : 'hover:text-slate-900'
              }`}
            >
              {ui.navDrill}
            </button>
            <button
              type="button"
              onClick={() => switchToMode('clinic')}
              className={`whitespace-nowrap shrink-0 pb-0.5 transition-colors ${
                mode === 'clinic'
                  ? 'text-slate-900 border-b-2 border-red-600 font-semibold'
                  : 'hover:text-slate-900'
              }`}
            >
              {ui.navClinic}
            </button>
            <a
              href="#study-guide"
              className="whitespace-nowrap shrink-0 hover:text-slate-900 transition-colors"
            >
              {ui.navGuideSection}
            </a>
          </nav>

          <div className="flex items-center gap-2.5 shrink-0">
            <label className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700">
              <Globe className="h-3.5 w-3.5 text-slate-500 shrink-0" />
              <select
                value={lang}
                onChange={(e) => handleLanguageChange(e.target.value as LangCode)}
                aria-label="Language"
                className="bg-transparent font-medium text-slate-800 focus:outline-none cursor-pointer"
              >
                {SUPPORTED_LANGUAGES.map((l) => (
                  <option key={l.code} value={l.code}>
                    {l.nativeName}
                  </option>
                ))}
              </select>
            </label>

            <button
              type="button"
              onClick={() => setProfileModalOpen(true)}
              className="inline-flex items-center gap-2 whitespace-nowrap shrink-0 rounded-lg bg-slate-900 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-slate-800 transition-colors"
            >
              <User className="h-3.5 w-3.5" />
              <span className="max-w-[90px] truncate">{activeProfile.name}</span>
              <span className="text-slate-300 tabular-nums">
                {activeProfile.xp} {ui.profileXpLabel}
              </span>
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 space-y-8">
        {/* Hero Overview */}
        <section className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-3xl space-y-3">
              <div className="text-xs font-bold text-red-600">
                {ui.heroEyebrow}
              </div>
              <h1
                className="font-display text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-slate-900 leading-tight"
                style={{textWrap: 'balance'}}
              >
                {ui.heroTitle}
              </h1>
              <p className="text-sm sm:text-base text-slate-600 leading-relaxed max-w-2xl">
                {ui.heroSubtitle}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 shrink-0">
              <button
                type="button"
                onClick={() => switchToMode('simulator')}
                className="whitespace-nowrap shrink-0 rounded-xl bg-red-600 px-5 py-3 text-sm font-bold text-white hover:bg-red-700 transition-colors"
              >
                {ui.heroCta}
              </button>
            </div>
          </div>
        </section>

        {/* Interactive Training Workspace */}
        <section id="trainer-workspace" className="space-y-5">
          {/* 4-Mode Switcher */}
          <div
            className="grid grid-cols-2 gap-2.5 sm:grid-cols-4"
            role="tablist"
            aria-label="Training Modes"
          >
            {(
              [
                {
                  id: 'simulator' as const,
                  label: ui.modeSimulatorTitle,
                  icon: Activity,
                },
                {
                  id: 'guides' as const,
                  label: ui.modeGuidesTitle,
                  icon: BookOpen,
                },
                {
                  id: 'drill' as const,
                  label: ui.modeDrillTitle,
                  icon: Zap,
                },
                {
                  id: 'clinic' as const,
                  label: ui.modeClinicTitle,
                  icon: Stethoscope,
                  count: activeProfile.mistakeLog.length,
                },
              ]
            ).map((item) => {
              const active = mode === item.id;
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setMode(item.id)}
                  className={`flex items-center justify-center gap-2 rounded-xl border px-3.5 py-3 text-xs sm:text-sm font-bold transition-colors ${
                    active
                      ? 'border-slate-900 bg-slate-900 text-white'
                      : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span className="truncate">{item.label}</span>
                  {typeof item.count === 'number' && item.count > 0 && (
                    <span
                      className={`tabular-nums text-xs ${
                        active ? 'text-amber-300' : 'text-amber-700'
                      }`}
                    >
                      ({item.count})
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {mode === 'simulator' && (
            <SimulatorMode
              lang={lang}
              ui={ui}
              profile={activeProfile}
              onRecordAnswer={handleRecordAnswer}
              onCompleteScenario={handleCompleteScenario}
            />
          )}

          {mode === 'guides' && (
            <GuidesMode
              lang={lang}
              ui={ui}
              onReviewProtocol={handleReviewProtocol}
            />
          )}

          {mode === 'drill' && (
            <DrillMode
              lang={lang}
              ui={ui}
              onRecordAnswer={handleRecordAnswer}
            />
          )}

          {mode === 'clinic' && (
            <ClinicMode
              lang={lang}
              ui={ui}
              profile={activeProfile}
              onRecordAnswer={handleRecordAnswer}
            />
          )}
        </section>

        {/* Media.net Ad Slot #1 (Between Simulator/Guides and Editorial SEO Guide) */}
        <MediaNetAdSlot
          slotId="aidcue-medianet-mid"
          label={ui.adSlotLabel}
          variant="leaderboard"
        />

        {/* Editorial SEO Reference, Affiliate Gear, FAQ & Disclaimer */}
        <EditorialAndMonetization lang={lang} ui={ui} />

        {/* Media.net Ad Slot #2 (Bottom of Page) */}
        <MediaNetAdSlot
          slotId="aidcue-medianet-bottom"
          label={ui.adSlotLabel}
          variant="rectangle"
        />
      </main>

      <footer className="border-t border-slate-200 bg-white mt-10">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-6 sm:px-6 text-xs text-slate-500">
          <div>
            {ui.footerNote} ·{' '}
            <a
              href={`${CANONICAL_ORIGIN}/`}
              className="font-medium text-slate-700 hover:underline"
            >
              {CANONICAL_ORIGIN}
            </a>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {SUPPORTED_LANGUAGES.map((l) => (
              <button
                key={l.code}
                type="button"
                onClick={() => handleLanguageChange(l.code)}
                className={`hover:text-slate-900 ${
                  l.code === lang ? 'font-bold text-slate-900 underline' : ''
                }`}
              >
                {l.nativeName}
              </button>
            ))}
          </div>
        </div>
      </footer>

      <ProfileModal
        open={profileModalOpen}
        onClose={() => setProfileModalOpen(false)}
        store={store}
        activeProfile={activeProfile}
        ui={ui}
        onSwitchProfile={(id) =>
          setStore((prev) => ({...prev, activeProfileId: id}))
        }
        onCreateProfile={handleCreateProfile}
        onRenameProfile={handleRenameProfile}
        onDeleteProfile={handleDeleteProfile}
        onImportProfile={handleImportProfile}
      />
    </div>
  );
}
