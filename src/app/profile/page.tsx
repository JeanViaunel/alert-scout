"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  Loader2,
  User,
  Mail,
  Phone,
  Lock,
  ArrowLeft,
  Check,
  AlertCircle,
  Shield,
  Sparkles,
} from "lucide-react";
import { Header } from "@/components/Header";
import { Card } from "@/components/Card";
import { PageHeader } from "@/components/PageHeader";
import { FadeIn } from "@/components/AnimatedContainer";

export default function ProfilePage() {
  const { user, logout, refreshUser } = useAuth();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    if (user) {
      setName(user.name);
      setPhone(user.phone ?? "");
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    if (password && password !== confirmPassword) {
      setMessage({ type: "error", text: "Passwords do not match" });
      return;
    }
    setSaving(true);
    try {
      const token =
        typeof window !== "undefined" ? localStorage.getItem("auth-token") : null;
      const body: { name?: string; phone?: string | null; password?: string } = {
        name: name.trim(),
        phone: phone.trim() || null,
      };
      if (password) body.password = password;

      const res = await fetch("/api/user/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        credentials: "include",
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Update failed");
      }
      await refreshUser();
      setMessage({ type: "success", text: "Profile updated successfully" });
      setPassword("");
      setConfirmPassword("");
    } catch (err: unknown) {
      setMessage({
        type: "error",
        text: err instanceof Error ? err.message : "Update failed",
      });
    } finally {
      setSaving(false);
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-[#0a0f1a]">
      {/* Header */}
      <Header />

      <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <FadeIn>
          {/* ---- Page Header ---- */}
          <PageHeader
            title="Profile"
            subtitle="Manage your account details and preferences"
            backHref="/"
            backLabel="Back to dashboard"
          />
        </FadeIn>

        <FadeIn delay={0.1}>
          <Card className="p-6 sm:p-8" glow>
            {/* Header Section */}
            <div className="flex items-center gap-4 mb-8">
              <div className="relative">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/25">
                  <User className="h-8 w-8 text-slate-900" />
                </div>
                <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-emerald-500 border-2 border-[#0a0f1a] flex items-center justify-center">
                  <Check className="h-3.5 w-3.5 text-white" />
                </div>
              </div>
              <div className="flex-1">
                <h1 className="text-xl font-bold text-white">{user.name}</h1>
                <p className="text-sm text-slate-400">{user.email}</p>
                <div className="flex items-center gap-2 mt-2">
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/20">
                    <Sparkles className="h-3 w-3 text-amber-400" />
                    <span className="text-xs font-medium text-amber-400">Pro Member</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Message Alert */}
            {message && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`mb-6 p-4 rounded-xl text-sm flex items-center gap-3 border ${
                  message.type === "success"
                    ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                    : "bg-rose-500/10 text-rose-400 border-rose-500/20"
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                    message.type === "success" ? "bg-emerald-500/20" : "bg-rose-500/20"
                  }`}
                >
                  {message.type === "success" ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <AlertCircle className="h-4 w-4" />
                  )}
                </div>
                {message.text}
              </motion.div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Personal Info Section */}
              <div className="space-y-5">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 rounded-lg bg-slate-800/50 border border-white/10 flex items-center justify-center">
                    <User className="h-4 w-4 text-amber-400" />
                  </div>
                  <h2 className="text-sm font-semibold text-white uppercase tracking-wider">
                    Personal Information
                  </h2>
                </div>

                <div className="grid sm:grid-cols-2 gap-5">
                  <div>
                    <label
                      htmlFor="name"
                      className="block text-sm font-medium text-slate-300 mb-2"
                    >
                      Full Name
                    </label>
                    <div className="relative">
                      <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                      <input
                        id="name"
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                        minLength={2}
                        className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-800/50 border border-white/10 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500/50 transition-all duration-200"
                        placeholder="Your name"
                      />
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="email"
                      className="block text-sm font-medium text-slate-300 mb-2"
                    >
                      Email Address
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                      <input
                        id="email"
                        type="email"
                        value={user.email}
                        readOnly
                        className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-900/50 border border-white/5 text-slate-500 cursor-not-allowed"
                      />
                    </div>
                    <p className="mt-1.5 text-xs text-slate-500">
                      Email cannot be changed
                    </p>
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="phone"
                    className="block text-sm font-medium text-slate-300 mb-2"
                  >
                    Phone Number
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                    <input
                      id="phone"
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-800/50 border border-white/10 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500/50 transition-all duration-200"
                      placeholder="Optional"
                    />
                  </div>
                </div>
              </div>

              {/* Divider */}
              <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

              {/* Password Section */}
              <div className="space-y-5">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 rounded-lg bg-slate-800/50 border border-white/10 flex items-center justify-center">
                    <Shield className="h-4 w-4 text-amber-400" />
                  </div>
                  <h2 className="text-sm font-semibold text-white uppercase tracking-wider">
                    Change Password
                  </h2>
                </div>

                <div className="grid sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      New Password
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                      <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Leave blank to keep"
                        className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-800/50 border border-white/10 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500/50 transition-all duration-200"
                        autoComplete="new-password"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Confirm Password
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                      <input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Confirm new password"
                        className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-800/50 border border-white/10 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500/50 transition-all duration-200"
                        autoComplete="new-password"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-amber-500 text-slate-900 font-semibold rounded-xl hover:bg-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-500/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg shadow-amber-500/25 hover:shadow-amber-500/40"
                >
                  {saving ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Saving…
                    </>
                  ) : (
                    <>
                      <Check className="h-4 w-4" />
                      Save Changes
                    </>
                  )}
                </button>
                <Link
                  href="/"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 border border-white/10 text-slate-300 font-medium rounded-xl hover:bg-white/5 hover:text-white transition-all duration-200"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back to Dashboard
                </Link>
              </div>
            </form>
          </Card>
        </FadeIn>

        {/* Account Info Card */}
        <FadeIn delay={0.2}>
          <Card className="p-6 mt-6">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-slate-800/50 border border-white/10 flex items-center justify-center">
                <Shield className="h-4 w-4 text-emerald-400" />
              </div>
              <h2 className="text-sm font-semibold text-white uppercase tracking-wider">
                Account Security
              </h2>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between py-3 border-b border-white/5">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-emerald-400 shadow-lg shadow-emerald-400/30" />
                  <span className="text-sm text-slate-300">Two-factor authentication</span>
                </div>
                <span className="text-xs font-medium text-emerald-400 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                  Enabled
                </span>
              </div>
              <div className="flex items-center justify-between py-3 border-b border-white/5">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-emerald-400 shadow-lg shadow-emerald-400/30" />
                  <span className="text-sm text-slate-300">Email verification</span>
                </div>
                <span className="text-xs font-medium text-emerald-400 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                  Verified
                </span>
              </div>
              <div className="flex items-center justify-between py-3">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-amber-400 shadow-lg shadow-amber-400/30" />
                  <span className="text-sm text-slate-300">Last password change</span>
                </div>
                <span className="text-xs text-slate-500">Never</span>
              </div>
            </div>
          </Card>
        </FadeIn>
      </main>
    </div>
  );
}
