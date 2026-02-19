import axios from 'axios';
import vm from 'node:vm';
import type { PropertyCriteria } from '@/types';

export interface ScrapedListing {
  id: string;
  title: string;
  price: number;
  priceText: string;
  location: string;
  area?: number;
  areaText?: string;
  rooms?: number;
  imageUrl?: string;
  sourceUrl: string;
  source: string;
  metadata: Record<string, any>;
}

/** Raw listing item from 591 __NUXT__ pinia state */
interface Nuxt591Listing {
  id?: number;
  title?: string;
  price?: string;
  price_unit?: string;
  address?: string;
  area?: number;
  area_name?: string;
  url?: string;
  photoList?: string[];
  layoutStr?: string;
  kind_name?: string;
  [key: string]: unknown;
}

// 591 region codes
const REGION_CODES: Record<string, number> = {
  'taipei': 1,
  'new-taipei': 3,
  'taoyuan': 6,
  'taichung': 8,
  'tainan': 30,
  'kaohsiung': 17,
  'hsinchu': 4,
  'hsinchu-county': 5,
  'miaoli': 11,
  'changhua': 14,
  'nantou': 21,
  'yunlin': 38,
  'chiayi': 34,
  'pingtung': 19,
  'yilan': 24,
  'hualien': 27,
  'taitung': 29,
};

// District codes for major cities
const DISTRICT_CODES: Record<string, Record<string, number>> = {
  'hsinchu': {
    'east': 400,
    'north': 401,
    'xiangshan': 402,
  },
};

export function build591Url(criteria: PropertyCriteria): string {
  const params = new URLSearchParams();
  
  // Region
  const regionCode = criteria.city ? REGION_CODES[criteria.city] || 4 : 4;
  params.set('region', regionCode.toString());
  
  // Districts
  if (criteria.districts && criteria.districts.length > 0) {
    const districtIds = criteria.districts
      .map(d => DISTRICT_CODES[criteria.city || 'hsinchu']?.[d])
      .filter(Boolean);
    if (districtIds.length > 0) {
      params.set('section', districtIds.join(','));
    }
  }
  
  // Price range
  if (criteria.minPrice !== undefined) {
    params.set('price', `${criteria.minPrice}_${criteria.maxPrice || ''}`);
  }
  
  // Area (ping)
  if (criteria.minPing !== undefined) {
    params.set('area', `${criteria.minPing}_${criteria.maxPing || ''}`);
  }
  
  // Rooms
  if (criteria.rooms) {
    params.set('room', criteria.rooms.toString());
  }
  
  // Sort by newest
  params.set('sort', 'posttime_desc');
  
  return `https://rent.591.com.tw/list?${params.toString()}`;
}

/**
 * Parse 591's __NUXT__ payload from the list page HTML.
 * 591 uses Nuxt and embeds listing data as an IIFE; we run it in a VM and read pinia['rent-list'].
 */
function parseNuxt591Listings(html: string): ScrapedListing[] {
  const scriptStart = html.indexOf('<script>window.__NUXT__=');
  if (scriptStart === -1) return [];

  const scriptEnd = html.indexOf('</script>', scriptStart);
  const scriptContent = html.slice(scriptStart + '<script>'.length, scriptEnd).trim();
  const code = scriptContent.replace(/^window\.__NUXT__\s*=\s*/, '');
  if (!code) return [];

  type NuxtPayload = { pinia?: { 'rent-list'?: { dataList?: Nuxt591Listing[]; topDataList?: Nuxt591Listing[] } } };
  let nuxt: NuxtPayload = {};
  try {
    const ctx = { window: {} as { __NUXT__?: NuxtPayload } };
    vm.createContext(ctx);
    vm.runInContext('window.__NUXT__ = ' + code, ctx);
    nuxt = ctx.window.__NUXT__ ?? {};
  } catch {
    return [];
  }

  const rentList = nuxt.pinia?.['rent-list'];
  const dataList = rentList?.dataList ?? [];
  const topList = rentList?.topDataList ?? [];
  const rawList: Nuxt591Listing[] = [...dataList, ...topList];

  const listings: ScrapedListing[] = [];
  for (const item of rawList) {
    const title = item.title?.trim();
    const priceStr = typeof item.price === 'string' ? item.price : String(item.price ?? '');
    const price = parseInt(priceStr.replace(/[^\d]/g, ''), 10) || 0;
    const priceUnit = item.price_unit ?? '元/月';
    const priceText = price > 0 ? `${priceStr}${priceUnit}` : '';

    if (!title || price <= 0) continue;

    const id = item.id ?? 0;
    const sourceUrl = item.url?.startsWith('http') ? item.url : `https://rent.591.com.tw/${id}`;
    const location = item.address?.trim() ?? '';
    const area = typeof item.area === 'number' ? item.area : undefined;
    const areaText = item.area_name ?? (area != null ? `${area}坪` : undefined);

    let rooms: number | undefined;
    const roomMatch = title.match(/(\d+)房/);
    if (roomMatch) rooms = parseInt(roomMatch[1], 10);
    const imageUrl = Array.isArray(item.photoList) ? item.photoList[0] : undefined;

    listings.push({
      id: `591-${id}`,
      title,
      price,
      priceText,
      location,
      area,
      areaText,
      rooms,
      imageUrl,
      sourceUrl,
      source: '591',
      metadata: { scrapedAt: new Date().toISOString() },
    });
  }

  return listings;
}

export async function scrape591(criteria: PropertyCriteria): Promise<ScrapedListing[]> {
  const url = build591Url(criteria);
  console.log(`Scraping 591: ${url}`);

  try {
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'zh-TW,zh;q=0.9,en;q=0.8',
        Referer: 'https://rent.591.com.tw/',
      },
      timeout: 30000,
    });

    const listings = parseNuxt591Listings(response.data);
    console.log(`Found ${listings.length} listings from 591`);
    return listings;
  } catch (error) {
    console.error('Error scraping 591:', error);
    throw error;
  }
}

// Filter listings by criteria
export function filterListings(
  listings: ScrapedListing[],
  criteria: PropertyCriteria
): ScrapedListing[] {
  return listings.filter(listing => {
    // Price filter
    if (criteria.minPrice !== undefined && listing.price < criteria.minPrice) {
      return false;
    }
    if (criteria.maxPrice !== undefined && listing.price > criteria.maxPrice) {
      return false;
    }
    
    // Area filter
    if (criteria.minPing !== undefined && listing.area && listing.area < criteria.minPing) {
      return false;
    }
    if (criteria.maxPing !== undefined && listing.area && listing.area > criteria.maxPing) {
      return false;
    }
    
    // Rooms filter
    if (criteria.rooms !== undefined && listing.rooms && listing.rooms !== criteria.rooms) {
      return false;
    }
    
    // Keywords filter
    if (criteria.keywords && criteria.keywords.length > 0) {
      const text = `${listing.title} ${listing.location}`.toLowerCase();
      const hasKeyword = criteria.keywords.some(kw => 
        text.includes(kw.toLowerCase())
      );
      if (!hasKeyword) return false;
    }
    
    return true;
  });
}
