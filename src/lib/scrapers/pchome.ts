import axios from 'axios';
import * as cheerio from 'cheerio';
import type { EcommerceCriteria } from '@/types';
import type { ScrapedProduct } from './momo';

export type { ScrapedProduct };

/** Display/monitored URL shown to the user. */
export function buildPChomeUrl(criteria: EcommerceCriteria): string {
  const q = encodeURIComponent(criteria.searchQuery || '');
  return `https://24h.pchome.com.tw/search/?q=${q}`;
}

export async function scrapePChome(criteria: EcommerceCriteria): Promise<ScrapedProduct[]> {
  const searchUrl = buildPChomeUrl(criteria);
  console.log(`Scraping PChome (HTML+JSON-LD): ${searchUrl}`);

  const response = await axios.get(searchUrl, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'zh-TW,zh;q=0.9,en;q=0.8',
      'Referer': 'https://24h.pchome.com.tw/',
    },
    timeout: 30000,
  });

  const $ = cheerio.load(response.data);

  // PChome embeds all search result products in a single <script type="application/ld+json">
  // as a JSON array containing BreadcrumbList, Website, and one Product entry per result.
  let schemaItems: any[] = [];
  $('script[type="application/ld+json"]').each((_, el) => {
    try {
      const parsed = JSON.parse($(el).html() || '');
      if (Array.isArray(parsed)) {
        schemaItems = parsed;
      }
    } catch { /* skip malformed */ }
  });

  const products: ScrapedProduct[] = [];
  for (const item of schemaItems) {
    if (item['@type'] !== 'Product') continue;

    const name: string = item.name ?? '';
    const url: string = item.url ?? '';
    const image: string | undefined = item.image || undefined;
    const price = parseInt(String(item.offers?.price ?? '0').replace(/[^\d]/g, ''));

    if (!name || !url || price <= 0) continue;

    // Derive a stable ID from the product URL slug
    const idMatch = url.match(/\/prod\/([^/?]+)/);
    const id = idMatch ? idMatch[1] : url;

    products.push({
      id: `pchome-${id}`,
      title: name,
      price,
      priceText: `NT$${price.toLocaleString()}`,
      imageUrl: image,
      sourceUrl: url,
      source: 'pchome',
      metadata: { scrapedAt: new Date().toISOString(), searchUrl },
    });
  }

  // Apply price filter
  return products.filter(p => {
    if (criteria.minPrice !== undefined && p.price < criteria.minPrice) return false;
    if (criteria.maxPrice !== undefined && p.price > criteria.maxPrice) return false;
    return true;
  });
}
