/*import { redirect } from "next/navigation";

export default function RootPage() {
  redirect("/mail/inbox");
}
*/

"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Send, Bell, ArrowRight, Zap, Users, Shield } from "lucide-react";

export default function HomePage() {
  const router = useRouter();

  const handleNavigate = (path: string) => {
    localStorage.setItem("isAuthenticated", "true");
    localStorage.setItem("userEmail", "user@example.com");
    router.push(path);
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-50">
      {/* Navigation Header */}
      <header className="fixed top-0 w-full bg-white dark:bg-gray-900/80 dark:backdrop-blur border-b border-gray-200 dark:border-gray-800/50 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer group" onClick={() => window.location.reload()}>
            <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 shadow-lg group-hover:shadow-xl transition-shadow">
              <Send className="w-4 h-4 text-white" />
            </div>
            <span className="text-xl font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              DIMS
            </span>
          </div>

          <nav className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition">
              Features
            </a>
            <a href="#services" className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition">
              Services
            </a>
            <button
              onClick={() => handleNavigate("/mail/compose")}
              className="px-5 py-2 text-sm font-medium bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:shadow-lg transition-all duration-200"
            >
              Get Started
            </button>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <h1 className="text-5xl md:text-6xl font-bold leading-tight">
                Digital
                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
                  Internal Mail System
                </span>
              </h1>
              <p className="text-lg text-gray-600 dark:text-gray-400 leading-relaxed">
                Professional email composition and company announcements in one unified platform. Streamline your internal communications with ease.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <button
                  onClick={() => handleNavigate("/mail/compose")}
                  className="flex items-center justify-center gap-2 px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-lg hover:shadow-lg hover:scale-105 transition-all duration-200"
                >
                  <Send className="w-5 h-5" />
                  Compose Email
                </button>
                <button
                  onClick={() => handleNavigate("/mail/announcements")}
                  className="flex items-center justify-center gap-2 px-8 py-3 border-2 border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white font-semibold rounded-lg hover:bg-gray-50 dark:hover:bg-gray-900 transition-all duration-200"
                >
                  <Bell className="w-5 h-5" />
                  View Announcements
                </button>
              </div>
            </div>

            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-indigo-600/20 rounded-2xl blur-3xl"></div>
              <div className="relative bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-900 dark:to-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-8 shadow-2xl">
                <div className="space-y-4">
                  <div className="h-3 bg-gray-300 dark:bg-gray-700 rounded-full w-3/4"></div>
                  <div className="h-3 bg-gray-300 dark:bg-gray-700 rounded-full w-1/2"></div>
                  <div className="pt-4 space-y-3">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="flex gap-3 p-3 rounded-lg bg-white dark:bg-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700 transition">
                        <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                        <div className="flex-1 space-y-2">
                          <div className="h-2 bg-gray-300 dark:bg-gray-600 rounded w-3/4"></div>
                          <div className="h-2 bg-gray-300 dark:bg-gray-600 rounded w-1/2"></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-6 bg-gray-50 dark:bg-gray-900/50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-16">
            Powerful Features
          </h2>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: Send,
                title: "Compose Emails",
                description: "Create and send professional emails with file attachments seamlessly integrated.",
              },
              {
                icon: Bell,
                title: "Announcements",
                description: "Stay informed with company-wide announcements filtered by department and type.",
              },
              {
                icon: Zap,
                title: "Real-time Updates",
                description: "Instant notifications and live updates for all your communications.",
              },
            ].map((feature, idx) => {
              const Icon = feature.icon;
              return (
                <div
                  key={idx}
                  className="group p-8 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:shadow-lg hover:border-blue-300 dark:hover:border-blue-700 transition-all duration-300"
                >
                  <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 group-hover:scale-110 transition-transform mb-4">
                    <Icon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                  <p className="text-gray-600 dark:text-gray-400">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section id="services" className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div className="space-y-8">
              <h2 className="text-4xl font-bold">
                Everything You Need
              </h2>

              {[
                { icon: Users, title: "Team Collaboration", desc: "Work seamlessly with your team" },
                { icon: Shield, title: "Secure & Private", desc: "Enterprise-grade security" },
                { icon: Zap, title: "Fast & Reliable", desc: "Lightning quick performance" },
              ].map((service, idx) => {
                const Icon = service.icon;
                return (
                  <div key={idx} className="flex gap-4">
                    <div className="flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                      <Icon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <h3 className="font-semibold mb-1">{service.title}</h3>
                      <p className="text-gray-600 dark:text-gray-400 text-sm">{service.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl p-12 text-white shadow-2xl">
              <h3 className="text-3xl font-bold mb-4">Ready to get started?</h3>
              <p className="text-blue-100 mb-8 text-lg">
                Join thousands of professionals using DIMS for seamless communication.
              </p>
              <button
                onClick={() => handleNavigate("/mail/compose")}
                className="flex items-center gap-2 px-8 py-4 bg-white text-blue-600 font-semibold rounded-lg hover:bg-blue-50 transition-all duration-200 group"
              >
                Start Composing
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50">
        <div className="max-w-6xl mx-auto px-6 py-12">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <li><a href="#" className="hover:text-gray-900 dark:hover:text-white transition">Features</a></li>
                <li><a href="#" className="hover:text-gray-900 dark:hover:text-white transition">Pricing</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <li><a href="#" className="hover:text-gray-900 dark:hover:text-white transition">About</a></li>
                <li><a href="#" className="hover:text-gray-900 dark:hover:text-white transition">Blog</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Resources</h4>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <li><a href="#" className="hover:text-gray-900 dark:hover:text-white transition">Docs</a></li>
                <li><a href="#" className="hover:text-gray-900 dark:hover:text-white transition">Support</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <li><a href="#" className="hover:text-gray-900 dark:hover:text-white transition">Privacy</a></li>
                <li><a href="#" className="hover:text-gray-900 dark:hover:text-white transition">Terms</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-200 dark:border-gray-800 pt-8 flex flex-col sm:flex-row justify-between items-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              © 2024 DIMS. All rights reserved.
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Crafted with care for seamless communication
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
