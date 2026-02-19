"use client";

import { useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { LogoMinimal } from '@/components/Logo';
import { FadeIn, ScaleIn } from '@/components/AnimatedContainer';
import { 
  Eye, 
  EyeOff, 
  Loader2, 
  ArrowRight,
  Mail,
  Lock,
  User,
  Phone,
  CheckCircle2,
  Sparkles
} from 'lucide-react';

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState(1);
  const { register, isLoading } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    try {
      await register(formData);
    } catch (err: any) {
      setError(err.message || 'Registration failed');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const isStep1Valid = formData.name.length >= 2 && formData.email.includes('@');
  const isStep2Valid = formData.password.length >= 6;

  return (
    <div className="min-h-screen bg-[#0a0f1a] relative overflow-hidden flex items-center justify-center px-4 py-12">
      {/* Background effects */}
      <div className="absolute inset-0 animated-gradient opacity-30" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(245,158,11,0.08),transparent_50%)]" />
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-[128px]" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-amber-500/5 rounded-full blur-[128px]" />

      <div className="relative w-full max-w-md">
        {/* Logo */}
        <FadeIn className="flex justify-center mb-8">
          <Link href="/" className="flex flex-col items-center gap-4 group">
            <LogoMinimal size={64} />
            <span className="text-2xl font-bold text-white">
              Alert<span className="text-amber-500">Scout</span>
            </span>
          </Link>
        </FadeIn>

        {/* Progress */}
        <FadeIn delay={0.05}>
          <div className="flex items-center gap-2 mb-8">
            {[1, 2].map((s) => (
              <div key={s} className="flex-1 h-1 rounded-full bg-white/10 overflow-hidden">
                <motion.div 
                  className="h-full bg-gradient-to-r from-amber-500 to-amber-600"
                  initial={{ width: 0 }}
                  animate={{ width: step >= s ? '100%' : '0%' }}
                  transition={{ duration: 0.3 }}
                />
              </div>
            ))}
          </div>
        </FadeIn>

        {/* Card */}
        <ScaleIn delay={0.1}>
          <div className="relative">
            {/* Glow effect */}
            <div className="absolute -inset-1 bg-gradient-to-r from-amber-500/20 via-primary/20 to-amber-500/20 rounded-3xl blur-xl opacity-50" />
            
            <div className="relative bg-slate-900/80 backdrop-blur-xl rounded-3xl border border-white/10 p-8 shadow-2xl">
              {/* Header */}
              <div className="text-center mb-8">
                <h1 className="text-2xl font-bold text-white mb-2">
                  {step === 1 ? 'Create your account' : 'Set your password'}
                </h1>
                <p className="text-slate-400">
                  {step === 1 ? 'Start tracking properties and deals today' : 'Almost there!'}
                </p>
              </div>

              {/* Error */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm"
                >
                  {error}
                </motion.div>
              )}

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-5">
                {step === 1 ? (
                  <>
                    {/* Name */}
                    <div>
                      <label htmlFor="name" className="block text-sm font-medium text-slate-300 mb-2">
                        Full Name
                      </label>
                      <div className="relative">
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />
                        <input
                          id="name"
                          name="name"
                          type="text"
                          value={formData.name}
                          onChange={handleChange}
                          required
                          className="w-full pl-12 pr-4 py-3.5 rounded-xl bg-slate-800/50 border border-white/10 text-white placeholder:text-slate-500 focus:border-amber-500/50 focus:ring-2 focus:ring-amber-500/20 transition-all outline-none"
                          placeholder="John Doe"
                        />
                      </div>
                    </div>

                    {/* Email */}
                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-slate-300 mb-2">
                        Email
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />
                        <input
                          id="email"
                          name="email"
                          type="email"
                          value={formData.email}
                          onChange={handleChange}
                          required
                          className="w-full pl-12 pr-4 py-3.5 rounded-xl bg-slate-800/50 border border-white/10 text-white placeholder:text-slate-500 focus:border-amber-500/50 focus:ring-2 focus:ring-amber-500/20 transition-all outline-none"
                          placeholder="you@example.com"
                        />
                      </div>
                    </div>

                    {/* Phone */}
                    <div>
                      <label htmlFor="phone" className="block text-sm font-medium text-slate-300 mb-2">
                        Phone <span className="text-slate-500">(optional)</span>
                      </label>
                      <div className="relative">
                        <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />
                        <input
                          id="phone"
                          name="phone"
                          type="tel"
                          value={formData.phone}
                          onChange={handleChange}
                          className="w-full pl-12 pr-4 py-3.5 rounded-xl bg-slate-800/50 border border-white/10 text-white placeholder:text-slate-500 focus:border-amber-500/50 focus:ring-2 focus:ring-amber-500/20 transition-all outline-none"
                          placeholder="+1 234 567 890"
                        />
                      </div>
                    </div>

                    {/* Continue */}
                    <button
                      type="button"
                      onClick={() => setStep(2)}
                      disabled={!isStep1Valid}
                      className="group w-full bg-gradient-to-r from-amber-500 to-amber-600 text-white py-3.5 rounded-xl font-semibold hover:shadow-lg hover:shadow-amber-500/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      Continue
                      <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                    </button>
                  </>
                ) : (
                  <>
                    {/* Password */}
                    <div>
                      <label htmlFor="password" className="block text-sm font-medium text-slate-300 mb-2">
                        Password
                      </label>
                      <div className="relative">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />
                        <input
                          id="password"
                          name="password"
                          type={showPassword ? 'text' : 'password'}
                          value={formData.password}
                          onChange={handleChange}
                          required
                          minLength={6}
                          className="w-full pl-12 pr-12 py-3.5 rounded-xl bg-slate-800/50 border border-white/10 text-white placeholder:text-slate-500 focus:border-amber-500/50 focus:ring-2 focus:ring-amber-500/20 transition-all outline-none"
                          placeholder="••••••••"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                        >
                          {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                        </button>
                      </div>
                      <p className="mt-2 text-xs text-slate-500">Must be at least 6 characters</p>
                    </div>

                    {/* Benefits */}
                    <div className="space-y-3 py-2">
                      {[
                        'Unlimited alerts',
                        'Real-time notifications',
                        'Multi-platform tracking',
                      ].map((benefit) => (
                        <div key={benefit} className="flex items-center gap-2 text-sm text-slate-400">
                          <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                          {benefit}
                        </div>
                      ))}
                    </div>

                    {/* Submit */}
                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={() => setStep(1)}
                        className="flex-1 py-3.5 border border-white/10 text-slate-300 rounded-xl font-medium hover:bg-white/5 transition-all"
                      >
                        Back
                      </button>
                      <button
                        type="submit"
                        disabled={isLoading || !isStep2Valid}
                        className="flex-[2] bg-gradient-to-r from-amber-500 to-amber-600 text-white py-3.5 rounded-xl font-semibold hover:shadow-lg hover:shadow-amber-500/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                      >
                        {isLoading ? (
                          <>
                            <Loader2 className="h-5 w-5 animate-spin" />
                            Creating...
                          </>
                        ) : (
                          <>
                            Create Account
                            <ArrowRight className="h-5 w-5" />
                          </>
                        )}
                      </button>
                    </div>
                  </>
                )}
              </form>

              {/* Sign in link */}
              {step === 1 && (
                <p className="text-center text-sm text-slate-400 mt-6">
                  Already have an account?{' '}
                  <Link 
                    href="/login" 
                    className="text-amber-500 font-medium hover:text-amber-400 transition-colors"
                  >
                    Sign in
                  </Link>
                </p>
              )}
            </div>
          </div>
        </ScaleIn>

        {/* Back to home */}
        <FadeIn delay={0.3} className="text-center mt-8">
          <Link 
            href="/" 
            className="text-sm text-slate-500 hover:text-slate-300 transition-colors"
          >
            ← Back to home
          </Link>
        </FadeIn>
      </div>
    </div>
  );
}
