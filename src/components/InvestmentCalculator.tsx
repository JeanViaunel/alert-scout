"use client";

import { useState } from "react";
import { 
  Calculator, 
  DollarSign, 
  Percent, 
  Calendar, 
  TrendingUp, 
  ArrowRight,
  Loader2,
  PieChart,
  Wallet
} from "lucide-react";

interface InvestmentAnalysis {
  purchasePrice: number;
  downPayment: number;
  loanAmount: number;
  monthlyMortgage: number;
  estimatedRent: number;
  monthlyCashFlow: number;
  annualCashFlow: number;
  noi: number;
  capRate: number;
  cashOnCashReturn: number;
  breakEvenOccupancy: number;
  totalCashNeeded: number;
}

interface InvestmentCalculatorProps {
  initialPrice?: number;
  matchId?: string;
}

export function InvestmentCalculator({ initialPrice = 0, matchId }: InvestmentCalculatorProps) {
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<InvestmentAnalysis | null>(null);
  const [formData, setFormData] = useState({
    purchasePrice: initialPrice,
    downPaymentPercent: 20,
    interestRate: 2.1,
    loanYears: 30,
    estimatedRent: Math.round(initialPrice * 0.003), // Simple rule of thumb
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: parseFloat(value) || 0,
    }));
  };

  const calculateInvestment = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await fetch("/api/investment/calculate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          matchId,
        }),
      });
      const data = await response.json();
      if (data.success) {
        setAnalysis(data.analysis);
      }
    } catch (error) {
      console.error("Failed to calculate investment:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-amber-500/10 rounded-lg">
          <Calculator className="h-6 w-6 text-amber-500" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-white text-left">Investment Calculator</h3>
          <p className="text-sm text-slate-400 text-left">Analyze rental ROI and cash flow</p>
        </div>
      </div>

      <form onSubmit={calculateInvestment} className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1.5 text-left">
              Purchase Price (NT$)
            </label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
              <input
                type="number"
                name="purchasePrice"
                value={formData.purchasePrice}
                onChange={handleInputChange}
                className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1.5 text-left">
              Down Payment (%)
            </label>
            <div className="relative">
              <Percent className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
              <input
                type="number"
                name="downPaymentPercent"
                value={formData.downPaymentPercent}
                onChange={handleInputChange}
                className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1.5 text-left">
              Estimated Monthly Rent (NT$)
            </label>
            <div className="relative">
              <Wallet className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
              <input
                type="number"
                name="estimatedRent"
                value={formData.estimatedRent}
                onChange={handleInputChange}
                className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50"
              />
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1.5 text-left">
              Interest Rate (%)
            </label>
            <div className="relative">
              <TrendingUp className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
              <input
                type="number"
                step="0.1"
                name="interestRate"
                value={formData.interestRate}
                onChange={handleInputChange}
                className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1.5 text-left">
              Loan Term (Years)
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
              <input
                type="number"
                name="loanYears"
                value={formData.loanYears}
                onChange={handleInputChange}
                className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50"
              />
            </div>
          </div>

          <div className="pt-7">
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white font-bold py-2.5 rounded-xl transition-all flex items-center justify-center gap-2"
            >
              {loading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <>
                  Calculate ROI
                  <ArrowRight className="h-5 w-5" />
                </>
              )}
            </button>
          </div>
        </div>
      </form>

      {analysis && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6 border-t border-white/10 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="bg-white/5 rounded-xl p-4">
            <p className="text-xs text-slate-400 font-medium mb-1 text-left uppercase tracking-wider">Cap Rate</p>
            <p className="text-2xl font-bold text-emerald-400 text-left">{analysis.capRate.toFixed(2)}%</p>
          </div>
          <div className="bg-white/5 rounded-xl p-4">
            <p className="text-xs text-slate-400 font-medium mb-1 text-left uppercase tracking-wider">Cash on Cash</p>
            <p className="text-2xl font-bold text-amber-400 text-left">{analysis.cashOnCashReturn.toFixed(2)}%</p>
          </div>
          <div className="bg-white/5 rounded-xl p-4">
            <p className="text-xs text-slate-400 font-medium mb-1 text-left uppercase tracking-wider">Monthly Cash Flow</p>
            <p className={`text-2xl font-bold text-left ${analysis.monthlyCashFlow >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              NT${Math.round(analysis.monthlyCashFlow).toLocaleString()}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
