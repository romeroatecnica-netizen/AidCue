import type {
  AgeGroup,
  LangCode,
  MistakeRecord,
  ProfileData,
  ProfileStore,
  ProtocolId,
} from '../types';

const STORAGE_KEY = 'aidcue_profiles_v1';

function todayIsoDate(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function yesterdayIsoDate(): string {
  const now = new Date();
  now.setDate(now.getDate() - 1);
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function createDefaultProfile(name = 'Responder 1'): ProfileData {
  const today = todayIsoDate();
  return {
    id: `prof_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    name,
    createdAt: new Date().toISOString(),
    xp: 0,
    streakDays: 1,
    lastActiveDate: today,
    reviewedProtocols: [],
    completedScenarios: {},
    accuracyByCategory: {},
    accuracyByAge: {
      adult: {attempts: 0, correct: 0},
      child: {attempts: 0, correct: 0},
      infant: {attempts: 0, correct: 0},
    },
    mistakeLog: [],
    earnedBadges: [],
    visitedLanguages: ['en'],
  };
}

export function loadProfileStore(): ProfileStore {
  if (typeof window === 'undefined') {
    const def = createDefaultProfile();
    return {activeProfileId: def.id, profiles: [def]};
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const def = createDefaultProfile();
      const store: ProfileStore = {activeProfileId: def.id, profiles: [def]};
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
      return store;
    }
    const parsed = JSON.parse(raw) as ProfileStore;
    if (!parsed || !Array.isArray(parsed.profiles) || parsed.profiles.length === 0) {
      const def = createDefaultProfile();
      return {activeProfileId: def.id, profiles: [def]};
    }
    const activeExists = parsed.profiles.some((p) => p.id === parsed.activeProfileId);
    return {
      activeProfileId: activeExists ? parsed.activeProfileId : parsed.profiles[0].id,
      profiles: parsed.profiles.map(normalizeProfile),
    };
  } catch {
    const def = createDefaultProfile();
    return {activeProfileId: def.id, profiles: [def]};
  }
}

export function saveProfileStore(store: ProfileStore): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch {
    // Ignore storage quota errors
  }
}

function normalizeProfile(raw: Partial<ProfileData>): ProfileData {
  const base = createDefaultProfile(raw.name || 'Responder');
  return {
    ...base,
    ...raw,
    id: typeof raw.id === 'string' && raw.id ? raw.id : base.id,
    name: typeof raw.name === 'string' && raw.name.trim() ? raw.name.trim() : base.name,
    xp: typeof raw.xp === 'number' && Number.isFinite(raw.xp) ? Math.max(0, raw.xp) : 0,
    streakDays:
      typeof raw.streakDays === 'number' && Number.isFinite(raw.streakDays)
        ? Math.max(1, raw.streakDays)
        : 1,
    reviewedProtocols: Array.isArray(raw.reviewedProtocols) ? raw.reviewedProtocols : [],
    completedScenarios:
      raw.completedScenarios && typeof raw.completedScenarios === 'object'
        ? raw.completedScenarios
        : {},
    accuracyByCategory:
      raw.accuracyByCategory && typeof raw.accuracyByCategory === 'object'
        ? raw.accuracyByCategory
        : {},
    accuracyByAge: {
      adult: raw.accuracyByAge?.adult ?? {attempts: 0, correct: 0},
      child: raw.accuracyByAge?.child ?? {attempts: 0, correct: 0},
      infant: raw.accuracyByAge?.infant ?? {attempts: 0, correct: 0},
    },
    mistakeLog: Array.isArray(raw.mistakeLog) ? raw.mistakeLog : [],
    earnedBadges: Array.isArray(raw.earnedBadges) ? raw.earnedBadges : [],
    visitedLanguages: Array.isArray(raw.visitedLanguages) ? raw.visitedLanguages : ['en'],
  };
}

export function touchProfileActivity(profile: ProfileData): ProfileData {
  const today = todayIsoDate();
  if (profile.lastActiveDate === today) {
    return profile;
  }
  const isConsecutive = profile.lastActiveDate === yesterdayIsoDate();
  return {
    ...profile,
    streakDays: isConsecutive ? profile.streakDays + 1 : 1,
    lastActiveDate: today,
  };
}

export function evaluateBadges(profile: ProfileData): string[] {
  const badges = new Set<string>(profile.earnedBadges);

  if (profile.reviewedProtocols.length >= 1 || profile.xp >= 15) {
    badges.add('first_step');
  }
  if (profile.reviewedProtocols.length >= 4) {
    badges.add('visual_scholar');
  }
  if (profile.reviewedProtocols.length >= 8) {
    badges.add('full_curriculum');
  }
  if (Object.keys(profile.completedScenarios).length >= 1) {
    badges.add('scenario_responder');
  }
  if (Object.keys(profile.completedScenarios).length >= 5) {
    badges.add('crisis_commander');
  }
  if (profile.accuracyByAge.infant.correct >= 3 || profile.accuracyByAge.child.correct >= 3) {
    badges.add('pediatric_guardian');
  }
  if ((profile.accuracyByCategory.water?.correct ?? 0) >= 2) {
    badges.add('water_watcher');
  }
  if (profile.xp >= 250) {
    badges.add('xp_250');
  }
  if (profile.visitedLanguages.length >= 2) {
    badges.add('multilingual');
  }

  return Array.from(badges);
}

export function recordPracticeResult(
  profile: ProfileData,
  opts: {
    itemId: string;
    protocolId: ProtocolId;
    ageGroup: AgeGroup;
    isCorrect: boolean;
    xpDelta: number;
    fromClinic?: boolean;
  },
): ProfileData {
  const touched = touchProfileActivity(profile);
  const catPrev = touched.accuracyByCategory[opts.protocolId] ?? {attempts: 0, correct: 0};
  const agePrev = touched.accuracyByAge[opts.ageGroup] ?? {attempts: 0, correct: 0};

  let nextMistakes: MistakeRecord[] = [...touched.mistakeLog];
  if (!opts.isCorrect) {
    const idx = nextMistakes.findIndex((m) => m.itemId === opts.itemId);
    if (idx >= 0) {
      nextMistakes[idx] = {
        ...nextMistakes[idx],
        errorCount: nextMistakes[idx].errorCount + 1,
        lastMissedAt: new Date().toISOString(),
      };
    } else {
      nextMistakes.push({
        itemId: opts.itemId,
        protocolId: opts.protocolId,
        ageGroup: opts.ageGroup,
        errorCount: 1,
        lastMissedAt: new Date().toISOString(),
      });
    }
  } else if (opts.fromClinic) {
    nextMistakes = nextMistakes.filter((m) => m.itemId !== opts.itemId);
  }

  const updated: ProfileData = {
    ...touched,
    xp: touched.xp + opts.xpDelta,
    accuracyByCategory: {
      ...touched.accuracyByCategory,
      [opts.protocolId]: {
        attempts: catPrev.attempts + 1,
        correct: catPrev.correct + (opts.isCorrect ? 1 : 0),
      },
    },
    accuracyByAge: {
      ...touched.accuracyByAge,
      [opts.ageGroup]: {
        attempts: agePrev.attempts + 1,
        correct: agePrev.correct + (opts.isCorrect ? 1 : 0),
      },
    },
    mistakeLog: nextMistakes,
  };

  return {
    ...updated,
    earnedBadges: evaluateBadges(updated),
  };
}

export function recordLanguageVisit(profile: ProfileData, lang: LangCode): ProfileData {
  if (profile.visitedLanguages.includes(lang)) return profile;
  const updated: ProfileData = {
    ...profile,
    visitedLanguages: [...profile.visitedLanguages, lang],
  };
  return {
    ...updated,
    earnedBadges: evaluateBadges(updated),
  };
}

export function exportProfileJson(profile: ProfileData): string {
  return JSON.stringify(
    {
      schema: 'aidcue-profile-v1',
      exportedAt: new Date().toISOString(),
      profile,
    },
    null,
    2,
  );
}

export function parseImportedProfileJson(
  rawText: string,
): {ok: true; profile: ProfileData} | {ok: false; error: string} {
  try {
    const data = JSON.parse(rawText) as {schema?: string; profile?: Partial<ProfileData>} & Partial<ProfileData>;
    const candidate = data?.schema === 'aidcue-profile-v1' && data.profile ? data.profile : data;
    if (!candidate || typeof candidate !== 'object' || typeof candidate.name !== 'string') {
      return {ok: false, error: 'INVALID_SCHEMA'};
    }
    const normalized = normalizeProfile({
      ...candidate,
      id: `prof_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    });
    return {
      ok: true,
      profile: {
        ...normalized,
        earnedBadges: evaluateBadges(normalized),
      },
    };
  } catch {
    return {ok: false, error: 'INVALID_JSON'};
  }
}
