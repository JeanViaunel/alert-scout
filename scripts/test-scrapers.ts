/**
 * Run ecommerce scrapers with sample criteria and print results.
 * Usage: npx tsx scripts/test-scrapers.ts
 */

import { scrapePChome } from '../src/lib/scrapers/pchome';
import { scrapeMomo } from '../src/lib/scrapers/momo';
import { scrapeShopee } from '../src/lib/scrapers/shopee';
import { scrapeAmazon } from '../src/lib/scrapers/amazon';

const baseCriteria = { searchQuery: 'iphone', minPrice: undefined, maxPrice: undefined };

async function run(
  name: string,
  platform: 'pchome' | 'momo' | 'shopee' | 'amazon',
  criteria: Record<string, unknown>
) {
  const start = Date.now();
  try {
    let products: Array<{ title: string; priceText: string; sourceUrl: string }> = [];
    if (platform === 'pchome') products = await scrapePChome(criteria as any);
    else if (platform === 'momo') products = await scrapeMomo(criteria as any);
    else if (platform === 'shopee') products = await scrapeShopee(criteria as any);
    else if (platform === 'amazon') products = await scrapeAmazon(criteria as any);
    const ms = Date.now() - start;
    console.log(`\n--- ${name} ---`);
    console.log(`Found: ${products.length} products (${ms}ms)`);
    products.slice(0, 3).forEach((p, i) => {
      console.log(`  ${i + 1}. ${p.title?.slice(0, 50)}... | ${p.priceText} | ${p.sourceUrl?.slice(0, 50)}...`);
    });
    return { ok: true, count: products.length, ms };
  } catch (err: any) {
    console.log(`\n--- ${name} ---`);
    console.log(`Error: ${err?.message ?? err}`);
    return { ok: false, error: err?.message ?? String(err) };
  }
}

async function main() {
  console.log('Testing ecommerce scrapers (sample query: "iphone")...\n');

  const pchome = await run('PChome', 'pchome', { ...baseCriteria, platform: 'pchome' });
  const momo = await run('Momo', 'momo', { ...baseCriteria, platform: 'momo' });
  const shopee = await run('Shopee', 'shopee', { ...baseCriteria, platform: 'shopee' });
  const amazon = await run('Amazon', 'amazon', { ...baseCriteria, platform: 'amazon', currency: 'USD' });

  console.log('\n--- Summary ---');
  console.log('PChome:', pchome.ok ? `${pchome.count} products (${pchome.ms}ms)` : `FAIL: ${pchome.error}`);
  console.log('Momo:  ', momo.ok ? `${momo.count} products (${momo.ms}ms)` : `FAIL: ${momo.error}`);
  console.log('Shopee:', shopee.ok ? `${shopee.count} products (${shopee.ms}ms)` : `FAIL: ${shopee.error}`);
  console.log('Amazon:', amazon.ok ? `${amazon.count} products (${amazon.ms}ms)` : `FAIL: ${amazon.error}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
