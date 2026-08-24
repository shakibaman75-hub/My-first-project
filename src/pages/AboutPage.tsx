import React from 'react';
import { Link } from 'react-router-dom';
import {
  HeartPulse,
  ShieldCheck,
  Award,
  Users,
  Building2,
  Stethoscope,
  CheckCircle2,
  Clock,
  Sparkles,
  ArrowRight
} from 'lucide-react';

export const AboutPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-slate-950 text-slate-900 dark:text-white py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
        {/* Hero */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <span className="text-xs uppercase font-extrabold tracking-wider text-blue-600 dark:text-blue-400">
            About Shakib Hospital Healthcare System
          </span>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-slate-900 dark:text-white leading-tight">
            Revolutionizing Hospital Access & Patient Care Delivery
          </h1>
          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed">
            Shakib Hospital is India's next-generation hospital appointment scheduling, digital OPD queue management, and patient healthcare record infrastructure designed to connect patients directly with top specialist doctors and premier multi-specialty clinical departments.
          </p>
        </div>

        {/* 4 Pillars */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            {
              title: 'Zero OPD Wait Times',
              desc: 'Live digital token numbers eliminate crowded waiting rooms and provide real-time queue tracking.',
              icon: Clock,
            },
            {
              title: '100% Verified Specialists',
              desc: 'Every practicing doctor is verified against state medical councils and clinical hospital credentials.',
              icon: ShieldCheck,
            },
            {
              title: 'Unified Hospital Network',
              desc: 'Browse multi-specialty hospitals with real-time bed counts, emergency capabilities, and clinical rosters.',
              icon: Building2,
            },
            {
              title: 'Digital Health Records',
              desc: 'Instant access to encrypted PDF prescriptions, diagnostic reports, and medical histories on any device.',
              icon: Award,
            },
          ].map((pillar, i) => {
            const Icon = pillar.icon;
            return (
              <div
                key={i}
                className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-3 hover:border-blue-300 dark:hover:border-blue-800 transition-all"
              >
                <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                  <Icon className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-base text-slate-900 dark:text-white">{pillar.title}</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{pillar.desc}</p>
              </div>
            );
          })}
        </div>

        {/* Mission Statement Banner */}
        <div className="p-8 sm:p-12 rounded-3xl bg-gradient-to-r from-blue-950 via-indigo-950 to-slate-900 text-white shadow-xl space-y-4 border border-blue-900/40">
          <span className="text-xs uppercase font-extrabold tracking-wider text-blue-400">Our Core Mission</span>
          <h2 className="text-2xl sm:text-3xl font-black max-w-2xl">
            "To make world-class healthcare consultations seamless, transparent, and instantly accessible to every patient."
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 max-w-3xl leading-relaxed">
            By fusing modern cloud architectures, AI triage diagnostics, and secured payment systems, MediCare replaces chaotic paper-based hospital registers with clean, modern digital workflows that empower both patients and doctors.
          </p>
        </div>

        {/* Call to Action */}
        <div className="text-center space-y-4 pt-4">
          <h3 className="text-2xl font-bold text-slate-900 dark:text-white">Ready to experience effortless healthcare?</h3>
          <div className="flex flex-wrap justify-center gap-3">
            <Link
              to="/doctors"
              className="px-6 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-lg shadow-blue-600/25 flex items-center gap-2"
            >
              <span>Find Specialist Doctors</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/register"
              className="px-6 py-3 rounded-2xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-bold"
            >
              Create Free Account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
