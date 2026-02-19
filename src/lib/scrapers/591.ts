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

type NuxtPayload = {
  pinia?: Record<string, unknown>;
};

type RentDetailInfoStore = {
  ctx?: Record<string, unknown>;
  communities?: Array<unknown>;
};

function extractAlbumPhotos(nuxt: NuxtPayload | null): string[] {
  const albumData = (nuxt?.pinia as any)?.album?.albumData;
  const items = albumData?.items;
  if (!Array.isArray(items)) return [];

  const photos = items
    .map((it: any) => {
      const orig = typeof it?.origPhoto === 'string' ? it.origPhoto : '';
      const photo = typeof it?.photo === 'string' ? it.photo : '';
      // Prefer origPhoto when present (often less transformed), but both are watermarked.
      return orig || photo;
    })
    .filter((u: any): u is string => typeof u === 'string' && u.startsWith('http'));

  // de-dupe while preserving order
  return Array.from(new Set(photos));
}

function parseNuxtPayloadFromHtml(html: string): NuxtPayload | null {
  const scriptStart = html.indexOf('<script>window.__NUXT__=');
  if (scriptStart === -1) return null;
  const scriptEnd = html.indexOf('</script>', scriptStart);
  if (scriptEnd === -1) return null;

  const scriptContent = html
    .slice(scriptStart + '<script>'.length, scriptEnd)
    .trim();
  const code = scriptContent.replace(/^window\.__NUXT__\s*=\s*/, '');
  if (!code) return null;

  try {
    const ctx = { window: {} as { __NUXT__?: NuxtPayload } };
    vm.createContext(ctx);
    vm.runInContext('window.__NUXT__ = ' + code, ctx, { timeout: 1000 });
    return ctx.window.__NUXT__ ?? null;
  } catch {
    return null;
  }
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
  const nuxt = parseNuxtPayloadFromHtml(html);
  const rentList = (nuxt?.pinia as any)?.['rent-list'] as
    | { dataList?: Nuxt591Listing[]; topDataList?: Nuxt591Listing[] }
    | undefined;
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
    const photoList = Array.isArray(item.photoList) ? item.photoList : [];

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
      metadata: {
        scrapedAt: new Date().toISOString(),
        rooms,
        areaText,
        layoutStr: item.layoutStr,
        kind_name: item.kind_name,
        photoList,
        rawId: id,
      },
    });
  }

  return listings;
}

function pickActiveFacilityNames(service: unknown): string[] {
  if (!service || typeof service !== 'object') return [];
  const facility = (service as any).facility;
  if (!Array.isArray(facility)) return [];
  return facility
    .filter(
      (f: any) =>
        f && typeof f === 'object' && f.active === 1 && typeof f.name === 'string'
    )
    .map((f: any) => f.name as string);
}

