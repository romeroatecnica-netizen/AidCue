import type {LangCode} from '../types';

export const CANONICAL_ORIGIN = 'https://aidcue.bastelar.com';

export interface LanguageMeta {
  code: LangCode;
  nativeName: string;
  englishName: string;
  dir: 'ltr' | 'rtl';
  hreflang: string;
}

export const SUPPORTED_LANGUAGES: LanguageMeta[] = [
  {code: 'en', nativeName: 'English', englishName: 'English', dir: 'ltr', hreflang: 'en'},
  {code: 'es', nativeName: 'Español', englishName: 'Spanish', dir: 'ltr', hreflang: 'es'},
  {code: 'fr', nativeName: 'Français', englishName: 'French', dir: 'ltr', hreflang: 'fr'},
  {code: 'de', nativeName: 'Deutsch', englishName: 'German', dir: 'ltr', hreflang: 'de'},
  {code: 'pt', nativeName: 'Português', englishName: 'Portuguese', dir: 'ltr', hreflang: 'pt'},
  {code: 'ar', nativeName: 'العربية', englishName: 'Arabic', dir: 'rtl', hreflang: 'ar'},
  {code: 'hi', nativeName: 'हिन्दी', englishName: 'Hindi', dir: 'ltr', hreflang: 'hi'},
  {code: 'ru', nativeName: 'Русский', englishName: 'Russian', dir: 'ltr', hreflang: 'ru'},
  {code: 'zh', nativeName: '中文', englishName: 'Chinese', dir: 'ltr', hreflang: 'zh'},
  {code: 'ja', nativeName: '日本語', englishName: 'Japanese', dir: 'ltr', hreflang: 'ja'},
];

const SUPPORTED_SET = new Set<string>(SUPPORTED_LANGUAGES.map((l) => l.code));
const LANG_STORAGE_KEY = 'aidcue_selected_lang';

export function isSupportedLang(code: string | null | undefined): code is LangCode {
  return typeof code === 'string' && SUPPORTED_SET.has(code);
}

export function getLanguageMeta(code: LangCode): LanguageMeta {
  return SUPPORTED_LANGUAGES.find((l) => l.code === code) ?? SUPPORTED_LANGUAGES[0];
}

export function getCanonicalUrl(lang: LangCode): string {
  return lang === 'en' ? `${CANONICAL_ORIGIN}/` : `${CANONICAL_ORIGIN}/?lang=${lang}`;
}

export function detectInitialLanguage(): LangCode {
  if (typeof window === 'undefined') return 'en';

  const params = new URLSearchParams(window.location.search);
  const queryLang = params.get('lang')?.toLowerCase().split('-')[0];
  if (isSupportedLang(queryLang)) {
    return queryLang;
  }

  try {
    const stored = window.localStorage.getItem(LANG_STORAGE_KEY);
    if (isSupportedLang(stored)) {
      return stored;
    }
  } catch {
    // Ignore storage read errors in restricted environments
  }

  const navLangs = navigator.languages?.length ? navigator.languages : [navigator.language];
  for (const candidate of navLangs) {
    if (!candidate) continue;
    const base = candidate.toLowerCase().split('-')[0];
    if (isSupportedLang(base)) {
      return base;
    }
  }

  return 'en';
}

export function persistLanguagePreference(lang: LangCode): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(LANG_STORAGE_KEY, lang);
  } catch {
    // Ignore storage write errors
  }

  try {
    const url = new URL(window.location.href);
    if (lang === 'en') {
      url.searchParams.delete('lang');
    } else {
      url.searchParams.set('lang', lang);
    }
    window.history.replaceState(null, '', url.pathname + url.search + url.hash);
  } catch {
    // Ignore history state errors
  }
}
