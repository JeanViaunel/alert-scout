import axios from 'axios';
import * as cheerio from 'cheerio';
import type { EcommerceCriteria } from '@/types';

export interface ScrapedProduct {
  id: string;
  title: string;
  price: number;
  priceText: string;
  imageUrl?: string;
  sourceUrl: string;
  source: string;
  metadata: Record<string, any>;
}

export function buildMomoUrl(criteria: EcommerceCriteria): string {
  const params = new URLSearchParams();
  const q = criteria.searchQuery || '';
  params.set('keyword', q);
  params.set('searchType', '1');
  if (criteria.minPrice !== undefined) params.set('price1', String(criteria.minPrice));
  if (criteria.maxPrice !== undefined) params.set('price2', String(criteria.maxPrice));
  params.set('sort', 'NEW');
  return `https://www.momoshop.com.tw/search/searchShop.jsp?${params.toString()}`;
}

export async function scrapeMomo(criteria: EcommerceCriteria): Promise<ScrapedProduct[]> {
  const url = buildMomoUrl(criteria);
  console.log(`Scraping Momo: ${url}`);

  const response = await axios.get(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Accept-Language': 'zh-TW,zh;q=0.9,en;q=0.8',
      'Referer': 'https://www.momoshop.com.tw/',
    },
    timeout: 30000,
  });

  const $ = cheerio.load(response.data);
  const products: ScrapedProduct[] = [];

  // Momo product list — try multiple known selectors
  $('li.goods-info, li[class*="goods"], .listItem, li.ckProduct').each((_, el) => {
    try {
      const $el = $(el);

      const title =
        $el.find('.prdName, .goodsName, [class*="prdName"]').first().text().trim() ||
        $el.find('a[title]').attr('title')?.trim() || '';

      const rawPrice =
        $el.find('.money em, .price em, .salePrice em, [class*="price"] em').first().text().trim() ||
        $el.find('.money, .price, [class*="price"]').first().text().trim();
      const price = parseInt(rawPrice.replace(/[^\d]/g, '')) || 0;

      const imageUrl =
        $el.find('img').attr('src') ||
        $el.find('img').attr('data-src') ||
        $el.find('img').attr('data-lazy-src');

      const href =
        $el.find('a[href*="goods"]').first().attr('href') ||
        $el.find('a').first().attr('href');
      const sourceUrl = href
        ? href.startsWith('http')
          ? href
          : `https://www.momoshop.com.tw${href}`
        : url;

      const idMatch = sourceUrl.match(/i_code=(\d+)/);
      const id = idMatch ? idMatch[1] : Math.random().toString(36).slice(2);

      if (title && price > 0) {
        products.push({
          id: `momo-${id}`,
          title,
          price,
          priceText: `NT$${price.toLocaleString()}`,
          imageUrl: imageUrl || undefined,
          sourceUrl,
          source: 'momo',
          metadata: { scrapedAt: new Date().toISOString(), searchUrl: url },
        });
      }
    } catch (err) {
      console.error('Error parsing Momo product:', err);
    }
  });

  // Apply price filter (API-side filter may already do this, belt-and-suspenders)
  return products.filter(p => {
    if (criteria.minPrice !== undefined && p.price < criteria.minPrice) return false;
    if (criteria.maxPrice !== undefined && p.price > criteria.maxPrice) return false;
    return true;
  });
}