function mapDetailToMetadata(
  detailCtx: Record<string, unknown> | undefined
): Record<string, any> | null {
  if (!detailCtx) return null;

  const depositText =
    typeof detailCtx.deposit === 'string'
      ? (detailCtx.deposit as string)
      : undefined;

  const tags = Array.isArray(detailCtx.tags)
    ? (detailCtx.tags as any[])
        .map((t) =>
          t && typeof t === 'object' ? (t as any).value : undefined
        )
        .filter((v): v is string => typeof v === 'string' && v.trim().length > 0)
    : [];

  const info = Array.isArray(detailCtx.info)
    ? (detailCtx.info as any[])
        .filter((i) => i && typeof i === 'object')
        .map((i) => ({
          name: typeof i.name === 'string' ? i.name : '',
          value: typeof i.value === 'string' ? i.value : '',
          key: typeof i.key === 'string' ? i.key : '',
        }))
        .filter((i) => i.name && i.value)
    : [];

  const infoByKey: Record<string, string> = {};
  for (const row of info) {
    if (row.key) infoByKey[row.key] = row.value;
  }

  const positionRound =
    detailCtx.positionRound && typeof detailCtx.positionRound === 'object'
      ? {
          communityName:
            typeof (detailCtx.positionRound as any).communityName === 'string'
              ? (detailCtx.positionRound as any).communityName
              : '',
          address:
            typeof (detailCtx.positionRound as any).address === 'string'
              ? (detailCtx.positionRound as any).address
              : '',
          lat:
            typeof (detailCtx.positionRound as any).lat === 'string'
              ? (detailCtx.positionRound as any).lat
              : undefined,
          lng:
            typeof (detailCtx.positionRound as any).lng === 'string'
              ? (detailCtx.positionRound as any).lng
              : undefined,
          data: Array.isArray((detailCtx.positionRound as any).data)
            ? (detailCtx.positionRound as any).data
            : [],
        }
      : null;

  const service =
    detailCtx.service && typeof detailCtx.service === 'object'
      ? {
          desc:
            typeof (detailCtx.service as any).desc === 'string'
              ? (detailCtx.service as any).desc
              : '',
          rule:
            typeof (detailCtx.service as any).rule === 'string'
              ? (detailCtx.service as any).rule
              : '',
          facilities: pickActiveFacilityNames(detailCtx.service),
        }
      : null;

  const remarkHtml =
    detailCtx.remark &&
    typeof detailCtx.remark === 'object' &&
    typeof (detailCtx.remark as any).content === 'string'
      ? ((detailCtx.remark as any).content as string)
      : undefined;

  const owner =
    detailCtx.linkInfo && typeof detailCtx.linkInfo === 'object'
      ? {
          name:
            typeof (detailCtx.linkInfo as any).name === 'string'
              ? (detailCtx.linkInfo as any).name
              : '',
          roleTxt:
            typeof (detailCtx.linkInfo as any).roleTxt === 'string'
              ? (detailCtx.linkInfo as any).roleTxt
              : '',
          mobile:
            typeof (detailCtx.linkInfo as any).mobile === 'string'
              ? (detailCtx.linkInfo as any).mobile
              : '',
          phone:
            typeof (detailCtx.linkInfo as any).phone === 'string'
              ? (detailCtx.linkInfo as any).phone
              : '',
          line:
            typeof (detailCtx.linkInfo as any).line === 'string'
              ? (detailCtx.linkInfo as any).line
              : '',
          labels: Array.isArray((detailCtx.linkInfo as any).labelInfo)
            ? (detailCtx.linkInfo as any).labelInfo.filter(
                (s: any) => typeof s === 'string'
              )
            : [],
          isServiceFee: (detailCtx.linkInfo as any).isServiceFee,
          serviceFeeText:
            typeof (detailCtx.linkInfo as any).isrecmoney === 'string'
              ? (detailCtx.linkInfo as any).isrecmoney
              : '',
        }
      : null;

  const publish =
    detailCtx.publish && typeof detailCtx.publish === 'object'
      ? {
          postTime:
            typeof (detailCtx.publish as any).postTime === 'string'
              ? (detailCtx.publish as any).postTime
              : '',
          updateTime:
            typeof (detailCtx.publish as any).updateTime === 'string'
              ? (detailCtx.publish as any).updateTime
              : '',
        }
      : null;

  return {
    depositText,
    tags,
    info,
    infoByKey,
    positionRound,
    service,
    remarkHtml,
    owner,
    publish,
  };
}

async function enrich591ListingWithDetail(
  listing: ScrapedListing
): Promise<ScrapedListing> {
  if (!listing.sourceUrl?.startsWith('http')) return listing;
  try {
    const response = await axios.get(listing.sourceUrl, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        Accept:
          'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'zh-TW,zh;q=0.9,en;q=0.8',
        Referer: 'https://rent.591.com.tw/',
      },
      timeout: 25000,
    });

    const nuxt = parseNuxtPayloadFromHtml(response.data);
    const store = (nuxt?.pinia as any)?.['rent-detail-info'] as
      | RentDetailInfoStore
      | undefined;
    const detailCtx = store?.ctx as Record<string, unknown> | undefined;
    const detail = mapDetailToMetadata(detailCtx);
    const albumPhotos = extractAlbumPhotos(nuxt);

    if (!detail && albumPhotos.length === 0) return listing;

    return {
      ...listing,
      imageUrl: listing.imageUrl ?? albumPhotos[0],
      metadata: {
        ...listing.metadata,
        ...(detail ? { rentDetail: detail } : {}),
        ...(albumPhotos.length > 0 ? { photoList: albumPhotos } : {}),
      },
    };
  } catch {
    return listing;
  }
}

async function enrich591ListingsWithDetails(
  listings: ScrapedListing[]
): Promise<ScrapedListing[]> {
  // Conservative to avoid rate limits / slow scrapes.
  const concurrency = 3;
  const maxToEnrich = 10;
  if (listings.length > maxToEnrich) {
    const head = await enrich591ListingsWithDetails(listings.slice(0, maxToEnrich));
    return [...head, ...listings.slice(maxToEnrich)];
  }
  const result: ScrapedListing[] = new Array(listings.length);
  let idx = 0;

  const worker = async () => {
    while (true) {
      const i = idx++;
      if (i >= listings.length) return;
      result[i] = await enrich591ListingWithDetail(listings[i]);
    }
  };

  await Promise.all(
    Array.from({ length: Math.min(concurrency, listings.length) }, worker)
  );
  return result;
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
    const enriched = await enrich591ListingsWithDetails(listings);
    console.log(`Found ${listings.length} listings from 591`);
    return enriched;
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
