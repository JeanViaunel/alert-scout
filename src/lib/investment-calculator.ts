/**
 * Investment Calculator - Feature 18
 * 
 * Helps users evaluate rental properties as investment opportunities.
 * Calculates ROI, cap rate, cash flow, and 5-year projections.
 */

import { getDb } from './db';
import { v4 as uuidv4 } from 'uuid';

export interface InvestmentParams {
  purchasePrice: number;
  downPaymentPercent: number;  // 20 = 20%
  interestRate: number;        // 2.5 = 2.5%
  loanYears: number;           // 30
  estimatedRent: number;       // Monthly rent
  propertyTaxRate?: number;    // Annual % (default 1.2% for Taiwan)
  managementFeePercent?: number; // Monthly % of rent (default 5%)
  maintenancePercent?: number; // Annual % (default 1%)
}

export interface InvestmentAnalysis {
  purchasePrice: number;
  downPayment: number;
  loanAmount: number;
  monthlyMortgage: number;
  estimatedRent: number;
  monthlyExpenses: {
    propertyTax: number;
    managementFee: number;
    maintenance: number;
    vacancy: number;
    total: number;
  };
  monthlyCashFlow: number;
  annualCashFlow: number;
  noi: number;  // Net Operating Income
  capRate: number;  // NOI / Purchase Price
  cashOnCashReturn: number;  // Annual Cash Flow / Down Payment
  breakEvenOccupancy: number;  // % occupancy needed
  totalCashNeeded: number;  // Down payment + closing costs
  fiveYearProjection: YearlyProjection[];
}

export interface YearlyProjection {
  year: number;
  startingBalance: number;
  principalPaid: number;
  interestPaid: number;
  endingBalance: number;
  rentalIncome: number;
  expenses: number;
  cashFlow: number;
  equity: number;
  roi: number;
}

/**
 * Calculate investment metrics for a property
 */
export function calculateInvestment(params: InvestmentParams): InvestmentAnalysis {
  const {
    purchasePrice,
    downPaymentPercent,
    interestRate,
    loanYears,
    estimatedRent,
    propertyTaxRate = 1.2,
    managementFeePercent = 5,
    maintenancePercent = 1,
  } = params;
  
  // Calculate down payment and loan
  const downPayment = purchasePrice * (downPaymentPercent / 100);
  const loanAmount = purchasePrice - downPayment;
  
  // Calculate monthly mortgage (P&I)
  const monthlyRate = interestRate / 100 / 12;
  const numPayments = loanYears * 12;
  
  let monthlyMortgage = 0;
  if (monthlyRate > 0) {
    monthlyMortgage = loanAmount * 
      (monthlyRate * Math.pow(1 + monthlyRate, numPayments)) / 
      (Math.pow(1 + monthlyRate, numPayments) - 1);
  } else {
    monthlyMortgage = loanAmount / numPayments;
  }
  
  // Monthly expenses
  const propertyTax = purchasePrice * (propertyTaxRate / 100) / 12;
  const managementFee = estimatedRent * (managementFeePercent / 100);
  const maintenance = purchasePrice * (maintenancePercent / 100) / 12;
  const vacancy = estimatedRent / 12;  // 1 month vacancy per year
  
  const totalMonthlyExpenses = propertyTax + managementFee + maintenance + vacancy;
  const totalMonthlyOutflow = monthlyMortgage + totalMonthlyExpenses;
  
  // Cash flow
  const monthlyCashFlow = estimatedRent - totalMonthlyOutflow;
  const annualCashFlow = monthlyCashFlow * 12;
  
  // Net Operating Income (NOI) - before mortgage
  const annualRentalIncome = estimatedRent * 12;
  const annualOperatingExpenses = (propertyTax + managementFee + maintenance + vacancy) * 12;
  const noi = annualRentalIncome - annualOperatingExpenses;
  
  // Return metrics
  const capRate = (noi / purchasePrice) * 100;
  const cashOnCashReturn = (annualCashFlow / downPayment) * 100;
  
  // Break-even occupancy
  const breakEvenOccupancy = (totalMonthlyOutflow / estimatedRent) * 100;
  
  // Total cash needed (down payment + ~3% closing costs)
  const closingCosts = purchasePrice * 0.03;
  const totalCashNeeded = downPayment + closingCosts;
  
  // 5-year projection
  const fiveYearProjection = generateFiveYearProjection({
    purchasePrice,
    loanAmount,
    monthlyMortgage,
    interestRate,
    estimatedRent,
    annualOperatingExpenses,
    downPayment,
  });
  
  return {
    purchasePrice,
    downPayment,
    loanAmount,
    monthlyMortgage,
    estimatedRent,
    monthlyExpenses: {
      propertyTax,
      managementFee,
      maintenance,
      vacancy,
      total: totalMonthlyExpenses,
    },
    monthlyCashFlow,
    annualCashFlow,
    noi,
    capRate,
    cashOnCashReturn,
    breakEvenOccupancy,
    totalCashNeeded,
    fiveYearProjection,
  };
}

