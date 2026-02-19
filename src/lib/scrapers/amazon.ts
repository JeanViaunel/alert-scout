import axios from 'axios';
import * as cheerio from 'cheerio';
import type { EcommerceCriteria } from '@/types';
import type { ScrapedProduct } from './momo';

export type { ScrapedProduct };

/** Resolve Amazon base URL from criteria (url host or default .com). */
function getAmazonBase(criteria: EcommerceCriteria): string {
  if (criteria.url) {
    try {
      const h = new URL(criteria.url).hostname.toLowerCase();
      if (h.includes('amazon.co.jp')) return 'https://www.amazon.co.jp';
      if (h.includes('amazon.co.uk')) return 'https://www.amazon.co.uk';
      if (h.includes('amazon.de')) return 'https://www.amazon.de';
      if (h.includes('amazon.fr')) return 'https://www.amazon.fr';
      if (h.includes('amazon.ca')) return 'https://www.amazon.ca';
      if (h.includes('amazon.com.au')) return 'https://www.amazon.com.au';
    } catch {
      // ignore
    }
  }
  return 'https://www.amazon.com';
}

/** Currency symbol for display (we store numeric price; currency in criteria). */
function getCurrencySymbol(currency?: string): string {
  switch (currency?.toUpperCase()) {
    case 'JPY': return '¥';
    case 'EUR': return '€';
    case 'GBP': return '£';
    default: return '$';
  }
}

/** Display/monitored URL for Amazon search or product page. */
export function buildAmazonUrl(criteria: EcommerceCriteria): string {
  const base = getAmazonBase(criteria);
  if (criteria.asin) return `${base}/dp/${criteria.asin}`;
  const q = encodeURIComponent(criteria.searchQuery || '');
  const params = new URLSearchParams({ k: q });
  if (criteria.minPrice !== undefined && criteria.maxPrice !== undefined) {
    // Amazon price filter: cents for USD (p_36:min-max)
    const mult = (criteria.currency === 'JPY' || criteria.currency === 'EUR') ? 1 : 100;
    params.set('rh', `p_36:${criteria.minPrice * mult}-${criteria.maxPrice * mult}`);
  }
  return `${base}/s?${params.toString()}`;
}

/**
 * Scrape Amazon search results (or single product if ASIN provided).
 * Amazon may block bots; we return [] and log on failure.
 */
export async function scrapeAmazon(criteria: EcommerceCriteria): Promise<ScrapedProduct[]> {
  const base = getAmazonBase(criteria);
  const searchUrl = buildAmazonUrl(criteria);
  const currency = criteria.currency || 'USD';
  const symbol = getCurrencySymbol(currency);
  console.log(`Scraping Amazon: ${searchUrl}`);

  const response = await axios.get(searchUrl, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.9',
      'Referer': `${base}/`,
    },
    timeout: 30000,
    validateStatus: (s) => s < 500,
  });

  if (response.status !== 200) return [];

  const $ = cheerio.load(response.data);
  const title = $('title').text().toLowerCase();

  // Bot/captcha detection
  if (title.includes('robot') || title.includes('captcha') || $('form[action*="validateCaptcha"]').length > 0) {
    console.warn('Amazon returned bot/captcha page');
    return [];
  }

  const products: ScrapedProduct[] = [];

  // Single product (ASIN) page
  if (criteria.asin) {
    const name = $('#productTitle').first().text().trim() || $('h1#title').first().text().trim();
    const priceWhole = $('.a-price .a-price-whole').first().text().replace(/[^\d]/g, '');
    const priceFrac = $('.a-price .a-price-fraction').first().text().replace(/[^\d]/g, '');
    const price = parseInt(priceWhole, 10) * 100 + parseInt(priceFrac || '0', 10);
    const imageUrl = $('#imgBlkFront').attr('src') || $('#landingImage').attr('src');
    const sourceUrl = searchUrl;
    if (name && price >= 0) {
      products.push({
        id: `amazon-${criteria.asin}`,
        title: name,
        price,
        priceText: price > 0 ? `${symbol}${(price / 100).toFixed(2)}` : 'N/A',
        imageUrl: imageUrl || undefined,
        sourceUrl,
        source: 'amazon',
        metadata: { scrapedAt: new Date().toISOString(), searchUrl, currency },
      });
    }
    return products.filter(p => {
      if (criteria.minPrice !== undefined && p.price < criteria.minPrice) return false;
      if (criteria.maxPrice !== undefined && p.price > criteria.maxPrice) return false;
      return true;
    });
  }

  // Search results: .s-result-item[data-asin], skip sponsored/empty
  $('.s-result-item[data-asin]').each((_, el) => {
    try {
      const $el = $(el);
      const asin = $el.attr('data-asin')?.trim();
      if (!asin || asin.length < 10) return;

      const name = $el.find('h2 a span').first().text().trim() || $el.find('.a-text-normal').first().text().trim();
      const href = $el.find('h2 a').first().attr('href');
      const sourceUrl = href ? (href.startsWith('http') ? href : `${base}${href}`) : `${base}/dp/${asin}`;

      const priceWhole = $el.find('.a-price .a-price-whole').first().text().replace(/[^\d]/g, '');
      const priceFrac = $el.find('.a-price .a-price-fraction').first().text().replace(/[^\d]/g, '');
      let price = parseInt(priceWhole, 10) * 100 + parseInt(priceFrac || '0', 10);
      if (Number.isNaN(price) || price <= 0) {
        const raw = $el.find('.a-price .a-offscreen').first().text().replace(/[^\d.]/g, '');
        price = Math.round(parseFloat(raw || '0') * 100);
      }
      const img = $el.find('img.s-image').first().attr('src');

      if (name && price > 0) {
        products.push({
          id: `amazon-${asin}`,
          title: name,
          price,
          priceText: `${symbol}${(price / 100).toFixed(2)}`,
          imageUrl: img || undefined,
          sourceUrl,
          source: 'amazon',
          metadata: { scrapedAt: new Date().toISOString(), searchUrl, currency },
        });
      }
    } catch {
      // skip
    }
  });

  return products.filter(p => {
    if (criteria.minPrice !== undefined && p.price < criteria.minPrice) return false;
    if (criteria.maxPrice !== undefined && p.price > criteria.maxPrice) return false;
    return true;
  });
}
