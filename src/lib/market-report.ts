/**
 * Market Report Generator - Feature 17
 * 
 * Generates weekly market insights for WhatsApp delivery.
 * Includes statistics, trends, and hot deals.
 */

import { getDb } from './db';

export interface MarketReport {
  period: {
    start: Date;
    end: Date;
    label: string;
  };
  city: string;
  metrics: {
    totalListings: number;
    newThisWeek: number;
    newThisWeekPercent: number;
    avgPrice: number;
    avgPriceChange: number;
    avgPriceChangePercent: number;
    avgArea: number;
    avgPricePerArea: number;
    pricePerAreaChange: number;
  };
  priceDistribution: {
    under15k: number;
    range15k_20k: number;
    range20k_25k: number;
    range25k_30k: number;
    over30k: number;
  };
  topDistricts: DistrictStats[];
  hotKeywords: string[];
  bestDeals: BestDeal[];
  priceTrend: WeeklyTrend[];
}

export interface DistrictStats {
  district: string;
  listingCount: number;
  avgPrice: number;
  priceChange: number;
}

export interface BestDeal {
  title: string;
  price: number;
  district: string;
  marketAvg: number;
  savings: number;
  sourceUrl: string;
}

export interface WeeklyTrend {
  week: string;
  avgPrice: number;
}

/**
 * Generate weekly market report
 */
