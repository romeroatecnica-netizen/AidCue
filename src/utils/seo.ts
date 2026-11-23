import {
  CANONICAL_ORIGIN,
  SUPPORTED_LANGUAGES,
  getCanonicalUrl,
  getLanguageMeta,
} from '../i18n/config';
import type {LangCode} from '../types';

export interface SeoPayload {
  title: string;
  description: string;
  faqs: Array<{question: string; answer: string}>;
}

function upsertMeta(attr: 'name' | 'property', key: string, content: string): void {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function upsertLink(rel: string, href: string, hreflang?: string): void {
  const selector = hreflang
    ? `link[rel="${rel}"][hreflang="${hreflang}"]`
    : `link[rel="${rel}"]:not([hreflang])`;
  let el = document.head.querySelector<HTMLLinkElement>(selector);
  if (!el) {
    el = document.createElement('link');
    el.setAttribute('rel', rel);
    if (hreflang) {
      el.setAttribute('hreflang', hreflang);
    }
    document.head.appendChild(el);
  }
  el.setAttribute('href', href);
}

export function syncDocumentSeo(lang: LangCode, payload: SeoPayload): void {
  if (typeof document === 'undefined') return;

  const meta = getLanguageMeta(lang);
  const canonicalUrl = getCanonicalUrl(lang);

  document.documentElement.lang = lang;
  document.documentElement.dir = meta.dir;
  document.title = payload.title;

  upsertMeta('name', 'description', payload.description);
  upsertMeta('property', 'og:url', canonicalUrl);
  upsertMeta('property', 'og:title', payload.title);
  upsertMeta('property', 'og:description', payload.description);
  upsertMeta('name', 'twitter:title', payload.title);
  upsertMeta('name', 'twitter:description', payload.description);

  upsertLink('canonical', canonicalUrl);
  upsertLink('alternate', `${CANONICAL_ORIGIN}/`, 'x-default');
  for (const item of SUPPORTED_LANGUAGES) {
    upsertLink('alternate', getCanonicalUrl(item.code), item.hreflang);
  }

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'SoftwareApplication',
        name: 'AidCue',
        url: canonicalUrl,
        inLanguage: lang,
        applicationCategory: 'EducationalApplication',
        operatingSystem: 'Web',
        isAccessibleForFree: true,
        description: payload.description,
        offers: {
          '@type': 'Offer',
          price: '0',
          priceCurrency: 'USD',
        },
      },
      {
        '@type': 'FAQPage',
        url: canonicalUrl,
        inLanguage: lang,
        mainEntity: payload.faqs.map((faq) => ({
          '@type': 'Question',
          name: faq.question,
          acceptedAnswer: {
            '@type': 'Answer',
            text: faq.answer,
          },
        })),
      },
    ],
  };

  let scriptEl = document.getElementById('aidcue-jsonld') as HTMLScriptElement | null;
  if (!scriptEl) {
    scriptEl = document.createElement('script');
    scriptEl.id = 'aidcue-jsonld';
    scriptEl.type = 'application/ld+json';
    document.head.appendChild(scriptEl);
  }
  scriptEl.textContent = JSON.stringify(jsonLd);
}
