import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Building2,
  MapPin,
  PhoneCall,
  Mail,
  Star,
  ShieldCheck,
  Award,
  Bed,
  Stethoscope,
  Clock,
  CheckCircle2,
  Calendar,
  ArrowRight
} from 'lucide-react';
import { api } from '../services/api.ts';
import { IHospital, IDoctor } from '../types.ts';

export const HospitalDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [hospital, setHospital] = useState<(IHospital & { doctors: IDoctor[] }) | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    const fetchHospital = async () => {
      setIsLoading(true);
      try {
        const res = await api.getHospitalById(id);
        if (res.success) {
          setHospital(res.hospital);
        }
      } catch (err) {
        console.error('Failed to load hospital details:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchHospital();
  }, [id]);

  if (isLoading) {
    return (
      <div className="min-h-screen py-24 text-center text-slate-500 space-y-3">
        <div className="w-10 h-10 border-4 border-blue-500/30 border-t-blue-600 rounded-full animate-spin mx-auto" />
        <p className="text-xs font-semibold">Loading hospital facilities & clinical rosters...</p>
      </div>
    );
  }

  if (!hospital) {
    return (
      <div className="min-h-screen py-24 text-center space-y-4">
        <p className="text-base font-bold text-slate-900 dark:text-white">Hospital details not found</p>
        <Link to="/hospitals" className="text-xs text-blue-600 font-bold hover:underline">
          ← Back to Hospitals Directory
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-slate-950 text-slate-900 dark:text-white py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
          <Link to="/" className="hover:text-blue-600">Home</Link>
          <span>/</span>
          <Link to="/hospitals" className="hover:text-blue-600">Hospitals</Link>
          <span>/</span>
          <span className="text-slate-900 dark:text-white font-medium">{hospital.name}</span>
        </div>

        {/* Hospital Hero Banner */}
        <div className="relative rounded-3xl overflow-hidden shadow-xl border border-slate-200 dark:border-slate-800 bg-slate-900 text-white min-h-[280px] flex items-end">
          <img
            src={hospital.image}
            alt={hospital.name}
            className="absolute inset-0 w-full h-full object-cover opacity-35"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/60 to-transparent" />

          <div className="relative p-6 sm:p-10 w-full flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
            <div className="space-y-2">
              <div className="flex flex-wrap gap-2">
                <span className="px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30 text-xs font-bold flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5" /> NABH & JCI Accredited
                </span>
                {hospital.emergency24x7 && (
                  <span className="px-3 py-1 rounded-full bg-rose-600 text-white text-xs font-bold uppercase tracking-wider">
                    24x7 Critical Emergency OPD
                  </span>
                )}
              </div>

              <h1 className="text-2xl sm:text-4xl font-black tracking-tight">{hospital.name}</h1>
              
              <p className="text-xs sm:text-sm text-slate-300 flex items-center gap-1.5 max-w-2xl">
                <MapPin className="w-4 h-4 text-blue-400 flex-shrink-0" />
                <span>{hospital.address}, {hospital.city}, {hospital.state} - {hospital.pincode}</span>
              </p>
            </div>

            {/* Quick Contact Box */}
            <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 text-xs space-y-2 flex-shrink-0">
              <div className="flex items-center gap-2">
                <PhoneCall className="w-4 h-4 text-rose-400" />
                <span>Emergency: <strong>{hospital.contact.emergency}</strong></span>
              </div>
              <div className="flex items-center gap-2">
                <PhoneCall className="w-4 h-4 text-blue-300" />
                <span>Reception: {hospital.contact.phone}</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-indigo-300" />
                <span>{hospital.contact.email}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Content Tabs & Details */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: Hospital Overview & Facilities */}
          <div className="lg:col-span-7 space-y-6">
            {/* Overview */}
            <div className="p-6 sm:p-7 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">About the Hospital</h2>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                {hospital.description}
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-4 border-t border-slate-100 dark:border-slate-800 text-xs">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Total Inpatient Beds</span>
                  <span className="font-bold text-slate-900 dark:text-white text-sm">{hospital.totalBeds || 450}+ Beds</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Specialist Doctors</span>
                  <span className="font-bold text-slate-900 dark:text-white text-sm">{hospital.doctors?.length || 15}+ Affiliated</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Patient Rating</span>
                  <span className="font-bold text-amber-500 text-sm flex items-center gap-1">
                    <Star className="w-3.5 h-3.5 fill-amber-500" /> {hospital.rating} ({hospital.totalReviews})
                  </span>
                </div>
              </div>
            </div>

            {/* Clinical Departments */}
            <div className="p-6 sm:p-7 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Clinical Departments & Centers of Excellence</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-1">
                {hospital.departments.map((dept) => (
                  <div
                    key={dept}
                    className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 text-xs font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2"
                  >
                    <Stethoscope className="w-3.5 h-3.5 text-blue-600 flex-shrink-0" />
                    <span className="truncate">{dept}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Diagnostic & Support Facilities */}
            <div className="p-6 sm:p-7 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Advanced Medical & Diagnostic Facilities</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                {hospital.facilities.map((fac) => (
                  <div
                    key={fac}
                    className="p-3 rounded-2xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/40 text-xs font-medium text-blue-950 dark:text-blue-200 flex items-center gap-2"
                  >
                    <CheckCircle2 className="w-4 h-4 text-blue-600 flex-shrink-0" />
                    <span>{fac}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Affiliated Doctors List */}
          <div className="lg:col-span-5 space-y-6">
            <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Stethoscope className="w-5 h-5 text-blue-600" /> Doctors at this Hospital
                </h3>
                <span className="text-xs text-slate-500 font-semibold">{hospital.doctors?.length || 0} Available</span>
              </div>

              {hospital.doctors && hospital.doctors.length > 0 ? (
                <div className="space-y-3">
                  {hospital.doctors.map((doc) => (
                    <div
                      key={doc._id}
                      className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 flex items-center justify-between gap-3 shadow-sm hover:border-blue-500 transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <img
                          src={doc.profileImage}
                          alt={doc.name}
                          className="w-12 h-12 rounded-xl object-cover border border-slate-200 dark:border-slate-700 flex-shrink-0"
                        />
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{doc.name}</p>
                          <p className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 truncate">{doc.specialization}</p>
                          <div className="flex items-center gap-2 mt-0.5 text-[10px] text-slate-500">
                            <span>₹{doc.consultationFee} Fee</span>
                            <span>•</span>
                            <span className="text-amber-500 font-bold">★ {doc.rating}</span>
                          </div>
                        </div>
                      </div>

                      <Link
                        to={`/doctors/${doc._id}`}
                        className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex-shrink-0 shadow-sm"
                      >
                        Book Slot
                      </Link>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-500 py-4 text-center">No doctors currently listed for this hospital.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
