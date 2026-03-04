import { NextRequest, NextResponse } from 'next/server';
import { getUserFromToken } from '@/lib/auth-token-server';
import { generateRecommendations } from '@/lib/recommendations/engine';

/**
 * GET /api/recommendations
 * Returns personalized listing recommendations based on user favorites and interactions.
 */
export async function GET(request: NextRequest) {
  const user = getUserFromToken(request);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = request.nextUrl;
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    
    const recommendations = await generateRecommendations(user.id, limit);
    return NextResponse.json(recommendations);
  } catch (error) {
    console.error('Error generating recommendations:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
