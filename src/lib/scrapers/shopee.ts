import axios from 'axios';
import * as cheerio from 'cheerio';
import type { EcommerceCriteria } from '@/types';
import type { ScrapedProduct } from './momo';

export type { ScrapedProduct };

const SHOPEE_BASE = 'https://shopee.tw';

/** Display/monitored URL for Shopee Taiwan search. */
export function buildShopeeUrl(criteria: EcommerceCriteria): string {
  const q = encodeURIComponent(criteria.searchQuery || '');
  return `${SHOPEE_BASE}/search?keyword=${q}`;
}

/**
 * Scrape Shopee Taiwan search results.
 * Tries embedded JSON (preloaded state) then falls back to DOM selectors.
 */
export async function scrapeShopee(criteria: EcommerceCriteria): Promise<ScrapedProduct[]> {
  const searchUrl = buildShopeeUrl(criteria);
  console.log(`Scraping Shopee: ${searchUrl}`);

  const response = await axios.get(searchUrl, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'zh-TW,zh;q=0.9,en;q=0.8',
      'Referer': `${SHOPEE_BASE}/`,
    },
    timeout: 30000,
  });

  const $ = cheerio.load(response.data);
  const products: ScrapedProduct[] = [];

  // 1) Try embedded JSON (Shopee often puts initial state in script)
  $('script').each((_, el) => {
    const html = $(el).html() || '';
    // Match common patterns: "__NUXT__", "item_basic", "search_items", etc.
    const jsonMatch = html.match(/"item_basic":\s*(\{[^}]+\})/);
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[1]);
        if (parsed && typeof parsed === 'object') {
          const items = Array.isArray(parsed.items) ? parsed.items : Object.values(parsed);
          for (const item of items) {
            if (!item || typeof item !== 'object') continue;
            const name = item.name ?? item.title ?? '';
            const itemid = item.itemid ?? item.item_id ?? '';
            const shopid = item.shopid ?? item.shop_id ?? '';
            const price = parseInt(String(item.price ?? item.price_min ?? 0).replace(/[^\d]/g, ''), 10);
            const image = item.image ?? item.images?.[0];
            if (!name || !itemid || price <= 0) continue;
            const sourceUrl = `${SHOPEE_BASE}/product-i.${shopid}.${itemid}`;
            const imageUrl = typeof image === 'string' ? image : undefined;
            products.push({
              id: `shopee-${itemid}`,
              title: name,
              price,
              priceText: `NT$${price.toLocaleString()}`,
              imageUrl: imageUrl?.startsWith('http') ? imageUrl : imageUrl ? `https:${imageUrl}` : undefined,
              sourceUrl,
              source: 'shopee',
              metadata: { scrapedAt: new Date().toISOString(), searchUrl },
            });
          }
        }
      } catch {
        // ignore parse errors
      }
    }
  });

  // 2) Fallback: DOM product cards (class names may change; common patterns)
  if (products.length === 0) {
    $('[data-sqe="link"], a[href*="/product-"]').each((_, el) => {
      try {
        const $el = $(el);
        const href = $el.attr('href');
        if (!href || !href.includes('product')) return;
        const title = $el.find('[data-sqe="name"]').first().text().trim()
          || $el.attr('title')?.trim()
          || $el.find('.shopee-product-title').first().text().trim()
          || '';
        const priceEl = $el.find('[data-sqe="price"], .shopee-product-price, .ZEgDH');
        const rawPrice = priceEl.first().text().trim();
        const price = parseInt(rawPrice.replace(/[^\d]/g, ''), 10) || 0;
        const img = $el.find('img').first().attr('src') || $el.find('img').first().attr('data-src');
        const sourceUrl = href.startsWith('http') ? href : `${SHOPEE_BASE}${href}`;
        const idMatch = sourceUrl.match(/\.(\d+)\.(\d+)/);
        const id = idMatch ? idMatch[2] : sourceUrl;
        if (title && price > 0) {
          products.push({
            id: `shopee-${id}`,
            title,
            price,
            priceText: `NT$${price.toLocaleString()}`,
            imageUrl: img?.startsWith('http') ? img : img ? `https:${img}` : undefined,
            sourceUrl,
            source: 'shopee',
            metadata: { scrapedAt: new Date().toISOString(), searchUrl },
          });
        }
      } catch {
        // skip malformed
      }
    });
  }

  // Dedupe by id
  const seen = new Set<string>();
  const deduped = products.filter(p => {
    if (seen.has(p.id)) return false;
    seen.add(p.id);
    return true;
  });

  return deduped.filter(p => {
    if (criteria.minPrice !== undefined && p.price < criteria.minPrice) return false;
    if (criteria.maxPrice !== undefined && p.price > criteria.maxPrice) return false;
    return true;
  });
}
