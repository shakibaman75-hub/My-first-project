import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  Calendar,
  Clock,
  User,
  FileText,
  CreditCard,
  Download,
  Star,
  RotateCcw,
  XCircle,
  AlertCircle,
  CheckCircle2,
  Stethoscope,
  Building2,
  Bell,
  Sparkles,
  Phone,
  ShieldCheck,
  FileDown
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';
import { useNotifications } from '../context/NotificationContext.tsx';
import { api } from '../services/api.ts';
import { IAppointment, IUser } from '../types.ts';
import { ReceiptModal } from '../components/common/ReceiptModal.tsx';
import { RazorpayModal } from '../components/common/RazorpayModal.tsx';
import { RescheduleModal } from '../components/common/RescheduleModal.tsx';
import { ReviewDoctorModal } from '../components/common/ReviewDoctorModal.tsx';

export const PatientDashboard: React.FC = () => {
  const { user, updateUser } = useAuth();
  const { showToast } = useNotifications();
  const [searchParams, setSearchParams] = useSearchParams();

  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'appointments');
  const [appointments, setAppointments] = useState<IAppointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modals state
  const [selectedAppointment, setSelectedAppointment] = useState<IAppointment | null>(null);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);
  const [isPayOpen, setIsPayOpen] = useState(false);
  const [isRescheduleOpen, setIsRescheduleOpen] = useState(false);
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [cancelModalAppointment, setCancelModalAppointment] = useState<IAppointment | null>(null);
  const [cancelReason, setCancelReason] = useState('');

  // Profile Form state
  const [profileName, setProfileName] = useState(user?.name || '');
  const [profilePhone, setProfilePhone] = useState(user?.phone || '');
  const [profileBloodGroup, setProfileBloodGroup] = useState(user?.bloodGroup || 'O+');
  const [profileEmergencyContact, setProfileEmergencyContact] = useState(user?.emergencyContact || '');
  const [profileAllergies, setProfileAllergies] = useState(user?.medicalHistory?.allergies?.join(', ') || '');
  const [profileChronic, setProfileChronic] = useState(user?.medicalHistory?.chronicConditions?.join(', ') || '');
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  const fetchMyAppointments = async () => {
    setIsLoading(true);
    try {
      const res = await api.getMyAppointments();
      if (res.success) {
        setAppointments(res.appointments);
      }
    } catch (err) {
      console.error('Failed to load appointments:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMyAppointments();
  }, []);

  const handleCancelAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cancelModalAppointment) return;

    try {
      const res = await api.cancelAppointment(cancelModalAppointment._id, cancelReason || 'Patient requested cancellation');
      if (res.success) {
        showToast('Appointment Cancelled', 'Your booking has been cancelled and refund initiated if paid.', 'info');
        setCancelModalAppointment(null);
        setCancelReason('');
        fetchMyAppointments();
      }
    } catch (err: any) {
      showToast('Error', err.message || 'Failed to cancel appointment.', 'error');
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingProfile(true);
    try {
      const res = await api.updateProfile({
        name: profileName.trim(),
        phone: profilePhone.trim(),
        bloodGroup: profileBloodGroup,
        emergencyContact: profileEmergencyContact.trim(),
        medicalHistory: {
          allergies: profileAllergies.split(',').map((s) => s.trim()).filter(Boolean),
          chronicConditions: profileChronic.split(',').map((s) => s.trim()).filter(Boolean),
        },
      });

      if (res.success) {
        updateUser(res.user);
        showToast('Profile Updated', 'Medical record & personal info saved.', 'success');
      }
    } catch (err: any) {
      showToast('Error', err.message || 'Failed to update profile.', 'error');
    } finally {
      setIsSavingProfile(false);
    }
  };

  const completedPrescriptions = appointments.filter(
    (a) => a.status === 'completed' && a.prescription && a.prescription.diagnosis
  );

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-slate-950 text-slate-900 dark:text-white py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Header Profile Bar */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-black text-2xl shadow-md shadow-blue-600/20">
              {user?.name?.[0] || 'P'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">{user?.name}</h1>
                <span className="px-2.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 text-[10px] font-bold border border-blue-200 dark:border-blue-800 uppercase">
                  Patient Portal
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {user?.email} • {user?.phone || 'No phone set'} • Blood Group: <strong className="text-rose-600">{user?.bloodGroup || 'O+'}</strong>
              </p>
            </div>
          </div>

          <Link
            to="/doctors"
            className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-600/20 flex items-center gap-2 transition-all"
          >
            <Calendar className="w-4 h-4" /> Book New Consultation
          </Link>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 space-x-2 sm:space-x-4 overflow-x-auto">
          {[
            { id: 'appointments', label: 'My Appointments', icon: Calendar, count: appointments.length },
            { id: 'prescriptions', label: 'Digital Prescriptions', icon: FileText, count: completedPrescriptions.length },
            { id: 'profile', label: 'Medical Profile & Health Data', icon: User },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  setSearchParams({ tab: tab.id });
                }}
                className={`pb-3 pt-2 px-3 sm:px-4 text-xs sm:text-sm font-bold flex items-center gap-2 border-b-2 transition-all whitespace-nowrap ${
                  isActive
                    ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
                {tab.count !== undefined && (
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                    isActive ? 'bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                  }`}>
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Tab 1: My Appointments */}
        {activeTab === 'appointments' && (
          <div className="space-y-4">
            {isLoading ? (
              <div className="py-16 text-center text-xs text-slate-500">Loading your appointments history...</div>
            ) : appointments.length === 0 ? (
              <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-3">
                <Calendar className="w-12 h-12 text-slate-400 mx-auto" />
                <h3 className="text-base font-bold text-slate-900 dark:text-white">No Appointments Booked Yet</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Find certified specialists across Cardiology, Dermatology, Orthopedics, and more.
                </p>
                <Link to="/doctors" className="inline-block px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold shadow-md shadow-blue-600/20">
                  Browse Specialist Doctors
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {appointments.map((app) => (
                  <div
                    key={app._id}
                    className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-sm hover:border-blue-300 dark:hover:border-blue-800 transition-all flex flex-col md:flex-row justify-between items-start md:items-center gap-5"
                  >
                    {/* Left: Doctor & Appointment Details */}
                    <div className="space-y-2 max-w-xl">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-mono font-bold">
                          Token: #{app.queueTokenNumber || app.tokenNumber}
                        </span>
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                          app.status === 'confirmed'
                            ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800'
                            : app.status === 'completed'
                            ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300'
                            : app.status === 'cancelled'
                            ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300'
                            : 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300'
                        }`}>
                          ● {app.status}
                        </span>
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                          app.paymentStatus === 'paid'
                            ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300'
                            : 'bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300'
                        }`}>
                          Payment: {app.paymentStatus?.toUpperCase()} (₹{app.consultationFee})
                        </span>
                      </div>

                      <div className="flex items-center gap-2 pt-1">
                        <Stethoscope className="w-4 h-4 text-blue-600 flex-shrink-0" />
                        <span className="text-base font-bold text-slate-900 dark:text-white">
                          {app.doctorName}
                        </span>
                        <span className="text-xs text-blue-600 dark:text-blue-400 font-semibold">({app.specialization})</span>
                      </div>

                      <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
                        <span className="flex items-center gap-1">
                          <Building2 className="w-3.5 h-3.5 text-slate-400" /> {app.hospitalName}
                        </span>
                        <span className="flex items-center gap-1 font-semibold text-slate-900 dark:text-white">
                          <Calendar className="w-3.5 h-3.5 text-blue-600" /> {app.appointmentDate}
                        </span>
                        <span className="flex items-center gap-1 font-semibold text-slate-900 dark:text-white">
                          <Clock className="w-3.5 h-3.5 text-blue-600" /> {app.appointmentTime}
                        </span>
                      </div>

                      <p className="text-xs text-slate-600 dark:text-slate-300 italic pt-1">
                        Reason: "{app.reason}"
                      </p>
                    </div>

                    {/* Right: Actions */}
                    <div className="flex flex-wrap md:flex-col gap-2 w-full md:w-auto justify-end">
                      {/* View Receipt */}
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedAppointment(app);
                          setIsReceiptOpen(true);
                        }}
                        className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold flex items-center gap-1.5"
                      >
                        <FileDown className="w-3.5 h-3.5 text-blue-600" />
                        <span>Download PDF Receipt</span>
                      </button>

                      {/* If payment pending, Pay Now */}
                      {app.paymentStatus === 'pending' && app.status !== 'cancelled' && (
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedAppointment(app);
                            setIsPayOpen(true);
                          }}
                          className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm shadow-blue-600/20"
                        >
                          <CreditCard className="w-3.5 h-3.5" />
                          <span>Pay ₹{app.consultationFee}</span>
                        </button>
                      )}

                      {/* Reschedule Button if upcoming */}
                      {['pending', 'confirmed'].includes(app.status) && (
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedAppointment(app);
                              setIsRescheduleOpen(true);
                            }}
                            className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-blue-400 text-slate-700 dark:text-slate-300 text-xs font-semibold flex items-center gap-1"
                          >
                            <RotateCcw className="w-3.5 h-3.5" /> Reschedule
                          </button>

                          <button
                            type="button"
                            onClick={() => setCancelModalAppointment(app)}
                            className="px-3 py-1.5 rounded-xl text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-xs font-semibold flex items-center gap-1"
                          >
                            <XCircle className="w-3.5 h-3.5" /> Cancel
                          </button>
                        </div>
                      )}

                      {/* Leave Review if completed */}
                      {app.status === 'completed' && (
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedAppointment(app);
                            setIsReviewOpen(true);
                          }}
                          className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm"
                        >
                          <Star className="w-3.5 h-3.5 fill-white" />
                          <span>Rate Consultation</span>
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Digital Prescriptions */}
        {activeTab === 'prescriptions' && (
          <div className="space-y-4">
            {completedPrescriptions.length === 0 ? (
              <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-2">
                <FileText className="w-12 h-12 text-slate-400 mx-auto" />
                <h3 className="text-base font-bold text-slate-900 dark:text-white">No Prescriptions Issued Yet</h3>
                <p className="text-xs text-slate-500">
                  After your consultation is completed, your doctor's digital prescription and medication plan will appear here.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {completedPrescriptions.map((app) => (
                  <div
                    key={app._id}
                    className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4"
                  >
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-base text-slate-900 dark:text-white">{app.doctorName}</h3>
                          <span className="text-xs text-blue-600 font-semibold">({app.specialization})</span>
                        </div>
                        <p className="text-xs text-slate-500">Consultation Date: {app.appointmentDate}</p>
                      </div>
                      <span className="px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 text-xs font-bold border border-blue-200 dark:border-blue-800">
                        Prescription Verified
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">Clinical Diagnosis:</span>
                      <p className="text-sm font-semibold text-slate-900 dark:text-white mt-0.5">
                        {app.prescription?.diagnosis}
                      </p>
                    </div>

                    {app.prescription?.medicines && app.prescription.medicines.length > 0 && (
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block mb-2">Prescribed Medicines & Dosage:</span>
                        <div className="overflow-x-auto">
                          <table className="w-full text-left text-xs border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
                            <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 font-bold uppercase text-[10px]">
                              <tr>
                                <th className="p-2.5">Medicine</th>
                                <th className="p-2.5">Dosage</th>
                                <th className="p-2.5">Frequency</th>
                                <th className="p-2.5">Duration</th>
                                <th className="p-2.5">Instructions</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                              {app.prescription.medicines.map((m, idx) => (
                                <tr key={idx} className="hover:bg-slate-50/50">
                                  <td className="p-2.5 font-bold text-slate-900 dark:text-white">{m.name}</td>
                                  <td className="p-2.5">{m.dosage}</td>
                                  <td className="p-2.5">{m.frequency}</td>
                                  <td className="p-2.5">{m.duration}</td>
                                  <td className="p-2.5 text-slate-500">{m.instructions || '-'}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    {app.prescription?.advice && (
                      <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 text-xs">
                        <span className="font-bold text-slate-700 dark:text-slate-300 block mb-0.5">Doctor's Clinical Advice:</span>
                        <p className="text-slate-600 dark:text-slate-400 italic">{app.prescription.advice}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Medical Profile & Health Data */}
        {activeTab === 'profile' && (
          <div className="max-w-2xl bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-sm space-y-6">
            <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <User className="w-5 h-5 text-blue-600" /> Patient Medical Profile
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Update emergency details, blood group, and allergy records shared with your consulting doctors.
              </p>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Full Name: *
                </label>
                <input
                  type="text"
                  required
                  value={profileName}
                  onChange={(e) => setProfileName(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                    Phone Number:
                  </label>
                  <input
                    type="tel"
                    value={profilePhone}
                    onChange={(e) => setProfilePhone(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                    Blood Group:
                  </label>
                  <select
                    value={profileBloodGroup}
                    onChange={(e) => setProfileBloodGroup(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-rose-600 focus:ring-2 focus:ring-blue-500"
                  >
                    {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((bg) => (
                      <option key={bg} value={bg}>{bg}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Emergency Contact Number:
                </label>
                <input
                  type="tel"
                  value={profileEmergencyContact}
                  onChange={(e) => setProfileEmergencyContact(e.target.value)}
                  placeholder="+91 99887 76655 (Relative / Guardian)"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Known Drug / Food Allergies (comma separated):
                </label>
                <input
                  type="text"
                  value={profileAllergies}
                  onChange={(e) => setProfileAllergies(e.target.value)}
                  placeholder="e.g. Penicillin, Peanuts, Sulfa drugs"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Chronic Health Conditions (comma separated):
                </label>
                <input
                  type="text"
                  value={profileChronic}
                  onChange={(e) => setProfileChronic(e.target.value)}
                  placeholder="e.g. Hypertension, Type 2 Diabetes, Asthma"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <button
                type="submit"
                disabled={isSavingProfile}
                className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-600/20 transition-all"
              >
                {isSavingProfile ? 'Saving...' : 'Save Health Profile'}
              </button>
            </form>
          </div>
        )}
      </div>

      {/* Modals */}
      {selectedAppointment && (
        <ReceiptModal
          isOpen={isReceiptOpen}
          onClose={() => setIsReceiptOpen(false)}
          appointment={selectedAppointment}
        />
      )}

      {selectedAppointment && (
        <RazorpayModal
          isOpen={isPayOpen}
          onClose={() => setIsPayOpen(false)}
          appointment={selectedAppointment}
          onSuccess={() => {
            fetchMyAppointments();
            setIsPayOpen(false);
          }}
        />
      )}

      {selectedAppointment && (
        <RescheduleModal
          isOpen={isRescheduleOpen}
          onClose={() => setIsRescheduleOpen(false)}
          appointment={selectedAppointment}
          onSuccess={() => {
            fetchMyAppointments();
            setIsRescheduleOpen(false);
          }}
        />
      )}

      {selectedAppointment && (
        <ReviewDoctorModal
          isOpen={isReviewOpen}
          onClose={() => setIsReviewOpen(false)}
          appointment={selectedAppointment}
          onSuccess={() => {
            fetchMyAppointments();
            setIsReviewOpen(false);
          }}
        />
      )}

      {/* Cancel Confirmation Modal */}
      {cancelModalAppointment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-sm w-full border border-slate-200 dark:border-slate-800 space-y-4 shadow-2xl">
            <div className="flex items-center gap-2 text-rose-600">
              <AlertCircle className="w-5 h-5" />
              <h3 className="font-bold text-base text-slate-900 dark:text-white">Cancel Appointment</h3>
            </div>
            <p className="text-xs text-slate-500">
              Are you sure you want to cancel your consultation with{' '}
              <strong>{cancelModalAppointment.doctorName}</strong> on{' '}
              <strong>{cancelModalAppointment.appointmentDate}</strong>?
            </p>
            <form onSubmit={handleCancelAppointment} className="space-y-3">
              <input
                type="text"
                placeholder="Reason for cancellation (optional)"
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs bg-slate-50 dark:bg-slate-800"
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setCancelModalAppointment(null)}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold"
                >
                  Keep Appointment
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-xl bg-rose-600 text-white text-xs font-bold"
                >
                  Confirm Cancellation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
