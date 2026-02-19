"use client";

import { useAuth } from '@/hooks/useAuth';
import { motion } from 'framer-motion';
import { Bell, Home, Search, Settings, Plus, LogOut } from 'lucide-react';
import Link from 'next/link';

export default function DashboardPage() {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <Bell className="h-6 w-6 text-indigo-600" />
              <span className="text-xl font-bold text-slate-900">Alert Scout</span>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-slate-600">Welcome, {user?.name}</span>
              <button
                onClick={logout}
                className="p-2 text-slate-400 hover:text-slate-600 transition-colors"
              >
                <LogOut className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {[
            { label: 'Active Alerts', value: '0', icon: Bell, color: 'bg-blue-500' },
            { label: 'Matches Found', value: '0', icon: Search, color: 'bg-emerald-500' },
            { label: 'Saved Items', value: '0', icon: Home, color: 'bg-amber-500' },
          ].map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white rounded-xl p-6 shadow-sm border border-slate-200"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">{stat.label}</p>
                  <p className="text-3xl font-bold text-slate-900 mt-2">{stat.value}</p>
                </div>
                <div className={`${stat.color} p-3 rounded-xl`}>
                  <stat.icon className="h-6 w-6 text-white" />
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-gradient-to-br from-indigo-600 to-indigo-700 rounded-xl p-8 text-white"
          >
            <h2 className="text-2xl font-bold mb-2">Create New Alert</h2>
            <p className="text-indigo-100 mb-6">
              Set up a new alert to track properties or products. We'll notify you when we find matches.
            </p>
            <Link
              href="/alerts/new"
              className="inline-flex items-center gap-2 bg-white text-indigo-600 px-6 py-3 rounded-xl font-semibold hover:bg-indigo-50 transition-colors"
            >
              <Plus className="h-5 w-5" />
              Create Alert
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white rounded-xl p-8 border border-slate-200"
          >
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Recent Matches</h2>
            <p className="text-slate-600 mb-6">
              No matches found yet. Create an alert to start tracking!
            </p>
            <Link
              href="/matches"
              className="inline-flex items-center gap-2 text-indigo-600 font-semibold hover:text-indigo-500"
            >
              View all matches
              <span aria-hidden="true">→</span>
            </Link>
          </motion.div>
        </div>

        {/* Navigation Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'My Alerts', href: '/alerts', icon: Bell },
            { label: 'Matches', href: '/matches', icon: Search },
            { label: 'Profile', href: '/profile', icon: Settings },
          ].map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className="bg-white p-6 rounded-xl border border-slate-200 hover:border-indigo-300 hover:shadow-md transition-all text-center group"
            >
              <item.icon className="h-8 w-8 text-slate-400 group-hover:text-indigo-600 mx-auto mb-3 transition-colors" />
              <span className="font-medium text-slate-700 group-hover:text-slate-900">
                {item.label}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
