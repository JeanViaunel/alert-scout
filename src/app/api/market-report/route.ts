/**
 * GET /api/market-report
 * Generate market report for WhatsApp
 */

import { NextRequest, NextResponse } from 'next/server';
import { marketReport } from '@/lib/market-report';
import { getUserIdFromRequest } from '@/lib/auth-token-server';

export async function GET(request: NextRequest) {
  try {
    const userId = await getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const city = searchParams.get('city') || 'hsinchu';
    const format = searchParams.get('format') || 'json';

    const report = marketReport.generateMarketReport(city);

    if (format === 'whatsapp') {
      const message = marketReport.formatWhatsAppReport(report);
      return NextResponse.json({
        success: true,
        format: 'whatsapp',
        message,
      });
    }

    return NextResponse.json({
      success: true,
      report,
    });
  } catch (error) {
    console.error('Market report error:', error);
    return NextResponse.json(
      { error: 'Failed to generate market report' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/market-report/send
 * Send weekly reports to all users (admin/cron)
 */
export async function POST(request: NextRequest) {
  try {
    // In production, verify admin user or cron secret
    const userId = await getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await marketReport.scheduleWeeklyReports();

    return NextResponse.json({
      success: true,
      message: 'Weekly reports scheduled',
    });
  } catch (error) {
    console.error('Schedule reports error:', error);
    return NextResponse.json(
      { error: 'Failed to schedule reports' },
      { status: 500 }
    );
  }
}
