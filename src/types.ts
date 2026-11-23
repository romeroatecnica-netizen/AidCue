export type LangCode =
  | 'en'
  | 'es'
  | 'fr'
  | 'de'
  | 'pt'
  | 'ar'
  | 'hi'
  | 'ru'
  | 'zh'
  | 'ja';

export type AgeGroup = 'adult' | 'child' | 'infant';

export type ProtocolId =
  | 'cpr'
  | 'choking'
  | 'water'
  | 'recovery'
  | 'bleeding'
  | 'burns'
  | 'fainting_seizure'
  | 'first_aid_kit';

export type TrainingMode = 'simulator' | 'guides' | 'drill' | 'clinic';

export type LocalizedText = Record<LangCode, string>;

export interface ProtocolStep {
  title: LocalizedText;
  instruction: LocalizedText;
  caution: LocalizedText;
  ageNotes: Record<AgeGroup, LocalizedText>;
}

export interface ProtocolAgeComparison {
  compressionTarget: Record<AgeGroup, LocalizedText>;
  compressionDepth: Record<AgeGroup, LocalizedText>;
  ventilationOrAirway: Record<AgeGroup, LocalizedText>;
  criticalRule: Record<AgeGroup, LocalizedText>;
}

export interface ProtocolDefinition {
  id: ProtocolId;
  accent: 'red' | 'blue' | 'emerald' | 'amber';
  supportsAgeToggle: boolean;
  title: LocalizedText;
  summary: LocalizedText;
  callEmergencyWhen: LocalizedText[];
  steps: ProtocolStep[];
  ageComparison: ProtocolAgeComparison;
}

export interface ScenarioChoice {
  id: string;
  label: LocalizedText;
  isCorrect: boolean;
  feedback: LocalizedText;
  criticalErrorReason?: LocalizedText;
  outcomeImpact: LocalizedText;
}

export interface ScenarioStep {
  id: string;
  situation: LocalizedText;
  visualStateLabel: LocalizedText;
  choices: ScenarioChoice[];
}

export interface ScenarioDefinition {
  id: string;
  protocolId: ProtocolId;
  ageGroup: AgeGroup;
  environmentTag: LocalizedText;
  title: LocalizedText;
  brief: LocalizedText;
  steps: ScenarioStep[];
}

export interface TriageQuestion {
  id: string;
  protocolId: ProtocolId;
  ageGroup: AgeGroup;
  prompt: LocalizedText;
  options: LocalizedText[];
  correctIndex: number;
  explanation: LocalizedText;
}

export interface KitCompartment {
  id: string;
  title: LocalizedText;
  purpose: LocalizedText;
  pediatricNote: LocalizedText;
  items: LocalizedText[];
  x: number;
  y: number;
  w: number;
  h: number;
  color: string;
}

export interface CategoryStats {
  attempts: number;
  correct: number;
}

export interface MistakeRecord {
  itemId: string;
  protocolId: ProtocolId;
  ageGroup: AgeGroup;
  errorCount: number;
  lastMissedAt: string;
}

export interface ProfileData {
  id: string;
  name: string;
  createdAt: string;
  xp: number;
  streakDays: number;
  lastActiveDate: string;
  reviewedProtocols: ProtocolId[];
  completedScenarios: Record<string, {bestScore: number; totalSteps: number; completedAt: string}>;
  accuracyByCategory: Partial<Record<ProtocolId, CategoryStats>>;
  accuracyByAge: Record<AgeGroup, CategoryStats>;
  mistakeLog: MistakeRecord[];
  earnedBadges: string[];
  visitedLanguages: LangCode[];
}

export interface ProfileStore {
  activeProfileId: string;
  profiles: ProfileData[];
}
