import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import {
  Search,
  MapPin,
  Stethoscope,
  HeartPulse,
  Calendar,
  ShieldCheck,
  Star,
  Clock,
  ArrowRight,
  Sparkles,
  Bot,
  Building2,
  Users,
  CheckCircle2,
  Activity,
  PhoneCall,
  ChevronRight,
  Award,
  Zap
} from 'lucide-react';
import { api } from '../services/api.ts';
import { IDoctor, IHospital } from '../types.ts';
import { AISymptomModal } from '../components/common/AISymptomModal.tsx';

export const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState('');
  const [featuredDoctors, setFeaturedDoctors] = useState<IDoctor[]>([]);
  const [topHospitals, setTopHospitals] = useState<IHospital[]>([]);
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [docsRes, hospsRes] = await Promise.all([
          api.getDoctors({ limit: 6, sort: 'rating' }),
          api.getHospitals(),
        ]);
        if (docsRes.success) setFeaturedDoctors(docsRes.doctors);
        if (hospsRes.success) setTopHospitals(hospsRes.hospitals.slice(0, 3));
      } catch (err) {
        console.error('Failed to load home page showcase data:', err);
      } finally {
        setIsLoadingData(false);
      }
    };
    fetchData();
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (searchQuery.trim()) params.append('search', searchQuery.trim());
    if (selectedCity) params.append('city', selectedCity);
    if (selectedSpecialty) params.append('specialization', selectedSpecialty);
    navigate(`/doctors?${params.toString()}`);
  };

  const specialties = [
    { name: 'Cardiology', icon: '❤️', doctors: '18+ Doctors', desc: 'Heart & cardiovascular care', color: 'from-rose-500/10 to-red-500/10 text-rose-600' },
    { name: 'Dermatology', icon: '✨', doctors: '14+ Doctors', desc: 'Skin, hair & cosmetic care', color: 'from-amber-500/10 to-orange-500/10 text-amber-600' },
    { name: 'Neurology', icon: '🧠', doctors: '12+ Doctors', desc: 'Brain, nerves & spine care', color: 'from-purple-500/10 to-indigo-500/10 text-purple-600' },
    { name: 'Orthopedics', icon: '🦴', doctors: '20+ Doctors', desc: 'Joints, bones & fracture care', color: 'from-blue-500/10 to-indigo-500/10 text-blue-600' },
    { name: 'Pediatrics', icon: '👶', doctors: '15+ Doctors', desc: 'Child health & vaccinations', color: 'from-emerald-500/10 to-teal-500/10 text-emerald-600' },
    { name: 'Gynecology', icon: '🌸', doctors: '16+ Doctors', desc: "Women's wellness & maternity", color: 'from-pink-500/10 to-rose-500/10 text-pink-600' },
    { name: 'ENT', icon: '👂', doctors: '11+ Doctors', desc: 'Ear, nose, throat & sinus', color: 'from-sky-500/10 to-blue-500/10 text-sky-600' },
    { name: 'Dentistry', icon: '🦷', doctors: '19+ Doctors', desc: 'Dental surgery & oral care', color: 'from-blue-500/10 to-cyan-500/10 text-blue-600' },
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-slate-950 text-slate-900 dark:text-white">
      {/* 1. HERO SECTION */}
      <section className="relative overflow-hidden bg-gradient-to-b from-blue-50/70 via-white to-slate-50 dark:from-slate-900 dark:via-slate-900 dark:to-slate-950 py-12 sm:py-20 border-b border-slate-200/80 dark:border-slate-800">
        <div className="absolute inset-0 bg-[radial-gradient(#2563eb_1px,transparent_1px)] [background-size:24px_24px] opacity-10 pointer-events-none" />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Hero Content */}
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 text-xs font-bold shadow-sm">
                <Sparkles className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                <span>Next-Generation Digital Hospital Healthcare Platform</span>
              </div>

              <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-slate-900 dark:text-white leading-[1.15]">
                Book Top Doctors & Hospitals <br className="hidden sm:inline" />
                <span className="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 bg-clip-text text-transparent">
                  Instantly in Seconds
                </span>
              </h1>

              <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto lg:mx-0 leading-relaxed font-normal">
                Access 500+ verified medical specialists across premier NABH-accredited hospitals. Check real-time doctor availability, pay securely via Razorpay, and download verified digital receipts.
              </p>

              {/* Main Search Bar Card */}
              <form
                onSubmit={handleSearchSubmit}
                className="bg-white dark:bg-slate-900 p-3 sm:p-4 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 max-w-3xl mx-auto lg:mx-0 space-y-3 sm:space-y-0 sm:flex sm:items-center sm:gap-2"
              >
                {/* Search Term */}
                <div className="flex-1 flex items-center gap-2.5 px-3 py-2 border-b sm:border-b-0 sm:border-r border-slate-200 dark:border-slate-800">
                  <Search className="w-5 h-5 text-blue-600 flex-shrink-0" />
                  <input
                    id="hero-search-input"
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search doctor, disease, or symptom..."
                    className="w-full bg-transparent text-sm text-slate-900 dark:text-white focus:outline-none placeholder:text-slate-400"
                  />
                </div>

                {/* City Dropdown */}
                <div className="flex items-center gap-2 px-3 py-2 border-b sm:border-b-0 sm:border-r border-slate-200 dark:border-slate-800">
                  <MapPin className="w-4 h-4 text-slate-400 flex-shrink-0" />
                  <select
                    id="hero-city-select"
                    value={selectedCity}
                    onChange={(e) => setSelectedCity(e.target.value)}
                    className="bg-transparent text-xs font-semibold text-slate-700 dark:text-slate-300 focus:outline-none cursor-pointer"
                  >
                    <option value="">All Cities</option>
                    <option value="New Delhi">New Delhi</option>
                    <option value="Mumbai">Mumbai</option>
                    <option value="Bengaluru">Bengaluru</option>
                    <option value="Chennai">Chennai</option>
                    <option value="Hyderabad">Hyderabad</option>
                  </select>
                </div>

                {/* Specialty Dropdown */}
                <div className="flex items-center gap-2 px-3 py-2">
                  <Stethoscope className="w-4 h-4 text-slate-400 flex-shrink-0" />
                  <select
                    id="hero-specialty-select"
                    value={selectedSpecialty}
                    onChange={(e) => setSelectedSpecialty(e.target.value)}
                    className="bg-transparent text-xs font-semibold text-slate-700 dark:text-slate-300 focus:outline-none cursor-pointer"
                  >
                    <option value="">All Specialties</option>
                    <option value="Cardiology">Cardiology</option>
                    <option value="Dermatology">Dermatology</option>
                    <option value="Neurology">Neurology</option>
                    <option value="Orthopedics">Orthopedics</option>
                    <option value="Pediatrics">Pediatrics</option>
                    <option value="Gynecology">Gynecology</option>
                    <option value="ENT">ENT</option>
                    <option value="Dentistry">Dentistry</option>
                  </select>
                </div>

                <button
                  id="hero-search-submit-btn"
                  type="submit"
                  className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-lg shadow-blue-600/25 transition-all flex items-center justify-center gap-2"
                >
                  <span>Search</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>

              {/* Fast Tags */}
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-2 pt-1 text-xs text-slate-500 dark:text-slate-400">
                <span className="font-semibold text-slate-700 dark:text-slate-300">Popular Searches:</span>
                {['Cardiologist', 'Skin Specialist', 'Pediatrician', 'Orthopedic', 'Apollo Hospital'].map((tag) => (
                  <button
                    key={tag}
                    onClick={() => {
                      setSearchQuery(tag);
                      navigate(`/doctors?search=${encodeURIComponent(tag)}`);
                    }}
                    className="px-2.5 py-1 rounded-lg bg-slate-200/70 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-blue-50 dark:hover:bg-blue-950/40 hover:text-blue-600 transition-colors"
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>

            {/* Right Hero Visual Showcase */}
            <div className="lg:col-span-5 relative">
              <div className="relative mx-auto max-w-md">
                {/* Main Card Graphic */}
                <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-xl border border-blue-100 dark:border-blue-900">
                        🩺
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900 dark:text-white text-sm">Instant OPD Slot Booking</h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400">Apollo Super Speciality, Delhi</p>
                      </div>
                    </div>
                    <span className="px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-[11px] font-bold">
                      ● Live Available
                    </span>
                  </div>

                  {/* Doctor Snapshot */}
                  <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 flex items-center gap-3">
                    <img
                      src="https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=200"
                      alt="Doctor Preview"
                      className="w-14 h-14 rounded-xl object-cover border border-slate-200 dark:border-slate-700"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-xs text-slate-900 dark:text-white truncate">Dr. Rajesh Sharma</span>
                        <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 flex-shrink-0" />
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">Chief Interventional Cardiologist</p>
                      <div className="flex items-center gap-3 mt-1 text-[11px]">
                        <span className="flex items-center text-amber-500 font-bold">
                          <Star className="w-3 h-3 fill-amber-500 mr-0.5" /> 4.9 (128)
                        </span>
                        <span className="text-slate-400">•</span>
                        <span className="font-bold text-blue-600 dark:text-blue-400">₹800 Fee</span>
                      </div>
                    </div>
                  </div>

                  {/* Slot selector visualizer */}
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
                      Select Available Time Slot (Today)
                    </span>
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      {['10:00 AM', '11:30 AM', '02:00 PM', '03:30 PM', '04:45 PM', '06:00 PM'].map((slot, i) => (
                        <button
                          key={slot}
                          onClick={() => navigate('/doctors')}
                          className={`py-2 rounded-xl text-center font-bold border transition-all ${
                            i === 1
                              ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                              : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-blue-500'
                          }`}
                        >
                          {slot}
                        </button>
                      ))}
                    </div>
                  </div>

                  <Link
                    to="/doctors"
                    className="w-full py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-blue-600/25 transition-all"
                  >
                    <span>Proceed to Confirm Consultation</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>

                {/* Floating Metric Pill 1 */}
                <div className="absolute -top-4 -left-4 bg-white dark:bg-slate-900 rounded-2xl p-3 shadow-xl border border-slate-200 dark:border-slate-800 flex items-center gap-3 animate-float">
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-bold">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900 dark:text-white">100% Verified</p>
                    <p className="text-[10px] text-slate-400">Medical Council Validated</p>
                  </div>
                </div>

                {/* Floating Metric Pill 2 */}
                <div className="absolute -bottom-4 -right-4 bg-white dark:bg-slate-900 rounded-2xl p-3 shadow-xl border border-slate-200 dark:border-slate-800 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center font-bold">
                    <Zap className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900 dark:text-white">Zero Wait Time</p>
                    <p className="text-[10px] text-slate-400">Priority OPD Entry</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. STATS BANNER */}
      <section className="py-8 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div className="p-4">
              <span className="text-2xl sm:text-3xl font-black text-blue-600 dark:text-blue-400">500+</span>
              <p className="text-xs font-bold text-slate-700 dark:text-slate-300 mt-1">Verified Specialists</p>
              <p className="text-[11px] text-slate-400">Across 10+ Medical Depts</p>
            </div>
            <div className="p-4">
              <span className="text-2xl sm:text-3xl font-black text-indigo-600 dark:text-indigo-400">25+</span>
              <p className="text-xs font-bold text-slate-700 dark:text-slate-300 mt-1">Premier Hospitals</p>
              <p className="text-[11px] text-slate-400">NABH & JCI Accredited</p>
            </div>
            <div className="p-4">
              <span className="text-2xl sm:text-3xl font-black text-blue-600 dark:text-blue-400">100,000+</span>
              <p className="text-xs font-bold text-slate-700 dark:text-slate-300 mt-1">Happy Patients</p>
              <p className="text-[11px] text-slate-400">Treated Successfully</p>
            </div>
            <div className="p-4">
              <span className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400">99.4%</span>
              <p className="text-xs font-bold text-slate-700 dark:text-slate-300 mt-1">Satisfaction Rate</p>
              <p className="text-[11px] text-slate-400">Based on Verified Reviews</p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. AI SYMPTOM CHECKER PROMO BANNER */}
      <section className="py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-700 via-blue-800 to-indigo-900 text-white p-6 sm:p-10 shadow-xl border border-blue-600/50">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
              <div className="md:col-span-8 space-y-3">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 text-blue-100 border border-white/20 text-xs font-bold backdrop-blur-sm">
                  <Bot className="w-3.5 h-3.5 text-blue-200" />
                  <span>MediCare AI Medical Assistant</span>
                </div>
                <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                  Unsure which specialist doctor you need to consult?
                </h3>
                <p className="text-sm text-blue-100/90 max-w-xl leading-relaxed">
                  Describe your symptoms in plain words. Our clinical AI triage system will evaluate possible conditions, recommend the exact medical specialty, and show top-rated available doctors.
                </p>
              </div>
              <div className="md:col-span-4 flex md:justify-end">
                <button
                  id="open-ai-checker-cta"
                  onClick={() => setIsAiModalOpen(true)}
                  className="px-6 py-3.5 rounded-2xl bg-white text-blue-900 hover:bg-blue-50 font-extrabold text-sm shadow-xl flex items-center gap-2.5 transition-all hover:scale-105"
                >
                  <Sparkles className="w-4 h-4 text-blue-600" />
                  <span>Check Symptoms with AI</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. POPULAR MEDICAL SPECIALIZATIONS */}
      <section className="py-12 bg-white dark:bg-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 mb-8">
            <div>
              <span className="text-xs uppercase font-extrabold tracking-wider text-blue-600 dark:text-blue-400">
                Clinical Departments
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mt-1">
                Explore by Specialization
              </h2>
            </div>
            <Link
              to="/specializations"
              className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 flex items-center gap-1"
            >
              View All 10+ Departments <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {specialties.map((spec) => (
              <Link
                key={spec.name}
                to={`/doctors?specialization=${encodeURIComponent(spec.name)}`}
                className="group p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 hover:border-blue-400 dark:hover:border-blue-500 transition-all hover:shadow-md"
              >
                <div className="text-3xl mb-3 group-hover:scale-110 transition-transform">{spec.icon}</div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  {spec.name}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{spec.desc}</p>
                <span className="inline-block mt-3 text-[11px] font-bold text-blue-600 dark:text-blue-400">
                  {spec.doctors} →
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* 5. TOP RATED DOCTORS */}
      <section className="py-12 bg-[#F8FAFC] dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 mb-8">
            <div>
              <span className="text-xs uppercase font-extrabold tracking-wider text-blue-600 dark:text-blue-400">
                Verified Medical Experts
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mt-1">
                Top Rated Specialist Doctors
              </h2>
            </div>
            <Link
              to="/doctors"
              className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 flex items-center gap-1"
            >
              Browse All Doctors <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredDoctors.map((doc) => (
              <div
                key={doc._id}
                className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm hover:shadow-lg hover:border-blue-300 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start gap-4 mb-4">
                    <img
                      src={doc.profileImage}
                      alt={doc.name}
                      className="w-16 h-16 rounded-2xl object-cover border border-slate-200 dark:border-slate-700 flex-shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <h3 className="font-bold text-sm text-slate-900 dark:text-white truncate">{doc.name}</h3>
                        <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 flex-shrink-0" />
                      </div>
                      <p className="text-xs font-semibold text-blue-600 dark:text-blue-400">{doc.specialization}</p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{doc.qualification}</p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">{doc.experience} Years Experience</p>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/60 mb-4 text-xs space-y-1">
                    <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300 font-medium truncate">
                      <Building2 className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                      <span className="truncate">{doc.hospitalName}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 text-[11px]">
                      <Clock className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                      <span>{doc.workingHours?.start} - {doc.workingHours?.end} ({doc.availableDays?.slice(0, 3).join(', ')}...)</span>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-1 text-amber-500 font-bold text-xs">
                      <Star className="w-3.5 h-3.5 fill-amber-500" />
                      <span>{doc.rating}</span>
                      <span className="text-slate-400 font-normal text-[10px]">({doc.totalReviews})</span>
                    </div>
                    <span className="text-sm font-black text-slate-900 dark:text-white block">₹{doc.consultationFee}</span>
                  </div>

                  <div className="flex gap-2">
                    <Link
                      to={`/doctors/${doc._id}`}
                      className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-md shadow-blue-600/20"
                    >
                      Book Slot
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 6. HOW IT WORKS */}
      <section className="py-14 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <span className="text-xs uppercase font-extrabold tracking-wider text-blue-600 dark:text-blue-400">
            Streamlined Process
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mt-1 mb-10">
            How MediCare Works in 4 Simple Steps
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                step: '01',
                title: 'Find Doctor or Hospital',
                desc: 'Filter by clinical department, city, consultation fee, or use our smart AI symptom assistant.',
                icon: Search,
              },
              {
                step: '02',
                title: 'Select Live Time Slot',
                desc: 'Pick your preferred date and real-time available OPD consultation slot without double bookings.',
                icon: Calendar,
              },
              {
                step: '03',
                title: 'Secure Online Payment',
                desc: 'Complete payment instantly using Razorpay UPI, Cards, Net Banking, or Wallets with 100% fraud protection.',
                icon: ShieldCheck,
              },
              {
                step: '04',
                title: 'Consult & Get Receipt',
                desc: 'Visit the hospital, receive doctor consultation, and download digital PDF receipts and medical prescriptions.',
                icon: Award,
              },
            ].map((item) => (
              <div
                key={item.step}
                className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 text-left relative overflow-hidden"
              >
                <span className="text-3xl font-black text-slate-200 dark:text-slate-800 absolute top-4 right-4">
                  {item.step}
                </span>
                <div className="w-11 h-11 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-4 border border-blue-100 dark:border-blue-900">
                  <item.icon className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white mb-2">{item.title}</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 7. PREMIER HOSPITALS SHOWCASE */}
      <section className="py-12 bg-[#F8FAFC] dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 mb-8">
            <div>
              <span className="text-xs uppercase font-extrabold tracking-wider text-blue-600 dark:text-blue-400">
                Partner Institutions
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mt-1">
                Premier Multi-Specialty Hospitals
              </h2>
            </div>
            <Link
              to="/hospitals"
              className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 flex items-center gap-1"
            >
              View All Hospitals <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {topHospitals.map((hosp) => (
              <div
                key={hosp._id}
                className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm hover:shadow-lg hover:border-blue-300 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="relative h-44 overflow-hidden">
                    <img
                      src={hosp.image}
                      alt={hosp.name}
                      className="w-full h-full object-cover transition-transform hover:scale-105"
                    />
                    {hosp.emergency24x7 && (
                      <span className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-rose-600 text-white text-[10px] font-bold uppercase tracking-wider shadow-md">
                        24x7 Emergency
                      </span>
                    )}
                  </div>

                  <div className="p-5">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-bold text-base text-slate-900 dark:text-white truncate">{hosp.name}</h3>
                      <div className="flex items-center gap-1 text-amber-500 font-bold text-xs flex-shrink-0">
                        <Star className="w-3.5 h-3.5 fill-amber-500" />
                        <span>{hosp.rating}</span>
                      </div>
                    </div>

                    <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 mb-3">
                      <MapPin className="w-3.5 h-3.5 text-blue-600 flex-shrink-0" />
                      <span className="truncate">{hosp.city}, {hosp.state}</span>
                    </p>

                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {hosp.departments.slice(0, 3).map((d) => (
                        <span key={d} className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-[10px] font-semibold text-slate-600 dark:text-slate-300">
                          {d}
                        </span>
                      ))}
                      {hosp.departments.length > 3 && (
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-[10px] text-slate-500">
                          +{hosp.departments.length - 3} more
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="px-5 pb-5 pt-0">
                  <Link
                    to={`/hospitals/${hosp._id}`}
                    className="w-full py-2.5 rounded-xl border border-blue-600 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <span>View Hospital Details</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* AI Assistant Modal */}
      <AISymptomModal
        isOpen={isAiModalOpen}
        onClose={() => setIsAiModalOpen(false)}
      />
    </div>
  );
};