/**
 * Generate 5-year projection with amortization
 */
function generateFiveYearProjection(params: {
  purchasePrice: number;
  loanAmount: number;
  monthlyMortgage: number;
  interestRate: number;
  estimatedRent: number;
  annualOperatingExpenses: number;
  downPayment: number;
}): YearlyProjection[] {
  const {
    purchasePrice,
    loanAmount,
    monthlyMortgage,
    interestRate,
    estimatedRent,
    annualOperatingExpenses,
    downPayment,
  } = params;
  
  const projections: YearlyProjection[] = [];
  let remainingBalance = loanAmount;
  const monthlyRate = interestRate / 100 / 12;
  const annualRentIncrease = 0.02;  // Assume 2% annual rent increase
  const annualExpenseIncrease = 0.015;  // 1.5% expense increase
  const annualAppreciation = 0.015;  // 1.5% property appreciation
  
  let currentRent = estimatedRent;
  let currentExpenses = annualOperatingExpenses;
  let propertyValue = purchasePrice;
  
  for (let year = 1; year <= 5; year++) {
    let principalPaid = 0;
    let interestPaid = 0;
    
    // Calculate annual principal and interest
    for (let month = 0; month < 12; month++) {
      const interestPortion = remainingBalance * monthlyRate;
      const principalPortion = monthlyMortgage - interestPortion;
      
      interestPaid += interestPortion;
      principalPaid += principalPortion;
      remainingBalance -= principalPortion;
    }
    
    const rentalIncome = currentRent * 12;
    const cashFlow = rentalIncome - currentExpenses - (monthlyMortgage * 12);
    const equity = purchasePrice - remainingBalance + (propertyValue - purchasePrice);
    
    const roi = (cashFlow + (propertyValue - purchasePrice)) / downPayment * 100;
    
    projections.push({
      year,
      startingBalance: remainingBalance + principalPaid,
      principalPaid,
      interestPaid,
      endingBalance: Math.max(0, remainingBalance),
      rentalIncome,
      expenses: currentExpenses,
      cashFlow,
      equity,
      roi,
    });
    
    // Update for next year
    currentRent *= (1 + annualRentIncrease);
    currentExpenses *= (1 + annualExpenseIncrease);
    propertyValue *= (1 + annualAppreciation);
  }
  
  return projections;
}

/**
 * Save investment analysis to database
 */
export function saveInvestmentAnalysis(
  userId: string,
  matchId: string,
  params: InvestmentParams,
  analysis: InvestmentAnalysis
): string {
  const db = getDb();
  
  const id = uuidv4();
  
  db.prepare(`
    INSERT INTO investment_analyses (
      id, user_id, match_id, purchase_price, down_payment_percent,
      interest_rate, loan_years, estimated_rent, analysis_json, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id,
    userId,
    matchId,
    analysis.purchasePrice,
    params.downPaymentPercent,
    params.interestRate,
    params.loanYears,
    params.estimatedRent,
    JSON.stringify(analysis),
    new Date().toISOString()
  );
  
  return id;
}

/**
 * Get saved analyses for a user
 */
export function getUserAnalyses(userId: string, limit = 10) {
  const db = getDb();
  
  return db.prepare(`
    SELECT ia.*, m.title, m.price as match_price, m.source_url
    FROM investment_analyses ia
    LEFT JOIN matches m ON ia.match_id = m.id
    WHERE ia.user_id = ?
    ORDER BY ia.created_at DESC
    LIMIT ?
  `).all(userId, limit) as Array<{
    id: string;
    match_id: string | null;
    title: string | null;
    match_price: number | null;
    source_url: string | null;
    purchase_price: number;
    down_payment_percent: number;
    interest_rate: number;
    loan_years: number;
    estimated_rent: number;
    analysis_json: string;
    created_at: string;
  }>;
}

/**
 * Compare multiple properties
 */
export function compareProperties(analyses: InvestmentAnalysis[]) {
  return analyses.map(analysis => ({
    purchasePrice: analysis.purchasePrice,
    monthlyMortgage: analysis.monthlyMortgage,
    estimatedRent: analysis.estimatedRent,
    monthlyCashFlow: analysis.monthlyCashFlow,
    capRate: analysis.capRate,
    cashOnCashReturn: analysis.cashOnCashReturn,
    breakEvenOccupancy: analysis.breakEvenOccupancy,
    fiveYearRoi: analysis.fiveYearProjection[4]?.roi || 0,
  })).sort((a, b) => b.cashOnCashReturn - a.cashOnCashReturn);
}

// Export for API routes
export const investmentCalculator = {
  calculateInvestment,
  saveInvestmentAnalysis,
  getUserAnalyses,
  compareProperties,
};
