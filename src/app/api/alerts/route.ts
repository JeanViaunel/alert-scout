import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { createAlert, getAlertsByUser } from '@/lib/alerts';
import { runAlertNow } from '@/lib/queue';
import { z } from 'zod';

export const runtime = 'nodejs';

const createAlertSchema = z.object({
  type: z.enum(['property', 'product']),
  name: z.string().min(1, 'Name is required'),
  // Accept any criteria shape — property or ecommerce
  criteria: z.record(z.string(), z.unknown()),
  sources: z.array(z.string()).min(1, 'At least one source is required'),
  checkFrequency: z.enum(['5min', '15min', '30min', '1hour', 'daily']).default('1hour'),
  notifyMethods: z.array(z.enum(['app', 'email', 'whatsapp'])).default(['app']),
});

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const payload = verifyToken(token);

    const body = await request.json();
    const result = createAlertSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: result.error.flatten() },
        { status: 400 },
      );
    }

    const { type, name, criteria, sources, checkFrequency, notifyMethods } = result.data;

    const alert = createAlert(
      payload.userId,
      type,
      name,
      criteria as any,
      sources,
      checkFrequency,
      notifyMethods,
    );

    // Run the alert immediately in the background — don't block the response.
    // The cron will take over for subsequent runs at the configured frequency.
    setImmediate(() => {
      runAlertNow(alert.id).catch(err =>
        console.error(`Initial run failed for alert "${alert.name}":`, err),
      );
    });

    return NextResponse.json({ message: 'Alert created successfully', alert }, { status: 201 });
  } catch (error: any) {
    console.error('Create alert error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 },
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const payload = verifyToken(token);

    const alerts = getAlertsByUser(payload.userId);

    return NextResponse.json({ alerts });
  } catch (error: any) {
    console.error('Get alerts error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 },
    );
  }
}
