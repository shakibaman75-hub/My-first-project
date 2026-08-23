import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Stethoscope,
  Star,
  Clock,
  MapPin,
  Building2,
  CheckCircle2,
  Calendar,
  ShieldCheck,
  Award,
  Phone,
  User,
  ArrowRight,
  Sparkles,
  AlertCircle,
  MessageSquare
} from 'lucide-react';
import { api } from '../services/api.ts';
import { IDoctor, IAppointment, IReview } from '../types.ts';
import { useAuth } from '../context/AuthContext.tsx';
import { useNotifications } from '../context/NotificationContext.tsx';
import { RazorpayModal } from '../components/common/RazorpayModal.tsx';
import { ReceiptModal } from '../components/common/ReceiptModal.tsx';

export const DoctorProfilePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const { showToast } = useNotifications();

  const [doctor, setDoctor] = useState<IDoctor | null>(null);
  const [reviews, setReviews] = useState<IReview[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Booking Flow State
  const [selectedDate, setSelectedDate] = useState(() => {
    const d = new Date(Date.now() + 86400000);
    return d.toISOString().split('T')[0];
  });
  const [slots, setSlots] = useState<{ time: string; isAvailable: boolean }[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<string>('');
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);
  const [slotError, setSlotError] = useState<string | null>(null);

  // Patient Booking Form
  const [patientName, setPatientName] = useState(user?.name || '');
  const [patientEmail, setPatientEmail] = useState(user?.email || '');
  const [patientPhone, setPatientPhone] = useState(user?.phone || '');
  const [patientAge, setPatientAge] = useState(user?.dateOfBirth ? '28' : '26');
  const [patientGender, setPatientGender] = useState(user?.gender || 'Male');
  const [reason, setReason] = useState('');
  const [patientNotes, setPatientNotes] = useState('');
  const [isSubmittingBooking, setIsSubmittingBooking] = useState(false);

  // Modals
  const [activeAppointment, setActiveAppointment] = useState<IAppointment | null>(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);

  // Update default patient info when user loads
  useEffect(() => {
    if (user) {
      setPatientName(user.name);
      setPatientEmail(user.email);
      setPatientPhone(user.phone || '');
      if (user.gender) setPatientGender(user.gender);
    }
  }, [user]);

  useEffect(() => {
    if (!id) return;
    const fetchDoctorDetails = async () => {
      setIsLoading(true);
      try {
        const res = await api.getDoctorById(id);
        if (res.success) {
          setDoctor(res.doctor);
          if (res.doctor.recentReviews) {
            setReviews(res.doctor.recentReviews);
          }
        }
      } catch (err) {
        console.error('Failed to load doctor profile:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchDoctorDetails();
  }, [id]);

  // Load available slots on date change
  useEffect(() => {
    if (!id || !selectedDate) return;

    const fetchSlots = async () => {
      setIsLoadingSlots(true);
      setSlotError(null);
      try {
        const res = await api.getDoctorSlots(id, selectedDate);
        if (res.success && res.available) {
          setSlots(res.slots);
          const firstAvailable = res.slots.find((s) => s.isAvailable);
          setSelectedSlot(firstAvailable ? firstAvailable.time : '');
        } else {
          setSlots([]);
          setSelectedSlot('');
          setSlotError(res.reason || 'Doctor is not available on this date.');
        }
      } catch (err) {
        setSlotError('Error loading available slots.');
      } finally {
        setIsLoadingSlots(false);
      }
    };

    fetchSlots();
  }, [id, selectedDate]);

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      showToast('Authentication Required', 'Please sign in or register to book an appointment.', 'info');
      navigate('/login');
      return;
    }

    if (!selectedSlot) {
      showToast('Slot Selection Required', 'Please select an available consultation time slot.', 'warning');
      return;
    }

    if (!reason.trim()) {
      showToast('Reason Required', 'Please briefly describe the reason for your visit.', 'warning');
      return;
    }

    setIsSubmittingBooking(true);
    try {
      const res = await api.bookAppointment({
        doctorId: doctor!._id,
        appointmentDate: selectedDate,
        appointmentTime: selectedSlot,
        patientName: patientName.trim(),
        patientEmail: patientEmail.trim(),
        patientPhone: patientPhone.trim(),
        patientAge: Number(patientAge),
        patientGender,
        reason: reason.trim(),
        patientNotes: patientNotes.trim(),
      });

      if (res.success && res.appointment) {
        setActiveAppointment(res.appointment);
        setIsPaymentModalOpen(true);
      } else {
        showToast('Booking Failed', res.message || 'Slot could not be booked.', 'error');
      }
    } catch (err: any) {
      showToast('Booking Error', err.message || 'An error occurred while booking.', 'error');
    } finally {
      setIsSubmittingBooking(false);
    }
  };

  const handlePaymentSuccess = (paymentRes: any) => {
    if (paymentRes.appointment) {
      setActiveAppointment(paymentRes.appointment);
    }
    setIsReceiptModalOpen(true);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen py-24 text-center text-slate-500 space-y-3">
        <div className="w-10 h-10 border-4 border-teal-500/30 border-t-teal-600 rounded-full animate-spin mx-auto" />
        <p className="text-xs font-semibold">Loading doctor credentials & schedule...</p>
      </div>
    );
  }

  if (!doctor) {
    return (
      <div className="min-h-screen py-24 text-center space-y-4">
        <p className="text-base font-bold text-slate-900 dark:text-white">Doctor profile not found</p>
        <Link to="/doctors" className="text-xs text-teal-600 font-bold hover:underline">
          ← Back to Doctor Directory
        </Link>
      </div>
    );
  }

  const minDate = new Date(Date.now() + 86400000).toISOString().split('T')[0];

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-slate-950 text-slate-900 dark:text-white py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Breadcrumb Navigation */}
        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
          <Link to="/" className="hover:text-blue-600">Home</Link>
          <span>/</span>
          <Link to="/doctors" className="hover:text-blue-600">Doctors</Link>
          <span>/</span>
          <span className="text-slate-900 dark:text-white font-medium">{doctor.name}</span>
        </div>

        {/* Doctor Header Banner Card */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-sm">
          <div className="flex flex-col md:flex-row gap-6 items-start">
            <img
              src={doctor.profileImage}
              alt={doctor.name}
              className="w-28 h-28 sm:w-36 sm:h-36 rounded-3xl object-cover border border-slate-200 dark:border-slate-700 shadow-md flex-shrink-0"
            />
            <div className="flex-1 space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">{doctor.name}</h1>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 text-xs font-bold border border-blue-200 dark:border-blue-800">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Verified Specialist
                </span>
              </div>

              <p className="text-sm sm:text-base font-semibold text-blue-600 dark:text-blue-400">
                {doctor.specialization} • <span className="text-slate-500 dark:text-slate-400">{doctor.qualification}</span>
              </p>

              <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600 dark:text-slate-300 pt-1">
                <span className="flex items-center gap-1 font-bold text-amber-500">
                  <Star className="w-4 h-4 fill-amber-500" /> {doctor.rating} ({doctor.totalReviews} verified reviews)
                </span>
                <span>•</span>
                <span>{doctor.experience} Years Clinical Experience</span>
                <span>•</span>
                <span>Reg #: {doctor.registrationNumber}</span>
              </div>

              <div className="flex flex-wrap gap-2 pt-2">
                <span className="px-3 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-blue-600" /> {doctor.hospitalName}
                </span>
                <span className="px-3 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-medium text-slate-700 dark:text-slate-300">
                  🗣️ {doctor.languages?.join(', ')}
                </span>
              </div>
            </div>

            {/* Consultation Fee Box */}
            <div className="w-full md:w-auto p-4 rounded-2xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 text-left md:text-right flex-shrink-0">
              <span className="text-xs text-blue-800 dark:text-blue-300 uppercase font-bold tracking-wider block">OPD Consultation Fee</span>
              <span className="text-2xl sm:text-3xl font-black text-blue-950 dark:text-blue-100">₹{doctor.consultationFee}</span>
              <span className="text-[11px] text-blue-700 dark:text-blue-400 block mt-0.5">Includes Digital Record & Prescription</span>
            </div>
          </div>
        </div>

        {/* Main Content Layout (Left: Biography & Reviews, Right: Booking Widget) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: Doctor Biography & Reviews */}
          <div className="lg:col-span-7 space-y-6">
            {/* About Doctor */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-7 shadow-sm space-y-4">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Stethoscope className="w-5 h-5 text-blue-600" /> Clinical Profile & Experience
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                {doctor.about}
              </p>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 grid grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block text-[10px]">
                    Consultation Hours
                  </span>
                  <span className="font-semibold text-slate-900 dark:text-white">
                    {doctor.workingHours?.start} - {doctor.workingHours?.end}
                  </span>
                </div>
                <div>
                  <span className="font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block text-[10px]">
                    Practicing Days
                  </span>
                  <span className="font-semibold text-slate-900 dark:text-white">
                    {doctor.availableDays?.join(', ')}
                  </span>
                </div>
              </div>
            </div>

            {/* Hospital Affiliation Info */}
            {doctor.hospital && (
              <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-7 shadow-sm space-y-3">
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-blue-600" /> Hospital Consultation Facility
                </h3>
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 space-y-2 text-xs">
                  <div className="flex justify-between items-center">
                    <p className="font-bold text-sm text-slate-900 dark:text-white">{doctor.hospital.name}</p>
                    {doctor.hospital.emergency24x7 && (
                      <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 text-[10px] font-bold">
                        24x7 Emergency OPD
                      </span>
                    )}
                  </div>
                  <p className="text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                    <span>{doctor.hospital.address}, {doctor.hospital.city}</span>
                  </p>
                  <Link
                    to={`/hospitals/${doctor.hospital._id}`}
                    className="inline-block pt-1 text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    View Hospital Facilities & Bed Capacities →
                  </Link>
                </div>
              </div>
            )}

            {/* Verified Patient Reviews */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-7 shadow-sm space-y-5">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-blue-600" /> Verified Patient Reviews
                </h3>
                <span className="text-xs font-bold text-amber-500 flex items-center gap-1">
                  <Star className="w-4 h-4 fill-amber-500" /> {doctor.rating} / 5.0
                </span>
              </div>

              {reviews.length === 0 ? (
                <p className="text-xs text-slate-500 py-4">No reviews submitted yet. Completed patients can rate this specialist.</p>
              ) : (
                <div className="space-y-3.5">
                  {reviews.map((rev) => (
                    <div
                      key={rev._id}
                      className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/60 space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs">
                            {rev.patientName[0]}
                          </div>
                          <div>
                            <p className="text-xs font-bold text-slate-900 dark:text-white">{rev.patientName}</p>
                            <p className="text-[10px] text-slate-400">
                              {new Date(rev.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-0.5">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Star
                              key={s}
                              className={`w-3.5 h-3.5 ${
                                s <= rev.rating ? 'text-amber-400 fill-amber-400' : 'text-slate-300 dark:text-slate-700'
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed italic">
                        "{rev.comment}"
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Step-by-Step Booking Widget */}
          <div className="lg:col-span-5">
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-7 shadow-xl sticky top-24 space-y-5">
              <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-blue-600" /> Book Consultation Slot
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Select your date and convenient OPD time slot
                </p>
              </div>

              <form onSubmit={handleBookingSubmit} className="space-y-4">
                {/* 1. Date Selection */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                    1. Select Consultation Date: *
                  </label>
                  <input
                    id="booking-date-input"
                    type="date"
                    min={minDate}
                    required
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-medium focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* 2. Slot Selection */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                    2. Select Available Slot: *
                  </label>
                  {isLoadingSlots ? (
                    <div className="py-6 text-center text-xs text-slate-500">Checking doctor's live calendar...</div>
                  ) : slots.length === 0 ? (
                    <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 text-xs border border-amber-200 dark:border-amber-900">
                      {slotError || 'No slots available on this date. Doctor may not practice on this day.'}
                    </div>
                  ) : (
                    <div className="grid grid-cols-3 gap-2 max-h-44 overflow-y-auto p-1">
                      {slots.map((slot) => (
                        <button
                          key={slot.time}
                          type="button"
                          disabled={!slot.isAvailable}
                          onClick={() => setSelectedSlot(slot.time)}
                          className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                            !slot.isAvailable
                              ? 'opacity-40 cursor-not-allowed bg-slate-100 dark:bg-slate-800 text-slate-400 border-slate-200 dark:border-slate-700'
                              : selectedSlot === slot.time
                              ? 'bg-blue-600 text-white border-blue-600 shadow-md ring-2 ring-blue-500/20'
                              : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-blue-500'
                          }`}
                        >
                          {slot.time}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* 3. Patient Details Form */}
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-3">
                  <span className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    3. Patient Details:
                  </span>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Patient Full Name: *
                    </label>
                    <input
                      id="patient-name-input"
                      type="text"
                      required
                      value={patientName}
                      onChange={(e) => setPatientName(e.target.value)}
                      placeholder="e.g. Aman Sharma"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Age: *
                      </label>
                      <input
                        id="patient-age-input"
                        type="number"
                        min="1"
                        max="120"
                        required
                        value={patientAge}
                        onChange={(e) => setPatientAge(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Gender: *
                      </label>
                      <select
                        id="patient-gender-select"
                        value={patientGender}
                        onChange={(e) => setPatientGender(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs"
                      >
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Phone Number: *
                      </label>
                      <input
                        id="patient-phone-input"
                        type="tel"
                        required
                        value={patientPhone}
                        onChange={(e) => setPatientPhone(e.target.value)}
                        placeholder="+91 98765 43210"
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Email: *
                      </label>
                      <input
                        id="patient-email-input"
                        type="email"
                        required
                        value={patientEmail}
                        onChange={(e) => setPatientEmail(e.target.value)}
                        placeholder="patient@example.com"
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Reason for Consultation / Symptoms: *
                    </label>
                    <textarea
                      id="patient-reason-input"
                      rows={2}
                      required
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      placeholder="e.g. Chronic chest tightness, routine follow up, fever..."
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs"
                    />
                  </div>
                </div>

                {/* 4. Payment Fee Summary */}
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-slate-500 dark:text-slate-400">Doctor Consultation:</span>
                    <span className="font-semibold text-slate-900 dark:text-white">₹{doctor.consultationFee}.00</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 dark:text-slate-400">Hospital Platform Fee:</span>
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400">₹0.00 (FREE)</span>
                  </div>
                  <div className="pt-1.5 border-t border-slate-200 dark:border-slate-700 flex justify-between items-center font-bold text-sm">
                    <span className="text-slate-900 dark:text-white">Total Payable:</span>
                    <span className="text-blue-600 dark:text-blue-400 text-base">₹{doctor.consultationFee}.00</span>
                  </div>
                </div>

                {/* Submit Booking Button */}
                <button
                  id="doctor-book-slot-submit-btn"
                  type="submit"
                  disabled={isSubmittingBooking || !selectedSlot}
                  className="w-full py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-black shadow-lg shadow-blue-600/25 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                >
                  {isSubmittingBooking ? (
                    'Processing Booking...'
                  ) : (
                    <>
                      <span>Proceed to Razorpay Payment</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* Razorpay Modal */}
      {activeAppointment && (
        <RazorpayModal
          isOpen={isPaymentModalOpen}
          onClose={() => setIsPaymentModalOpen(false)}
          appointment={activeAppointment}
          onSuccess={handlePaymentSuccess}
        />
      )}

      {/* Receipt Modal */}
      {activeAppointment && (
        <ReceiptModal
          isOpen={isReceiptModalOpen}
          onClose={() => {
            setIsReceiptModalOpen(false);
            navigate('/patient/dashboard?tab=appointments');
          }}
          appointment={activeAppointment}
          doctorData={doctor}
          hospitalData={doctor.hospital}
        />
      )}
    </div>
  );
};
