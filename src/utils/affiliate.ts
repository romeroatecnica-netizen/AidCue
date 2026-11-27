export const AMAZON_AFFILIATE_ORIGIN = 'https://www.amazon.es';
export const AMAZON_AFFILIATE_TAG = 'bastelar-21';
export const AFFILIATE_LINK_TARGET = '_blank';
export const AFFILIATE_LINK_REL = 'sponsored nofollow noopener';

/**
 * Forces any product or search URL (including other Amazon TLDs, http links,
 * relative paths, or raw search strings) onto https://www.amazon.es with
 * tag=bastelar-21.
 */
export function forceAmazonEsAffiliateUrl(rawUrlOrQuery: string): string {
  const trimmed = rawUrlOrQuery.trim();
  if (!trimmed) {
    return `${AMAZON_AFFILIATE_ORIGIN}/?tag=${AMAZON_AFFILIATE_TAG}`;
  }

  // If plain search text (no scheme and not starting with '/'), build an amazon.es search URL.
  if (!/^https?:\/\//i.test(trimmed) && !trimmed.startsWith('/')) {
    const searchUrl = new URL('/s', AMAZON_AFFILIATE_ORIGIN);
    searchUrl.searchParams.set('k', trimmed);
    searchUrl.searchParams.set('tag', AMAZON_AFFILIATE_TAG);
    return searchUrl.toString();
  }

  try {
    const parsed = trimmed.startsWith('/')
      ? new URL(trimmed, AMAZON_AFFILIATE_ORIGIN)
      : new URL(trimmed);

    const isAmazonHost =
      /(^|\.)amazon\.[a-z.]+$/i.test(parsed.hostname) ||
      /^amzn\.(to|eu)$/i.test(parsed.hostname);

    if (!isAmazonHost) {
      // Never emit non-Amazon product links; convert fallback text/path safely onto www.amazon.es
      const fallbackUrl = new URL('/s', AMAZON_AFFILIATE_ORIGIN);
      fallbackUrl.searchParams.set('k', parsed.searchParams.get('k') || trimmed);
      fallbackUrl.searchParams.set('tag', AMAZON_AFFILIATE_TAG);
      return fallbackUrl.toString();
    }

    const enforced = new URL(
      `${parsed.pathname || '/'}${parsed.search}`,
      AMAZON_AFFILIATE_ORIGIN,
    );
    enforced.protocol = 'https:';
    enforced.hostname = 'www.amazon.es';
    enforced.port = '';
    enforced.searchParams.set('tag', AMAZON_AFFILIATE_TAG);
    return enforced.toString();
  } catch {
    const fallbackUrl = new URL('/s', AMAZON_AFFILIATE_ORIGIN);
    fallbackUrl.searchParams.set('k', trimmed);
    fallbackUrl.searchParams.set('tag', AMAZON_AFFILIATE_TAG);
    return fallbackUrl.toString();
  }
}

export function buildAmazonEsSearchUrl(searchTerms: string): string {
  const url = new URL('/s', AMAZON_AFFILIATE_ORIGIN);
  url.searchParams.set('k', searchTerms.trim());
  url.searchParams.set('tag', AMAZON_AFFILIATE_TAG);
  return forceAmazonEsAffiliateUrl(url.toString());
}