export function generateMarketReport(
  city: string = 'hsinchu',
  weeks: number = 1
): MarketReport {
  const db = getDb();
  
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const fourWeeksAgo = new Date(now.getTime() - 28 * 24 * 60 * 60 * 1000);
  
  // Get current week stats
  const currentStats = db.prepare(`
    SELECT 
      COUNT(*) as total_listings,
      AVG(price) as avg_price,
      AVG(CASE WHEN area > 0 THEN price / area ELSE NULL END) as avg_price_per_area,
      AVG(area) as avg_area,
      COUNT(CASE WHEN created_at > ? THEN 1 END) as new_this_week
    FROM matches
    WHERE source = '591'
      AND location LIKE ?
      AND created_at > ?
  `).get(weekAgo.toISOString(), `%${city}%`, fourWeeksAgo.toISOString()) as {
    total_listings: number;
    avg_price: number;
    avg_price_per_area: number;
    avg_area: number;
    new_this_week: number;
  };
  
  // Get previous week stats for comparison
  const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
  const previousStats = db.prepare(`
  SELECT 
    AVG(price) as avg_price,
    AVG(CASE WHEN area > 0 THEN price / area ELSE NULL END) as avg_price_per_area
  FROM matches
  WHERE source = '591'
    AND location LIKE ?
    AND created_at BETWEEN ? AND ?
  `).get(`%${city}%`, twoWeeksAgo.toISOString(), weekAgo.toISOString()) as {
  avg_price: number;
  avg_price_per_area: number;
  } | undefined;  
  const avgPrice = currentStats.avg_price || 0;
  const prevAvgPrice = previousStats?.avg_price || 0;
  const avgPriceChange = avgPrice - prevAvgPrice;
  const avgPriceChangePercent = prevAvgPrice > 0 ? (avgPriceChange / prevAvgPrice) * 100 : 0;
  
  const pricePerArea = currentStats.avg_price_per_area || 0;
  const prevPricePerArea = previousStats?.avg_price_per_area || 0;
  const pricePerAreaChange = pricePerArea - prevPricePerArea;
  
  // Price distribution
  const distribution = db.prepare(`
    SELECT 
      COUNT(CASE WHEN price < 15000 THEN 1 END) as under15k,
      COUNT(CASE WHEN price BETWEEN 15000 AND 20000 THEN 1 END) as range15k_20k,
      COUNT(CASE WHEN price BETWEEN 20000 AND 25000 THEN 1 END) as range20k_25k,
      COUNT(CASE WHEN price BETWEEN 25000 AND 30000 THEN 1 END) as range25k_30k,
      COUNT(CASE WHEN price > 30000 THEN 1 END) as over30k
    FROM matches
    WHERE source = '591'
      AND location LIKE ?
      AND created_at > ?
  `).get(`%${city}%`, weekAgo.toISOString()) as {
    under15k: number;
    range15k_20k: number;
    range20k_25k: number;
    range25k_30k: number;
    over30k: number;
  };
  
  // Top districts
  const topDistricts = db.prepare(`
    SELECT 
      location as district,
      COUNT(*) as listing_count,
      AVG(price) as avg_price
    FROM matches
    WHERE source = '591'
      AND location LIKE ?
      AND created_at > ?
    GROUP BY location
    ORDER BY listing_count DESC
    LIMIT 5
  `).all(`%${city}%`, weekAgo.toISOString()) as Array<{
    district: string;
    listing_count: number;
    avg_price: number;
  }>;
  
  // Hot keywords from alerts
  const hotKeywords = db.prepare(`
    SELECT keyword, COUNT(*) as usage_count
    FROM (
      SELECT json_each.value as keyword
      FROM alerts, json_each(alerts.criteria)
      WHERE json_valid(alerts.criteria)
        AND alerts.created_at > ?
    )
    GROUP BY keyword
    ORDER BY usage_count DESC
    LIMIT 5
  `).all(weekAgo.toISOString()) as Array<{
    keyword: string;
    usage_count: number;
  }>;
  
  // Best deals (priced significantly below market average)
  const bestDeals = db.prepare(`
    SELECT 
      title,
      price,
      location as district,
      source_url,
      ? as market_avg
    FROM matches
    WHERE source = '591'
      AND location LIKE ?
      AND created_at > ?
      AND price < ? * 0.85  -- At least 15% below market
    ORDER BY price ASC
    LIMIT 3
  `).all(avgPrice, `%${city}%`, weekAgo.toISOString(), avgPrice) as Array<{
    title: string;
    price: number;
    district: string;
    source_url: string;
    market_avg: number;
  }>;
  
  // 4-week price trend
  const priceTrend: WeeklyTrend[] = [];
  for (let i = 4; i >= 1; i--) {
    const weekStart = new Date(now.getTime() - i * 7 * 24 * 60 * 60 * 1000);
    const weekEnd = new Date(now.getTime() - (i - 1) * 7 * 24 * 60 * 60 * 1000);
    
    const weekData = db.prepare(`
      SELECT AVG(price) as avg_price
      FROM matches
      WHERE source = '591'
        AND location LIKE ?
        AND created_at BETWEEN ? AND ?
    `).get(`%${city}%`, weekStart.toISOString(), weekEnd.toISOString()) as {
      avg_price: number;
    } | undefined;
    
    priceTrend.push({
      week: `Week ${5 - i}`,
      avgPrice: weekData?.avg_price || 0,
    });
  }
  
  return {
    period: {
      start: weekAgo,
      end: now,
      label: `${formatDate(weekAgo)} - ${formatDate(now)}`,
    },
    city,
    metrics: {
      totalListings: currentStats.total_listings,
      newThisWeek: currentStats.new_this_week,
      newThisWeekPercent: currentStats.total_listings > 0 
        ? (currentStats.new_this_week / currentStats.total_listings) * 100 
        : 0,
      avgPrice: Math.round(avgPrice),
      avgPriceChange: Math.round(avgPriceChange),
      avgPriceChangePercent: parseFloat(avgPriceChangePercent.toFixed(1)),
      avgArea: parseFloat((currentStats.avg_area || 0).toFixed(1)),
      avgPricePerArea: Math.round(pricePerArea),
      pricePerAreaChange: Math.round(pricePerAreaChange),
    },
    priceDistribution: {
      under15k: distribution.under15k,
      range15k_20k: distribution.range15k_20k,
      range20k_25k: distribution.range20k_25k,
      range25k_30k: distribution.range25k_30k,
      over30k: distribution.over30k,
    },
    topDistricts: topDistricts.map(d => ({
      district: d.district.replace(city, '').trim(),
      listingCount: d.listing_count,
      avgPrice: Math.round(d.avg_price),
      priceChange: 0,  // Would need historical data
    })),
    hotKeywords: hotKeywords.map(k => k.keyword),
    bestDeals: bestDeals.map(d => ({
      title: d.title,
      price: d.price,
      district: d.district.replace(city, '').trim(),
      marketAvg: Math.round(d.market_avg),
      savings: Math.round(d.market_avg - d.price),
      sourceUrl: d.source_url,
    })),
    priceTrend,
  };
}

