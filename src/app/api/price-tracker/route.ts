/**
 * GET /api/price-tracker
 * Get price drop matches for user
 * 
 * POST /api/price-tracker/check
 * Trigger manual price check
 */

import { NextRequest, NextResponse } from 'next/server';
import { priceTracker } from '@/lib/price-tracker';
import { getUserIdFromRequest } from '@/lib/auth-token-server';

export async function GET(request: NextRequest) {
  try {
    const userId = await getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20');

    const matches = priceTracker.getPriceDropMatches(userId, limit);

    return NextResponse.json({
      success: true,
      matches: matches.map(m => ({
        id: m.id,
        title: m.title,
        price: m.price,
        oldPrice: m.old_price,
        changeAmount: m.change_amount,
        changePercent: m.change_percent,
        sourceUrl: m.source_url,
        imageUrl: m.image_url,
      })),
    });
  } catch (error) {
    console.error('Get price drops error:', error);
    return NextResponse.json(
      { error: 'Failed to get price drops' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/price-tracker/check
 * Trigger manual price check (admin only)
 */
export async function POST(request: NextRequest) {
  try {
    // In production, verify admin user
    const userId = await getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const priceChanges = await priceTracker.checkPriceChanges();

    return NextResponse.json({
      success: true,
      message: `Checked prices, found ${priceChanges.length} changes`,
      changes: priceChanges.length,
    });
  } catch (error) {
    console.error('Price check error:', error);
    return NextResponse.json(
      { error: 'Failed to check prices' },
      { status: 500 }
    );
  }
}
