import React, { useState, useEffect } from 'react';
import {
  Stethoscope,
  Users,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  Plus,
  Trash2,
  FileText,
  DollarSign,
  TrendingUp,
  Settings,
  X,
  Phone,
  ShieldCheck
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';
import { useNotifications } from '../context/NotificationContext.tsx';
import { api } from '../services/api.ts';
import { IAppointment, IDoctor, IPrescriptionMedicine } from '../types.ts';

export const DoctorDashboard: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useNotifications();

  const [appointments, setAppointments] = useState<IAppointment[]>([]);
  const [doctorProfile, setDoctorProfile] = useState<IDoctor | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState<'queue' | 'schedule' | 'history'>('queue');

  // Digital Prescription Modal State
  const [prescribingAppointment, setPrescribingAppointment] = useState<IAppointment | null>(null);
  const [diagnosis, setDiagnosis] = useState('');
  const [advice, setAdvice] = useState('');
  const [followUpDate, setFollowUpDate] = useState('');
  const [medicines, setMedicines] = useState<IPrescriptionMedicine[]>([
    { name: '', dosage: '1 tablet', frequency: 'Twice daily after meals', duration: '5 days', instructions: 'Take with warm water' },
  ]);
  const [isSavingPrescription, setIsSavingPrescription] = useState(false);

  // Schedule Management State
  const [availableDays, setAvailableDays] = useState<string[]>([]);
  const [startHour, setStartHour] = useState('09:00 AM');
  const [endHour, setEndHour] = useState('05:00 PM');
  const [consultationFee, setConsultationFee] = useState(500);
  const [slotDuration, setSlotDuration] = useState(20);
  const [isSavingSchedule, setIsSavingSchedule] = useState(false);

  const fetchDoctorData = async () => {
    setIsLoading(true);
    try {
      // 1. Fetch appointments for this doctor
      const appRes = await api.getMyAppointments();
      if (appRes.success) {
        setAppointments(appRes.appointments);
      }

      // 2. Fetch doctor profile details if available
      const docRes = await api.getDoctors();
      if (docRes.success && docRes.doctors) {
        const matched = docRes.doctors.find((d) => d.userId === user?.id || d.email === user?.email);
        if (matched) {
          setDoctorProfile(matched);
          setAvailableDays(matched.availableDays || []);
          if (matched.workingHours) {
            setStartHour(matched.workingHours.start);
            setEndHour(matched.workingHours.end);
          }
          setConsultationFee(matched.consultationFee);
          setSlotDuration(matched.slotDurationMinutes || 20);
        }
      }
    } catch (err) {
      console.error('Failed to load doctor dashboard data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDoctorData();
  }, [user]);

  const handleAddMedicine = () => {
    setMedicines([
      ...medicines,
      { name: '', dosage: '1 tablet', frequency: 'Twice daily', duration: '3 days', instructions: '' },
    ]);
  };

  const handleRemoveMedicine = (index: number) => {
    setMedicines(medicines.filter((_, i) => i !== index));
  };

  const handleUpdateMedicine = (index: number, field: keyof IPrescriptionMedicine, value: string) => {
    const updated = [...medicines];
    updated[index][field] = value;
    setMedicines(updated);
  };

  const handleOpenPrescriptionModal = (app: IAppointment) => {
    setPrescribingAppointment(app);
    setDiagnosis(app.prescription?.diagnosis || '');
    setAdvice(app.prescription?.advice || '');
    setFollowUpDate(app.prescription?.followUpDate || '');
    if (app.prescription?.medicines && app.prescription.medicines.length > 0) {
      setMedicines(app.prescription.medicines);
    } else {
      setMedicines([
        { name: 'Paracetamol 650mg', dosage: '1 tablet', frequency: 'Twice daily after food', duration: '3 days', instructions: 'SOS for fever' },
      ]);
    }
  };

  const handleSavePrescription = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prescribingAppointment) return;

    if (!diagnosis.trim()) {
      showToast('Diagnosis Required', 'Please enter a clinical diagnosis.', 'warning');
      return;
    }

    setIsSavingPrescription(true);
    try {
      const res = await api.createPrescription(prescribingAppointment._id, {
        diagnosis: diagnosis.trim(),
        symptoms: [prescribingAppointment.reason],
        medicines: medicines.filter((m) => m.name.trim().length > 0),
        advice: advice.trim(),
        followUpDate: followUpDate || undefined,
      });

      if (res.success) {
        showToast('Prescription Issued', 'Consultation marked completed and prescription sent to patient.', 'success');
        setPrescribingAppointment(null);
        fetchDoctorData();
      }
    } catch (err: any) {
      showToast('Error', err.message || 'Failed to save prescription.', 'error');
    } finally {
      setIsSavingPrescription(false);
    }
  };

  const handleStatusChange = async (appointmentId: string, status: string) => {
    try {
      const res = await api.updateAppointmentStatus(appointmentId, status);
      if (res.success) {
        showToast('Status Updated', `Appointment marked as ${status}.`, 'info');
        fetchDoctorData();
      }
    } catch (err: any) {
      showToast('Error', err.message || 'Failed to update status.', 'error');
    }
  };

  const handleSaveSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!doctorProfile) return;

    setIsSavingSchedule(true);
    try {
      const res = await api.updateDoctor(doctorProfile._id, {
        availableDays,
        workingHours: { start: startHour, end: endHour },
        consultationFee: Number(consultationFee),
        slotDurationMinutes: Number(slotDuration),
      });

      if (res.success) {
        showToast('Schedule Saved', 'OPD consultation availability updated.', 'success');
      }
    } catch (err: any) {
      showToast('Error', err.message || 'Failed to update schedule.', 'error');
    } finally {
      setIsSavingSchedule(false);
    }
  };

  // Stats calculation
  const totalConsultations = appointments.length;
  const todayStr = new Date().toISOString().split('T')[0];
  const todayAppointments = appointments.filter((a) => a.appointmentDate === todayStr);
  const completedToday = todayAppointments.filter((a) => a.status === 'completed').length;
  const totalRevenue = appointments
    .filter((a) => a.paymentStatus === 'paid')
    .reduce((sum, a) => sum + (a.consultationFee || 0), 0);

  const activeQueue = appointments.filter((a) => ['pending', 'confirmed'].includes(a.status));
  const historyQueue = appointments.filter((a) => ['completed', 'cancelled'].includes(a.status));

  const allDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-slate-950 text-slate-900 dark:text-white py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Doctor Header Banner */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-black text-2xl shadow-md shadow-blue-600/20">
              <Stethoscope className="w-8 h-8" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">{user?.name}</h1>
                <span className="px-2.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 text-[10px] font-bold border border-blue-200 dark:border-blue-800 uppercase">
                  Doctor Clinical Portal
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {doctorProfile?.specialization || 'Consultant Specialist'} • {doctorProfile?.hospitalName || 'MediCare Partner Hospital'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-xs font-bold flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> Live OPD Active
            </span>
          </div>
        </div>

        {/* 4 Analytics Metrics Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Bookings</span>
            <p className="text-2xl font-black text-slate-900 dark:text-white">{totalConsultations}</p>
            <span className="text-xs text-blue-600 font-semibold flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5" /> All time consultations
            </span>
          </div>

          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Today's OPD Queue</span>
            <p className="text-2xl font-black text-blue-600">{todayAppointments.length}</p>
            <span className="text-xs text-slate-500 font-medium">Scheduled for today</span>
          </div>

          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Completed Today</span>
            <p className="text-2xl font-black text-emerald-600">{completedToday}</p>
            <span className="text-xs text-emerald-600 font-medium">Digital records issued</span>
          </div>

          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Consultation Earnings</span>
            <p className="text-2xl font-black text-slate-900 dark:text-white">₹{totalRevenue}</p>
            <span className="text-xs text-blue-600 font-semibold">Settled via Razorpay</span>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 space-x-4">
          <button
            onClick={() => setSelectedTab('queue')}
            className={`pb-3 text-xs sm:text-sm font-bold border-b-2 transition-all flex items-center gap-2 ${
              selectedTab === 'queue'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Users className="w-4 h-4" /> Active OPD Queue ({activeQueue.length})
          </button>

          <button
            onClick={() => setSelectedTab('history')}
            className={`pb-3 text-xs sm:text-sm font-bold border-b-2 transition-all flex items-center gap-2 ${
              selectedTab === 'history'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <FileText className="w-4 h-4" /> Completed History ({historyQueue.length})
          </button>

          <button
            onClick={() => setSelectedTab('schedule')}
            className={`pb-3 text-xs sm:text-sm font-bold border-b-2 transition-all flex items-center gap-2 ${
              selectedTab === 'schedule'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Settings className="w-4 h-4" /> Practice Schedule & OPD Fees
          </button>
        </div>

        {/* Tab 1: Active OPD Queue */}
        {selectedTab === 'queue' && (
          <div className="space-y-4">
            {isLoading ? (
              <div className="py-12 text-center text-xs text-slate-500">Loading patient queue...</div>
            ) : activeQueue.length === 0 ? (
              <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-2">
                <Users className="w-12 h-12 text-slate-400 mx-auto" />
                <h3 className="text-base font-bold text-slate-900 dark:text-white">No Pending Patients in Queue</h3>
                <p className="text-xs text-slate-500">All booked appointments have been consulted or none are scheduled.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {activeQueue.map((app) => (
                  <div
                    key={app._id}
                    className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-sm hover:border-blue-300 dark:hover:border-blue-800 transition-all flex flex-col md:flex-row justify-between items-start md:items-center gap-5"
                  >
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="px-3 py-1 rounded-full bg-blue-600 text-white font-mono font-black text-xs">
                          TOKEN #{app.queueTokenNumber || app.tokenNumber}
                        </span>
                        <span className="px-2.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 text-xs font-bold uppercase">
                          {app.status}
                        </span>
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                          app.paymentStatus === 'paid' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                        }`}>
                          {app.paymentStatus === 'paid' ? '₹ Paid' : 'Payment Pending'}
                        </span>
                      </div>

                      <div className="pt-1">
                        <h3 className="font-bold text-lg text-slate-900 dark:text-white">
                          {app.patientName}{' '}
                          <span className="text-xs font-normal text-slate-500">
                            ({app.patientAge || 28} Yrs • {app.patientGender || 'Male'})
                          </span>
                        </h3>
                        <p className="text-xs text-slate-500 flex items-center gap-3 mt-0.5">
                          <span>📞 {app.patientPhone}</span>
                          <span>✉️ {app.patientEmail}</span>
                        </p>
                      </div>

                      <div className="flex items-center gap-4 text-xs text-slate-600 dark:text-slate-300">
                        <span className="flex items-center gap-1 font-semibold text-blue-600">
                          <Calendar className="w-3.5 h-3.5" /> {app.appointmentDate}
                        </span>
                        <span className="flex items-center gap-1 font-semibold text-blue-600">
                          <Clock className="w-3.5 h-3.5" /> {app.appointmentTime}
                        </span>
                      </div>

                      <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 text-xs">
                        <span className="font-bold text-slate-500 block text-[10px] uppercase">Reason for Consultation:</span>
                        <p className="text-slate-800 dark:text-slate-200 mt-0.5">{app.reason}</p>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2 w-full md:w-auto">
                      <button
                        onClick={() => handleOpenPrescriptionModal(app)}
                        className="px-4 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-black shadow-md shadow-blue-600/20 flex items-center justify-center gap-2 transition-all"
                      >
                        <FileText className="w-4 h-4" />
                        <span>Write Prescription & Complete</span>
                      </button>

                      <div className="flex gap-2">
                        {app.status === 'pending' && (
                          <button
                            onClick={() => handleStatusChange(app._id, 'confirmed')}
                            className="w-full px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-sm"
                          >
                            Confirm
                          </button>
                        )}
                        <button
                          onClick={() => handleStatusChange(app._id, 'cancelled')}
                          className="w-full px-3 py-1.5 rounded-xl text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-xs font-semibold"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Completed History */}
        {selectedTab === 'history' && (
          <div className="space-y-4">
            {historyQueue.length === 0 ? (
              <div className="p-12 text-center text-xs text-slate-500 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800">
                No past appointment history.
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3">
                {historyQueue.map((app) => (
                  <div
                    key={app._id}
                    className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex justify-between items-center text-xs hover:border-blue-200 transition-all"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-slate-900 dark:text-white">{app.patientName}</span>
                        <span className="font-mono text-slate-400">Token #{app.queueTokenNumber || app.tokenNumber}</span>
                        <span className={`px-2 py-0.5 rounded-full font-bold uppercase text-[10px] ${
                          app.status === 'completed' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                        }`}>
                          {app.status}
                        </span>
                      </div>
                      <p className="text-slate-500 mt-1">
                        Date: {app.appointmentDate} • Slot: {app.appointmentTime} • Fee: ₹{app.consultationFee}
                      </p>
                      {app.prescription?.diagnosis && (
                        <p className="text-blue-600 dark:text-blue-400 font-medium mt-1">
                          Diagnosis: {app.prescription.diagnosis}
                        </p>
                      )}
                    </div>

                    {app.status === 'completed' && (
                      <button
                        onClick={() => handleOpenPrescriptionModal(app)}
                        className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-blue-400 text-slate-700 dark:text-slate-300 font-semibold"
                      >
                        View / Edit Prescription
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Practice Schedule & OPD Fees */}
        {selectedTab === 'schedule' && (
          <div className="max-w-2xl bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-sm space-y-6">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">OPD Practice Schedule & Consultation Fees</h2>
              <p className="text-xs text-slate-500">Configure your hospital visiting days, OPD timings, and consultation fee.</p>
            </div>

            <form onSubmit={handleSaveSchedule} className="space-y-5">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                  Active Consultation Days:
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {allDays.map((day) => {
                    const isSelected = availableDays.includes(day);
                    return (
                      <button
                        key={day}
                        type="button"
                        onClick={() => {
                          if (isSelected) setAvailableDays(availableDays.filter((d) => d !== day));
                          else setAvailableDays([...availableDays, day]);
                        }}
                        className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all ${
                          isSelected
                            ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                            : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-blue-300'
                        }`}
                      >
                        {day}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                    OPD Start Time:
                  </label>
                  <input
                    type="text"
                    value={startHour}
                    onChange={(e) => setStartHour(e.target.value)}
                    placeholder="09:00 AM"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                    OPD End Time:
                  </label>
                  <input
                    type="text"
                    value={endHour}
                    onChange={(e) => setEndHour(e.target.value)}
                    placeholder="05:00 PM"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                    OPD Consultation Fee (₹):
                  </label>
                  <input
                    type="number"
                    value={consultationFee}
                    onChange={(e) => setConsultationFee(Number(e.target.value))}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                    Slot Duration (Minutes):
                  </label>
                  <select
                    value={slotDuration}
                    onChange={(e) => setSlotDuration(Number(e.target.value))}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs focus:ring-2 focus:ring-blue-500"
                  >
                    <option value={15}>15 Minutes</option>
                    <option value={20}>20 Minutes</option>
                    <option value={30}>30 Minutes</option>
                    <option value={45}>45 Minutes</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSavingSchedule}
                className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-600/20 transition-all"
              >
                {isSavingSchedule ? 'Saving...' : 'Update Practice Schedule'}
              </button>
            </form>
          </div>
        )}
      </div>

      {/* Digital Prescription Modal */}
      {prescribingAppointment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/75 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 max-w-3xl w-full border border-slate-200 dark:border-slate-800 shadow-2xl space-y-5 my-8">
            <div className="flex justify-between items-start border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <FileText className="w-5 h-5 text-blue-600" /> Digital Prescription & Medical Record
                </h3>
                <p className="text-xs text-slate-500">
                  Patient: <strong>{prescribingAppointment.patientName}</strong> (Token #{prescribingAppointment.queueTokenNumber || prescribingAppointment.tokenNumber})
                </p>
              </div>
              <button
                onClick={() => setPrescribingAppointment(null)}
                className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePrescription} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Clinical Diagnosis: *
                </label>
                <input
                  type="text"
                  required
                  value={diagnosis}
                  onChange={(e) => setDiagnosis(e.target.value)}
                  placeholder="e.g. Acute Bronchitis / Stage 1 Essential Hypertension"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Prescribed Medicines:
                  </label>
                  <button
                    type="button"
                    onClick={handleAddMedicine}
                    className="text-xs font-bold text-blue-600 flex items-center gap-1 hover:underline"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Medicine
                  </button>
                </div>

                <div className="space-y-2.5 max-h-56 overflow-y-auto p-1">
                  {medicines.map((med, i) => (
                    <div key={i} className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 grid grid-cols-1 sm:grid-cols-12 gap-2 items-center text-xs">
                      <div className="sm:col-span-4">
                        <input
                          type="text"
                          required
                          placeholder="Medicine Name (e.g. Augmentin 625)"
                          value={med.name}
                          onChange={(e) => handleUpdateMedicine(i, 'name', e.target.value)}
                          className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-xs focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <input
                          type="text"
                          placeholder="Dosage (1 tab)"
                          value={med.dosage}
                          onChange={(e) => handleUpdateMedicine(i, 'dosage', e.target.value)}
                          className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-xs"
                        />
                      </div>
                      <div className="sm:col-span-3">
                        <input
                          type="text"
                          placeholder="Frequency (Twice daily)"
                          value={med.frequency}
                          onChange={(e) => handleUpdateMedicine(i, 'frequency', e.target.value)}
                          className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-xs"
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <input
                          type="text"
                          placeholder="Duration (5 days)"
                          value={med.duration}
                          onChange={(e) => handleUpdateMedicine(i, 'duration', e.target.value)}
                          className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-xs"
                        />
                      </div>
                      <div className="sm:col-span-1 text-center">
                        {medicines.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveMedicine(i)}
                            className="p-1 text-rose-500 hover:text-rose-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Clinical Advice / Dietary Instructions:
                </label>
                <textarea
                  rows={2}
                  value={advice}
                  onChange={(e) => setAdvice(e.target.value)}
                  placeholder="e.g. Drink 3L warm fluids daily. Avoid oily foods. Review if fever persists over 48 hours."
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Follow-up Review Date:
                </label>
                <input
                  type="date"
                  value={followUpDate}
                  onChange={(e) => setFollowUpDate(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setPrescribingAppointment(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingPrescription}
                  className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-600/20 transition-all"
                >
                  {isSavingPrescription ? 'Issuing...' : 'Save & Issue Digital Prescription'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