/**
 * Format market report for WhatsApp
 */
export function formatWhatsAppReport(report: MarketReport): string {
  const trendArrow = report.metrics.avgPriceChange >= 0 ? '📈' : '📉';
  const trendDirection = report.metrics.avgPriceChange >= 0 ? 'Rising' : 'Falling';
  
  let message = `🏠 Alert Scout Weekly Market Report
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📍 ${capitalizeFirst(report.city)} | ${report.period.label}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📊 Market Overview
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Total Active Listings: ${report.metrics.totalListings.toLocaleString()}
New This Week: +${report.metrics.newThisWeek} (${report.metrics.newThisWeekPercent.toFixed(0)}%)
Average Rent: NT$${report.metrics.avgPrice.toLocaleString()}/mo (${trendArrow}NT$${Math.abs(report.metrics.avgPriceChange).toLocaleString()})
Avg Price per Area: NT$${report.metrics.avgPricePerArea.toLocaleString()} (${trendArrow}NT$${Math.abs(report.metrics.pricePerAreaChange)})

📈 Price Trend (4 weeks)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`;

  report.priceTrend.forEach((week, i) => {
    const bar = '█'.repeat(Math.round(week.avgPrice / 1000));
    message += `\n${week.week}: NT$${Math.round(week.avgPrice).toLocaleString()} ${bar}`;
  });

  message += `

Trend: ${trendArrow} ${trendDirection} (${report.metrics.avgPriceChangePercent > 0 ? '+' : ''}${report.metrics.avgPriceChangePercent}% in 4 weeks)

🏘️ Top Districts by Volume
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`;

  report.topDistricts.forEach((district, i) => {
    message += `\n${i + 1}. ${capitalizeFirst(district.district)} - ${district.listingCount} listings (NT$${district.avgPrice.toLocaleString()} avg)`;
  });

  message += `

🔥 Hot Search Terms
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`;

  report.hotKeywords.forEach((keyword, i) => {
    if (typeof keyword === 'string') {
      message += `\n#${keyword.replace(/\s+/g, '-')}`;
    }
  });

  message += `

💰 Best Deals This Week
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`;

  report.bestDeals.forEach((deal, i) => {
    message += `
${i + 1}. ${deal.title} - NT$${deal.price.toLocaleString()}
   (Market avg: NT$${deal.marketAvg.toLocaleString()} | Save NT$${deal.savings.toLocaleString()}!)`;
  });

  message += `

📱 Quick Actions
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

• Create alert: Reply "ALERT <district> <budget>"
• View listings: Reply "LISTINGS <district>"
• Pause reports: Reply "STOP REPORTS"

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Report generated by Alert Scout 🧬`;

  return message;
}

/**
 * Schedule weekly report sending
 */
export function scheduleWeeklyReports() {
  const db = getDb();
  
  // Get all users with WhatsApp enabled
  const users = db.prepare(`
    SELECT u.id, u.phone, rp.districts
    FROM users u
    JOIN report_preferences rp ON u.id = rp.user_id
    WHERE rp.whatsapp_enabled = 1
      AND rp.frequency = 'weekly'
  `).all() as Array<{
    id: string;
    phone: string;
    districts: string;
  }>;
  
  console.log(`📬 Scheduling weekly reports for ${users.length} users`);
  
  // In production, this would integrate with WhatsApp Business API
  // For now, we'll log the messages
  users.forEach(user => {
    const districts = user.districts ? JSON.parse(user.districts) : ['east', 'north'];
    
    districts.forEach((district: string) => {
      const report = generateMarketReport(district);
      const message = formatWhatsAppReport(report);
      
      console.log(`\n📱 WhatsApp message for ${user.phone}:`);
      console.log(message);
      
      // TODO: Integrate with WhatsApp API
      // await sendWhatsAppMessage(user.phone, message);
    });
    
    // Update last sent timestamp
    db.prepare(`
      UPDATE report_preferences 
      SET last_sent_at = CURRENT_TIMESTAMP 
      WHERE user_id = ?
    `).run(user.id);
  });
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('en-TW', { month: 'short', day: 'numeric' });
}

function capitalizeFirst(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// Export for API routes and cron jobs
export const marketReport = {
  generateMarketReport,
  formatWhatsAppReport,
  scheduleWeeklyReports,
};
