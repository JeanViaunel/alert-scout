/**
 * POST /api/investment/calculate
 * Calculate investment analysis for a property
 */

import { NextRequest, NextResponse } from 'next/server';
import { investmentCalculator, InvestmentParams } from '@/lib/investment-calculator';
import { getUserIdFromRequest } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const userId = await getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      purchasePrice,
      downPaymentPercent = 20,
      interestRate = 2.5,
      loanYears = 30,
      estimatedRent,
      matchId,
    } = body as InvestmentParams & { matchId?: string };

    // Validate required fields
    if (!purchasePrice || !estimatedRent) {
      return NextResponse.json(
        { error: 'purchasePrice and estimatedRent are required' },
        { status: 400 }
      );
    }

    // Calculate investment
    const analysis = investmentCalculator.calculateInvestment({
      purchasePrice,
      downPaymentPercent,
      interestRate,
      loanYears,
      estimatedRent,
    });

    // Save if matchId provided
    let analysisId: string | null = null;
    if (matchId) {
      analysisId = investmentCalculator.saveInvestmentAnalysis(
        userId,
        matchId,
        { purchasePrice, downPaymentPercent, interestRate, loanYears, estimatedRent },
        analysis
      );
    }

    return NextResponse.json({
      success: true,
      analysisId,
      analysis: {
        ...analysis,
        fiveYearProjection: analysis.fiveYearProjection,
      },
    });
  } catch (error) {
    console.error('Investment calculation error:', error);
    return NextResponse.json(
      { error: 'Failed to calculate investment' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/investment/calculate
 * Get user's saved investment analyses
 */
export async function GET(request: NextRequest) {
  try {
    const userId = await getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');

    const analyses = investmentCalculator.getUserAnalyses(userId, limit);

    return NextResponse.json({
      success: true,
      analyses: analyses.map(a => ({
        ...a,
        analysis: JSON.parse(a.analysis_json),
      })),
    });
  } catch (error) {
    console.error('Get analyses error:', error);
    return NextResponse.json(
      { error: 'Failed to get analyses' },
      { status: 500 }
    );
  }
}
