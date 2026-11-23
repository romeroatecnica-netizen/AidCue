import type {LangCode, LocalizedText} from '../types';

export function t10(
  en: string,
  es: string,
  fr: string,
  de: string,
  pt: string,
  ar: string,
  hi: string,
  ru: string,
  zh: string,
  ja: string,
): LocalizedText {
  return {en, es, fr, de, pt, ar, hi, ru, zh, ja};
}

export function pickText(text: LocalizedText, lang: LangCode): string {
  return text[lang] || text.en;
}
