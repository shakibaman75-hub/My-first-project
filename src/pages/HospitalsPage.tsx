import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Building2,
  MapPin,
  Star,
  Search,
  PhoneCall,
  ShieldCheck,
  Award,
  ArrowRight,
  Stethoscope,
  Bed,
  Sparkles
} from 'lucide-react';
import { api } from '../services/api.ts';
import { IHospital } from '../types.ts';

export const HospitalsPage: React.FC = () => {
  const [hospitals, setHospitals] = useState<IHospital[]>([]);
  const [search, setSearch] = useState('');
  const [city, setCity] = useState('All');
  const [department, setDepartment] = useState('All');
  const [emergencyOnly, setEmergencyOnly] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchHospitals = async () => {
      setIsLoading(true);
      try {
        const res = await api.getHospitals({
          search: search || undefined,
          city: city !== 'All' ? city : undefined,
          department: department !== 'All' ? department : undefined,
        } as any);

        if (res.success) {
          let list = res.hospitals;
          if (emergencyOnly) {
            list = list.filter((h) => h.emergency24x7);
          }
          setHospitals(list);
        }
      } catch (err) {
        console.error('Failed to load hospitals:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchHospitals();
  }, [search, city, department, emergencyOnly]);

  const citiesList = ['All', 'New Delhi', 'Mumbai', 'Bengaluru', 'Chennai', 'Hyderabad'];
  const departmentsList = [
    'All',
    'Cardiology',
    'Dermatology',
    'Neurology',
    'Orthopedics',
    'Pediatrics',
    'Gynecology',
    'ENT',
    'Emergency & Trauma',
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-slate-950 text-slate-900 dark:text-white py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white">
              Partner Hospitals & Medical Centers
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
              Find NABH-accredited multi-specialty hospitals, view clinical facilities, and explore affiliated specialist doctors.
            </p>
          </div>
        </div>

        {/* Search & Filter Strip */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 items-center">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              id="hospital-search-input"
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search hospital name..."
              className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <select
              id="hospital-city-select"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-medium text-slate-900 dark:text-white"
            >
              {citiesList.map((c) => (
                <option key={c} value={c}>City: {c}</option>
              ))}
            </select>
          </div>

          <div>
            <select
              id="hospital-department-select"
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-medium text-slate-900 dark:text-white"
            >
              {departmentsList.map((d) => (
                <option key={d} value={d}>Department: {d}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2 px-2">
            <input
              id="emergency-checkbox"
              type="checkbox"
              checked={emergencyOnly}
              onChange={(e) => setEmergencyOnly(e.target.checked)}
              className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4"
            />
            <label htmlFor="emergency-checkbox" className="text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
              24x7 Emergency Only
            </label>
          </div>
        </div>

        {/* Hospitals Grid */}
        {isLoading ? (
          <div className="py-16 text-center text-slate-500 space-y-2">
            <div className="w-8 h-8 border-4 border-blue-500/30 border-t-blue-600 rounded-full animate-spin mx-auto" />
            <p className="text-xs font-semibold">Loading hospitals directory...</p>
          </div>
        ) : hospitals.length === 0 ? (
          <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
            <Building2 className="w-12 h-12 text-slate-400 mx-auto" />
            <p className="text-sm font-bold text-slate-900 dark:text-white">No hospitals match your search</p>
            <p className="text-xs text-slate-500">Try changing the city or department filter.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {hospitals.map((hosp) => (
              <div
                key={hosp._id}
                className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm hover:shadow-xl hover:border-blue-300 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="relative h-48 overflow-hidden">
                    <img
                      src={hosp.image}
                      alt={hosp.name}
                      className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                    />
                    {hosp.emergency24x7 && (
                      <span className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-rose-600 text-white text-[10px] font-bold uppercase tracking-wider shadow-md">
                        24x7 Emergency OPD
                      </span>
                    )}
                    <span className="absolute bottom-3 left-3 px-2.5 py-1 rounded-full bg-slate-900/80 backdrop-blur-md text-white text-[10px] font-semibold flex items-center gap-1">
                      <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                      <span>{hosp.rating} ({hosp.totalReviews} reviews)</span>
                    </span>
                  </div>

                  <div className="p-5 space-y-3">
                    <h3 className="font-bold text-base sm:text-lg text-slate-900 dark:text-white truncate">
                      {hosp.name}
                    </h3>

                    <p className="text-xs text-slate-500 dark:text-slate-400 flex items-start gap-1.5 line-clamp-2">
                      <MapPin className="w-3.5 h-3.5 text-blue-600 flex-shrink-0 mt-0.5" />
                      <span>{hosp.address}, {hosp.city}, {hosp.state} - {hosp.pincode}</span>
                    </p>

                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-600 dark:text-slate-300">
                      <span className="flex items-center gap-1">
                        <Bed className="w-3.5 h-3.5 text-blue-600" />
                        <span>{hosp.totalBeds || 450}+ Beds</span>
                      </span>
                      <span className="flex items-center gap-1">
                        <Stethoscope className="w-3.5 h-3.5 text-blue-600" />
                        <span>{hosp.doctorCount || hosp.departments.length * 4}+ Doctors</span>
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block mb-1">
                        Top Departments:
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {hosp.departments.slice(0, 3).map((d) => (
                          <span
                            key={d}
                            className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-[10px] font-medium text-slate-700 dark:text-slate-300"
                          >
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
                </div>

                <div className="p-5 pt-0">
                  <Link
                    to={`/hospitals/${hosp._id}`}
                    className="w-full py-2.5 rounded-2xl bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-600 hover:text-white dark:hover:bg-blue-600 text-blue-700 dark:text-blue-300 text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-sm"
                  >
                    <span>View Doctors & Facilities</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
