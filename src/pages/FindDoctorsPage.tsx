import React, { useState, useEffect, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  Search,
  Filter,
  MapPin,
  Stethoscope,
  Star,
  Clock,
  ShieldCheck,
  CheckCircle2,
  SlidersHorizontal,
  X,
  Building2,
  Calendar,
  Sparkles,
  ArrowUpDown
} from 'lucide-react';
import { api } from '../services/api.ts';
import { IDoctor } from '../types.ts';

export const FindDoctorsPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [doctors, setDoctors] = useState<IDoctor[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters State from URL query or defaults
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [specialization, setSpecialization] = useState(searchParams.get('specialization') || 'All');
  const [city, setCity] = useState(searchParams.get('city') || 'All');
  const [minExperience, setMinExperience] = useState<number>(0);
  const [maxFee, setMaxFee] = useState<number>(2500);
  const [selectedDay, setSelectedDay] = useState<string>('All');
  const [sortBy, setSortBy] = useState<string>('rating');
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  useEffect(() => {
    const fetchDoctors = async () => {
      setIsLoading(true);
      try {
        const res = await api.getDoctors({
          search: search || undefined,
          specialization: specialization !== 'All' ? specialization : undefined,
          city: city !== 'All' ? city : undefined,
          maxFee,
          sort: sortBy,
        } as any);

        if (res.success) {
          setDoctors(res.doctors);
        }
      } catch (err) {
        console.error('Failed to load doctors:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDoctors();
  }, [search, specialization, city, maxFee, sortBy]);

  // Client-side additional filters for experience & specific day
  const filteredDoctors = useMemo(() => {
    return doctors.filter((doc) => {
      if (minExperience > 0 && doc.experience < minExperience) return false;
      if (selectedDay !== 'All' && !doc.availableDays.includes(selectedDay)) return false;
      return true;
    });
  }, [doctors, minExperience, selectedDay]);

  const handleResetFilters = () => {
    setSearch('');
    setSpecialization('All');
    setCity('All');
    setMinExperience(0);
    setMaxFee(2500);
    setSelectedDay('All');
    setSortBy('rating');
    setSearchParams({});
  };

  const specializationsList = [
    'All',
    'Cardiology',
    'Dermatology',
    'Neurology',
    'Orthopedics',
    'Pediatrics',
    'Gynecology',
    'ENT',
    'Dentistry',
    'General Medicine',
    'Emergency',
  ];

  const citiesList = ['All', 'New Delhi', 'Mumbai', 'Bengaluru', 'Chennai', 'Hyderabad'];
  const daysList = ['All', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-slate-950 text-slate-900 dark:text-white py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white">
              Find & Book Specialist Doctors
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
              Browse verified doctors, check live hospital OPD slots, and book your medical consultation.
            </p>
          </div>

          {/* Quick Sort & Mobile Filter Trigger */}
          <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end">
            <button
              id="mobile-filter-open-btn"
              onClick={() => setMobileFilterOpen(true)}
              className="lg:hidden flex items-center gap-2 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-700 dark:text-slate-300"
            >
              <SlidersHorizontal className="w-4 h-4 text-blue-600" />
              <span>Filters</span>
            </button>

            <div className="flex items-center gap-2">
              <ArrowUpDown className="w-4 h-4 text-slate-400" />
              <select
                id="doctor-sort-select"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-700 dark:text-slate-300 focus:ring-2 focus:ring-blue-500"
              >
                <option value="rating">Highest Rated</option>
                <option value="experience">Most Experienced</option>
                <option value="fee_asc">Fee: Low to High</option>
                <option value="fee_desc">Fee: High to Low</option>
              </select>
            </div>
          </div>
        </div>

        {/* Main Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Filters Sidebar (Desktop) */}
          <aside className="hidden lg:block lg:col-span-3 space-y-6">
            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-5 sticky top-24">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                  <Filter className="w-4 h-4 text-blue-600" /> Filters
                </h3>
                <button
                  id="reset-filters-btn"
                  onClick={handleResetFilters}
                  className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-semibold"
                >
                  Reset All
                </button>
              </div>

              {/* Keyword Search */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                  Search Doctor / Disease
                </label>
                <div className="relative">
                  <input
                    id="filter-search-input"
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="e.g. Cardiologist or Sharma"
                    className="w-full pl-8 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                  />
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                </div>
              </div>

              {/* Specialization */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                  Specialization
                </label>
                <select
                  id="filter-specialization-select"
                  value={specialization}
                  onChange={(e) => setSpecialization(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-medium text-slate-900 dark:text-white"
                >
                  {specializationsList.map((spec) => (
                    <option key={spec} value={spec}>
                      {spec}
                    </option>
                  ))}
                </select>
              </div>

              {/* City */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                  City Location
                </label>
                <select
                  id="filter-city-select"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-medium text-slate-900 dark:text-white"
                >
                  {citiesList.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              {/* Max Consultation Fee Slider */}
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Max Fee
                  </label>
                  <span className="text-xs font-bold text-blue-600 dark:text-blue-400">
                    Up to ₹{maxFee}
                  </span>
                </div>
                <input
                  id="filter-fee-range"
                  type="range"
                  min="300"
                  max="2500"
                  step="100"
                  value={maxFee}
                  onChange={(e) => setMaxFee(Number(e.target.value))}
                  className="w-full accent-blue-600 cursor-pointer"
                />
              </div>

              {/* Minimum Experience */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                  Experience
                </label>
                <div className="grid grid-cols-3 gap-1.5 text-xs">
                  {[
                    { label: 'Any', val: 0 },
                    { label: '5+ Yrs', val: 5 },
                    { label: '10+ Yrs', val: 10 },
                  ].map((exp) => (
                    <button
                      key={exp.val}
                      type="button"
                      onClick={() => setMinExperience(exp.val)}
                      className={`py-1.5 rounded-lg border font-semibold text-center transition-all ${
                        minExperience === exp.val
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      {exp.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Available Day */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                  Available Day
                </label>
                <select
                  id="filter-day-select"
                  value={selectedDay}
                  onChange={(e) => setSelectedDay(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-medium text-slate-900 dark:text-white"
                >
                  {daysList.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </aside>

          {/* Doctor Cards Listing Area */}
          <main className="lg:col-span-9 space-y-4">
            {/* Active Filters Bar */}
            <div className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs">
              <span className="text-slate-500 dark:text-slate-400 font-medium">
                Showing <strong className="text-slate-900 dark:text-white">{filteredDoctors.length}</strong> available verified doctors
              </span>

              {(specialization !== 'All' || city !== 'All' || search || minExperience > 0) && (
                <div className="flex flex-wrap gap-1.5 items-center">
                  {specialization !== 'All' && (
                    <span className="px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 flex items-center gap-1">
                      {specialization}
                      <X className="w-3 h-3 cursor-pointer" onClick={() => setSpecialization('All')} />
                    </span>
                  )}
                  {city !== 'All' && (
                    <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center gap-1">
                      {city}
                      <X className="w-3 h-3 cursor-pointer" onClick={() => setCity('All')} />
                    </span>
                  )}
                  {search && (
                    <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center gap-1">
                      "{search}"
                      <X className="w-3 h-3 cursor-pointer" onClick={() => setSearch('')} />
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Doctors List */}
            {isLoading ? (
              <div className="py-16 text-center text-slate-500 space-y-2">
                <div className="w-8 h-8 border-4 border-blue-500/30 border-t-blue-600 rounded-full animate-spin mx-auto" />
                <p className="text-xs font-semibold">Searching verified medical database...</p>
              </div>
            ) : filteredDoctors.length === 0 ? (
              <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
                <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto text-slate-400">
                  <Stethoscope className="w-8 h-8" />
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">No doctors match your current criteria</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Try broadening your search term, clearing location filters, or increasing the max fee range.
                </p>
                <button
                  onClick={handleResetFilters}
                  className="px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold"
                >
                  Reset All Filters
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredDoctors.map((doc) => (
                  <div
                    key={doc._id}
                    className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm hover:shadow-md hover:border-blue-300 transition-all flex flex-col sm:flex-row justify-between gap-5"
                  >
                    {/* Left: Avatar & Basic Info */}
                    <div className="flex items-start gap-4">
                      <img
                        src={doc.profileImage}
                        alt={doc.name}
                        className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl object-cover border border-slate-200 dark:border-slate-700 flex-shrink-0"
                      />
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <Link
                            to={`/doctors/${doc._id}`}
                            className="font-bold text-base sm:text-lg text-slate-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors truncate"
                          >
                            {doc.name}
                          </Link>
                          <CheckCircle2 className="w-4 h-4 text-blue-600 flex-shrink-0" title="Verified Medical License" />
                        </div>

                        <p className="text-xs font-semibold text-blue-600 dark:text-blue-400">
                          {doc.specialization} • <span className="text-slate-500 dark:text-slate-400">{doc.qualification}</span>
                        </p>

                        <p className="text-xs text-slate-600 dark:text-slate-300 flex items-center gap-1.5 pt-1">
                          <Building2 className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                          <span className="font-medium truncate">{doc.hospitalName}</span>
                        </p>

                        <div className="flex flex-wrap items-center gap-3 pt-1 text-xs text-slate-500 dark:text-slate-400">
                          <span>{doc.experience} Yrs Experience</span>
                          <span>•</span>
                          <span>Reg: {doc.registrationNumber}</span>
                          <span>•</span>
                          <span>{doc.languages?.join(', ')}</span>
                        </div>

                        <div className="pt-2 flex items-center gap-2 text-[11px] text-slate-500">
                          <Clock className="w-3.5 h-3.5 text-blue-600 flex-shrink-0" />
                          <span>OPD Hours: {doc.workingHours?.start} - {doc.workingHours?.end} ({doc.availableDays?.slice(0, 4).join(', ')}...)</span>
                        </div>
                      </div>
                    </div>

                    {/* Right: Fees, Rating & Actions */}
                    <div className="sm:border-l sm:border-slate-100 sm:dark:border-slate-800 sm:pl-5 flex flex-row sm:flex-col justify-between items-end sm:items-end gap-3 flex-shrink-0">
                      <div className="text-left sm:text-right">
                        <div className="flex items-center gap-1 text-amber-500 font-bold text-xs justify-start sm:justify-end">
                          <Star className="w-3.5 h-3.5 fill-amber-500" />
                          <span>{doc.rating}</span>
                          <span className="text-slate-400 font-normal text-[11px]">({doc.totalReviews} reviews)</span>
                        </div>
                        <p className="text-lg font-black text-slate-900 dark:text-white mt-0.5">
                          ₹{doc.consultationFee}
                          <span className="text-[10px] text-slate-400 font-normal block">Consultation Fee</span>
                        </p>
                      </div>

                      <div className="flex sm:flex-col gap-2 w-full sm:w-auto">
                        <Link
                          to={`/doctors/${doc._id}`}
                          className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold text-center shadow-md shadow-blue-600/20 transition-all flex items-center justify-center gap-1.5"
                        >
                          <Calendar className="w-3.5 h-3.5" /> Book Slot
                        </Link>
                        <Link
                          to={`/doctors/${doc._id}`}
                          className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold text-center transition-colors"
                        >
                          View Profile
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
};
