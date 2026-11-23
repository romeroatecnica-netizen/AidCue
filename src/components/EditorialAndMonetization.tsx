import React, {useState} from 'react';
import {ChevronDown, ExternalLink, ShieldAlert} from 'lucide-react';
import {
  AFFILIATE_GEAR,
  EDITORIAL_FAQS,
  EDITORIAL_SECTIONS,
} from '../data/editorial';
import {pickText} from '../i18n/helpers';
import type {UiStrings} from '../i18n/uiStrings';
import type {LangCode} from '../types';

export const MediaNetAdSlot: React.FC<{
  slotId: string;
  label: string;
  variant: 'leaderboard' | 'rectangle';
}> = ({slotId, label, variant}) => {
  const heightCls = variant === 'leaderboard' ? 'min-h-[100px]' : 'min-h-[250px]';
  return (
    <aside
      id={slotId}
      aria-label={label}
      data-ad-network="media-net"
      className={`ad-slot-container print:hidden flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white px-4 py-3 text-center ${heightCls}`}
    >
      <span className="text-[11px] font-medium text-slate-400">{label}</span>
      <div className="mt-1 text-xs text-slate-400">
        Media.net Responsive Container ({variant === 'leaderboard' ? '728×90 / Fluid' : '300×250 / Fluid'})
      </div>
    </aside>
  );
};

export const EditorialAndMonetization: React.FC<{
  lang: LangCode;
  ui: UiStrings;
}> = ({lang, ui}) => {
  const [openFaqId, setOpenFaqId] = useState<string | null>(EDITORIAL_FAQS[0].id);

  return (
    <div className="space-y-10">
      {/* Contextual Affiliate Gear Block */}
      <section
        aria-labelledby="affiliate-gear-heading"
        className="rounded-xl border border-slate-200 bg-white p-6"
      >
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2
            id="affiliate-gear-heading"
            className="font-display text-lg font-bold text-slate-900"
          >
            {ui.affiliateHeading}
          </h2>
          <p className="text-xs text-slate-500">{ui.affiliateDisclosure}</p>
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-3">
          {AFFILIATE_GEAR.map((item) => (
            <article
              key={item.id}
              className="flex flex-col justify-between rounded-xl border border-slate-200 bg-[#F8FAFC] p-4"
            >
              <div>
                <div className="text-xs font-semibold text-blue-700">
                  {pickText(item.category, lang)}
                </div>
                <h3 className="mt-1 font-display text-sm font-bold text-slate-900 leading-snug">
                  {pickText(item.title, lang)}
                </h3>
                <p className="mt-2 text-xs text-slate-600 leading-relaxed">
                  {pickText(item.description, lang)}
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-200">
                <a
                  href={item.url}
                  target="_blank"
                  rel="sponsored nofollow noopener"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-900 hover:text-red-600 transition-colors"
                >
                  <span>{ui.affiliateVisitLink}</span>
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* SEO Editorial Reference Section */}
      <section
        id="study-guide"
        aria-labelledby="editorial-guide-heading"
        className="rounded-xl border border-slate-200 bg-white p-6 sm:p-8"
      >
        <h2
          id="editorial-guide-heading"
          className="font-display text-2xl font-bold text-slate-900"
        >
          {ui.editorialHeading}
        </h2>

        <div className="mt-6 space-y-8 divide-y divide-slate-200">
          {EDITORIAL_SECTIONS.map((sec) => (
            <article key={sec.id} className="pt-6 first:pt-0">
              <h3 className="font-display text-lg font-bold text-slate-900">
                {pickText(sec.title, lang)}
              </h3>
              <p className="mt-2 text-sm text-slate-600 leading-relaxed max-w-3xl">
                {pickText(sec.summary, lang)}
              </p>
              <ul className="mt-3 space-y-2 text-sm text-slate-700 leading-relaxed">
                {sec.bullets.map((b, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-slate-400" />
                    <span>{pickText(b, lang)}</span>
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>

      {/* Interactive FAQ Accordion */}
      <section
        aria-labelledby="faq-heading"
        className="rounded-xl border border-slate-200 bg-white p-6 sm:p-8"
      >
        <h2
          id="faq-heading"
          className="font-display text-xl font-bold text-slate-900"
        >
          {ui.faqHeading}
        </h2>
        <div className="mt-4 divide-y divide-slate-200">
          {EDITORIAL_FAQS.map((faq) => {
            const isOpen = openFaqId === faq.id;
            return (
              <div key={faq.id} className="py-3.5">
                <button
                  type="button"
                  aria-expanded={isOpen}
                  onClick={() => setOpenFaqId(isOpen ? null : faq.id)}
                  className="flex w-full items-center justify-between gap-4 text-start font-display text-sm font-bold text-slate-900 hover:text-red-600 transition-colors"
                >
                  <span>{pickText(faq.question, lang)}</span>
                  <ChevronDown
                    className={`h-4 w-4 shrink-0 text-slate-500 transition-transform ${
                      isOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>
                {isOpen && (
                  <p className="mt-2.5 text-sm text-slate-600 leading-relaxed">
                    {pickText(faq.answer, lang)}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Clear & Prominent Medical Disclaimer */}
      <section
        aria-label={ui.disclaimerTitle}
        className="rounded-xl border border-amber-300 bg-amber-50/70 p-5"
      >
        <div className="flex items-start gap-3">
          <ShieldAlert className="h-5 w-5 shrink-0 text-amber-700 mt-0.5" />
          <div>
            <h2 className="font-display text-sm font-bold text-amber-950">
              {ui.disclaimerTitle}
            </h2>
            <p className="mt-1 text-sm text-amber-900 leading-relaxed">
              {ui.disclaimerBody}
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};
