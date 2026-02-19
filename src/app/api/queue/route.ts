import { NextRequest, NextResponse } from 'next/server';
import { scheduleAlertChecks, stopAlertChecks, triggerAlertCheck, getSchedulerStatus } from '@/lib/queue';

export const runtime = 'nodejs';

// Initialize scheduler on first request
let initialized = false;

export async function POST(request: NextRequest) {
  try {
    if (!initialized) {
      scheduleAlertChecks();
      initialized = true;
    }

    const body = await request.json();
    const { action } = body;

    if (action === 'trigger') {
      // Manual trigger
      const result = await triggerAlertCheck();
      return NextResponse.json({
        message: 'Alert check triggered',
        result,
      });
    }

    if (action === 'start') {
      scheduleAlertChecks();
      return NextResponse.json({ message: 'Scheduler started' });
    }

    if (action === 'stop') {
      stopAlertChecks();
      return NextResponse.json({ message: 'Scheduler stopped' });
    }

    if (action === 'status') {
      const status = getSchedulerStatus();
      return NextResponse.json({ status });
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    );

  } catch (error: any) {
    console.error('Queue API error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    if (!initialized) {
      scheduleAlertChecks();
      initialized = true;
    }

    const status = getSchedulerStatus();
    return NextResponse.json({ status });

  } catch (error: any) {
    console.error('Queue status error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
