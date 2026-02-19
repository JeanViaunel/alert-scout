import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { scrape591, filterListings, build591Url } from '@/lib/scrapers/591';
import { scrapeMomo, buildMomoUrl } from '@/lib/scrapers/momo';
import { scrapePChome, buildPChomeUrl } from '@/lib/scrapers/pchome';
import { scrapeShopee, buildShopeeUrl } from '@/lib/scrapers/shopee';
import { scrapeAmazon, buildAmazonUrl } from '@/lib/scrapers/amazon';
import axios from 'axios';
import type { EcommerceCriteria, PropertyCriteria, Platform } from '@/types';

export const runtime = 'nodejs';

const BROWSER_UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

function buildSearchUrl(platform: Platform, criteria: EcommerceCriteria): string {
  const q = criteria.searchQuery || '';

  switch (platform) {
    case 'amazon': {
      let base = 'https://www.amazon.com';
      if (criteria.url) {
        try {
          const h = new URL(criteria.url).hostname;
          if (h.includes('amazon.co.jp')) base = 'https://www.amazon.co.jp';
          else if (h.includes('amazon.co.uk')) base = 'https://www.amazon.co.uk';
          else if (h.includes('amazon.de')) base = 'https://www.amazon.de';
          else if (h.includes('amazon.fr')) base = 'https://www.amazon.fr';
          else if (h.includes('amazon.ca')) base = 'https://www.amazon.ca';
        } catch { /* ignore */ }
      }
      if (criteria.asin) return `${base}/dp/${criteria.asin}`;
      const p = new URLSearchParams({ k: q });
      if (criteria.minPrice !== undefined && criteria.maxPrice !== undefined) {
        p.set('rh', `p_36:${criteria.minPrice * 100}-${criteria.maxPrice * 100}`);
      }
      return `${base}/s?${p}`;
    }
    case 'shopee':
      return `https://shopee.tw/search?keyword=${encodeURIComponent(q)}`;
    case 'custom':
      return criteria.url || '';
    default:
      return '';
  }
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace(/^Bearer\s+/i, '').trim();
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    try {
      verifyToken(token);
    } catch {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { platform, criteria } = await request.json();
    if (!platform) {
      return NextResponse.json({ error: 'Platform required' }, { status: 400 });
    }

    // 591 — actually scrape and return sample results
    if (platform === '591') {
      const pc = criteria as PropertyCriteria;
      const searchUrl = build591Url(pc);
      try {
        const listings = await scrape591(pc);
        const filtered = filterListings(listings, pc);
        return NextResponse.json({
          platform,
          searchUrl,
          found: filtered.length,
          items: filtered.slice(0, 4).map(l => ({
            title: l.title,
            price: l.priceText,
            url: l.sourceUrl,
            image: l.imageUrl,
            location: l.location,
            area: l.areaText,
          })),
          success: true,
        });
      } catch {
        return NextResponse.json({
          platform,
          searchUrl,
          found: 0,
          items: [],
          success: false,
          error: 'Could not reach 591.com.tw. The site may be temporarily unavailable.',
        });
      }
    }

    // Momo — actually scrape and return sample results
    if (platform === 'momo') {
      const ec = { ...criteria, platform: 'momo' } as EcommerceCriteria;
      const searchUrl = buildMomoUrl(ec);
      try {
        const products = await scrapeMomo(ec);
        return NextResponse.json({
          platform,
          searchUrl,
          found: products.length,
          items: products.slice(0, 4).map(p => ({
            title: p.title,
            price: p.priceText,
            url: p.sourceUrl,
            image: p.imageUrl,
          })),
          success: true,
          message: products.length === 0
            ? 'Platform reached but no products found. Try a different search term.'
            : undefined,
        });
      } catch {
        return NextResponse.json({
          platform,
          searchUrl,
          found: 0,
          items: [],
          success: false,
          error: 'Could not reach Momo. The site may be temporarily unavailable.',
        });
      }
    }

    // PChome — actually scrape via JSON-LD and return sample results
    if (platform === 'pchome') {
      const ec = { ...criteria, platform: 'pchome' } as EcommerceCriteria;
      const searchUrl = buildPChomeUrl(ec);
      try {
        const products = await scrapePChome(ec);
        return NextResponse.json({
          platform,
          searchUrl,
          found: products.length,
          items: products.slice(0, 4).map(p => ({
            title: p.title,
            price: p.priceText,
            url: p.sourceUrl,
            image: p.imageUrl,
          })),
          success: true,
          message: products.length === 0
            ? 'Platform reached but no products found. Try a different search term.'
            : undefined,
        });
      } catch {
        return NextResponse.json({
          platform,
          searchUrl,
          found: 0,
          items: [],
          success: false,
          error: 'Could not reach PChome. The site may be temporarily unavailable.',
        });
      }
    }

    // Shopee — scrape and return sample results
    if (platform === 'shopee') {
      const ec = { ...criteria, platform: 'shopee' } as EcommerceCriteria;
      const searchUrl = buildShopeeUrl(ec);
      try {
        const products = await scrapeShopee(ec);
        return NextResponse.json({
          platform,
          searchUrl,
          found: products.length,
          items: products.slice(0, 4).map(p => ({
            title: p.title,
            price: p.priceText,
            url: p.sourceUrl,
            image: p.imageUrl,
          })),
          success: true,
          message: products.length === 0
            ? 'Platform reached but no products found. Try a different search term.'
            : undefined,
        });
      } catch {
        return NextResponse.json({
          platform,
          searchUrl,
          found: 0,
          items: [],
          success: false,
          error: 'Could not reach Shopee. The site may be temporarily unavailable.',
        });
      }
    }

    // Amazon — scrape and return sample results
    if (platform === 'amazon') {
      const ec = { ...criteria, platform: 'amazon' } as EcommerceCriteria;
      const searchUrl = buildAmazonUrl(ec);
      try {
        const products = await scrapeAmazon(ec);
        return NextResponse.json({
          platform,
          searchUrl,
          found: products.length,
          items: products.slice(0, 4).map(p => ({
            title: p.title,
            price: p.priceText,
            url: p.sourceUrl,
            image: p.imageUrl,
          })),
          success: true,
          message: products.length === 0
            ? 'Platform reached but no products found, or Amazon may be blocking automated requests. Try a different keyword or ASIN.'
            : undefined,
        });
      } catch {
        return NextResponse.json({
          platform,
          searchUrl,
          found: 0,
          items: [],
          success: false,
          error: 'Could not reach Amazon. The site may be temporarily unavailable or blocking automated requests.',
        });
      }
    }

    // Custom — build the search URL and check reachability only
    const ec = criteria as EcommerceCriteria;
    const searchUrl = buildSearchUrl(platform as Platform, { ...ec, platform: platform as Platform });

    if (!searchUrl) {
      return NextResponse.json({
        platform,
        searchUrl: '',
        found: null,
        items: [],
        success: false,
        error: 'Not enough information to build a search URL. Please fill in the search keyword.',
      });
    }

    let reachable = false;
    try {
      await axios.get(searchUrl, {
        timeout: 8000,
        headers: { 'User-Agent': BROWSER_UA },
        maxRedirects: 5,
        validateStatus: s => s < 500,
      });
      reachable = true;
    } catch {
      reachable = false;
    }

    return NextResponse.json({
      platform,
      searchUrl,
      found: null,
      items: [],
      success: reachable,
      message: reachable
        ? 'Platform is reachable. Monitoring will start once your alert is saved.'
        : undefined,
      error: !reachable
        ? 'Could not reach the platform. It may be temporarily unavailable or blocking automated requests.'
        : undefined,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
