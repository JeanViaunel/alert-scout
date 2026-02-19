"use client";

import { motion } from "framer-motion";
import { Bell, Home, Search, ShoppingBag, ArrowRight } from "lucide-react";
import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Hero Section */}
      <section className="relative px-6 pt-20 pb-32 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="mb-8 inline-flex items-center rounded-full bg-indigo-50 px-4 py-1.5 text-sm font-medium text-indigo-600 ring-1 ring-inset ring-indigo-700/10"
            >
              <Bell className="mr-2 h-4 w-4" />
              Never miss a deal again
            </motion.div>
            
            <h1 className="text-4xl font-bold tracking-tight text-slate-900 sm:text-6xl">
              Smart Alerts for
              <br />
              <span className="text-indigo-600">Properties & Products</span>
            </h1>
            
            <p className="mt-6 text-lg leading-8 text-slate-600 max-w-2xl mx-auto">
              Set your criteria once, we&apos;ll watch the markets for you. Get instant notifications 
              when rental properties or product deals match your requirements.
            </p>
            
            <div className="mt-10 flex items-center justify-center gap-x-6">
              <Link
                href="/register"
                className="group rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-600/20 hover:bg-indigo-500 hover:shadow-indigo-600/30 transition-all duration-200 flex items-center"
              >
                Get Started Free
                <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                href="/login"
                className="text-sm font-semibold leading-6 text-slate-900 hover:text-indigo-600 transition-colors"
              >
                Sign In <span aria-hidden="true">→</span>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-white">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="mx-auto max-w-2xl text-center"
          >
            <h2 className="text-base font-semibold leading-7 text-indigo-600">
              Features
            </h2>
            <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
              Everything you need to find the best deals
            </p>
          </motion.div>

          <div className="mx-auto mt-16 max-w-7xl">
            <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {[
                {
                  icon: Home,
                  title: "Property Alerts",
                  description: "Monitor rental listings from 591 and other sources. Set price, location, and size filters.",
                },
                {
                  icon: ShoppingBag,
                  title: "Product Tracking",
                  description: "Track products on Momo, PChome, and more. Get notified when prices drop.",
                },
                {
                  icon: Search,
                  title: "Smart Matching",
                  description: "Our system checks multiple sources and only alerts you for items that match your exact criteria.",
                },
                {
                  icon: Bell,
                  title: "Instant Notifications",
                  description: "Get notified via email, WhatsApp, or in-app notifications when we find a match.",
                },
              ].map((feature, index) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1, duration: 0.5 }}
                  className="relative rounded-2xl border border-slate-200 bg-white p-8 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                    <feature.icon className="h-6 w-6" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900">
                    {feature.title}
                  </h3>
                  <p className="mt-2 text-slate-600">{feature.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-slate-900">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="mx-auto max-w-2xl text-center"
          >
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Ready to start saving?
            </h2>
            <p className="mt-6 text-lg leading-8 text-slate-300">
              Create your first alert in minutes. No credit card required.
            </p>
            <div className="mt-10 flex items-center justify-center gap-x-6">
              <Link
                href="/register"
                className="rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-lg hover:bg-indigo-500 transition-colors"
              >
                Create Free Account
              </Link>
              <Link
                href="/login"
                className="text-sm font-semibold leading-6 text-white hover:text-indigo-400 transition-colors"
              >
                Sign In <span aria-hidden="true">→</span>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white py-12">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <Bell className="h-6 w-6 text-indigo-600" />
              <span className="ml-2 text-lg font-semibold text-slate-900">
                Alert Scout
              </span>
            </div>
            <p className="text-sm text-slate-500">
              © 2026 Alert Scout. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </main>
  );
}
