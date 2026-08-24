import React from 'react';
import { Link } from 'react-router-dom';
import {
  HeartPulse,
  PhoneCall,
  Mail,
  MapPin,
  ShieldCheck,
  Award,
  Clock,
  ArrowRight,
  Sparkles
} from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-slate-950 text-slate-400 text-xs border-t border-slate-800">
      {/* Emergency Hotline Strip */}
      <div className="bg-gradient-to-r from-blue-950/80 via-slate-900 to-indigo-950/80 py-6 px-4 border-b border-slate-800">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center border border-rose-500/30">
              <PhoneCall className="w-5 h-5 animate-bounce" />
            </div>
            <div>
              <h4 className="font-bold text-white text-sm">Need Urgent Medical Assistance or Ambulance?</h4>
              <p className="text-slate-300 text-xs">Our 24x7 Trauma & Critical Care Helpdesk is ready to dispatch instant aid.</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <a
              href="tel:108"
              className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-rose-600/30 transition-all"
            >
              <PhoneCall className="w-4 h-4" />
              <span>Ambulance: 108</span>
            </a>
            <a
              href="tel:1800123456"
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs border border-slate-700 transition-colors"
            >
              Helpline: 1800-123-456
            </a>
          </div>
        </div>
      </div>

      {/* Main Links Area */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
          {/* Col 1: About Brand */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white">
                <HeartPulse className="w-5 h-5" />
              </div>
              <span className="font-extrabold text-xl text-white tracking-tight">
                Shakib <span className="text-blue-400">Hospital</span>
              </span>
            </div>
            <p className="text-slate-400 leading-relaxed text-xs max-w-sm">
              Shakib Hospital is a comprehensive digital hospital appointment & healthcare management platform designed to connect patients seamlessly with verified medical specialists, advanced multi-specialty clinical departments, and instant diagnostic care.
            </p>
            <div className="flex flex-wrap gap-2 pt-1">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-900 border border-slate-800 text-[11px] text-blue-400 font-medium">
                <ShieldCheck className="w-3.5 h-3.5" /> NABH Verified
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-900 border border-slate-800 text-[11px] text-indigo-400 font-medium">
                <Award className="w-3.5 h-3.5" /> ISO 9001:2015 Certified
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-900 border border-slate-800 text-[11px] text-emerald-400 font-medium">
                <Clock className="w-3.5 h-3.5" /> 24/7 Digital OPD
              </span>
            </div>
          </div>

          {/* Col 2: Quick Links */}
          <div className="space-y-3">
            <h5 className="font-bold text-white text-xs uppercase tracking-wider">Patient Portals</h5>
            <ul className="space-y-2">
              <li>
                <Link to="/doctors" className="hover:text-blue-400 transition-colors">Find Doctors & Slots</Link>
              </li>
              <li>
                <Link to="/hospitals" className="hover:text-blue-400 transition-colors">Hospital Directory</Link>
              </li>
              <li>
                <Link to="/specializations" className="hover:text-blue-400 transition-colors">Clinical Specialties</Link>
              </li>
              <li>
                <Link to="/patient/dashboard" className="hover:text-blue-400 transition-colors">Patient Dashboard</Link>
              </li>
              <li>
                <Link to="/doctor/dashboard" className="hover:text-blue-400 transition-colors">Doctor Consultation Desk</Link>
              </li>
              <li>
                <Link to="/admin/dashboard" className="hover:text-blue-400 transition-colors">Super Admin Portal</Link>
              </li>
            </ul>
          </div>

          {/* Col 3: Popular Specialities */}
          <div className="space-y-3">
            <h5 className="font-bold text-white text-xs uppercase tracking-wider">Top Specialties</h5>
            <ul className="space-y-2">
              <li><Link to="/doctors?specialization=Cardiology" className="hover:text-blue-400 transition-colors">Cardiology (Heart)</Link></li>
              <li><Link to="/doctors?specialization=Dermatology" className="hover:text-blue-400 transition-colors">Dermatology (Skin & Hair)</Link></li>
              <li><Link to="/doctors?specialization=Neurology" className="hover:text-blue-400 transition-colors">Neurology (Brain & Spine)</Link></li>
              <li><Link to="/doctors?specialization=Orthopedics" className="hover:text-blue-400 transition-colors">Orthopedics (Bones & Joints)</Link></li>
              <li><Link to="/doctors?specialization=Pediatrics" className="hover:text-blue-400 transition-colors">Pediatrics (Child Care)</Link></li>
              <li><Link to="/doctors?specialization=Gynecology" className="hover:text-blue-400 transition-colors">Gynecology (Women's Health)</Link></li>
            </ul>
          </div>

          {/* Col 4: Legal & Policies */}
          <div className="space-y-3">
            <h5 className="font-bold text-white text-xs uppercase tracking-wider">Legal & Compliance</h5>
            <ul className="space-y-2">
              <li><Link to="/about" className="hover:text-blue-400 transition-colors">Privacy & Terms</Link></li>
              <li><Link to="/about" className="hover:text-blue-400 transition-colors">Refund & Cancellation</Link></li>
              <li><Link to="/about" className="hover:text-blue-400 transition-colors">Clinical Disclaimer</Link></li>
              <li><Link to="/contact" className="hover:text-blue-400 transition-colors">Grievance & Patient Support</Link></li>
            </ul>
          </div>
        </div>

        {/* Bottom Attribution */}
        <div className="mt-12 pt-6 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-slate-500">
          <p>© {new Date().getFullYear()} Shakib Hospital & Healthcare Management System. All rights reserved.</p>
          <div className="flex items-center gap-2 text-slate-400">
            <Sparkles className="w-3.5 h-3.5 text-blue-400" />
            <span>Super Speciality Hospital & OPD Care Network</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
